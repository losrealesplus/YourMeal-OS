"""TEST SQLite CAS only. No networking, SQL executor or production adapter."""
import hashlib, json, os, pathlib, sqlite3, stat, sys

def deny(message):
    raise ValueError(message)

def pairs(items):
    result = {}
    for key, value in items:
        if key in result: deny('DUPLICATE_KEY')
        result[key] = value
    return result

try:
    request = json.loads(sys.stdin.read(65537), object_pairs_hook=pairs)
    if set(request) != {'path', 'operation', 'args'}: deny('SCHEMA_INVALID')
    path = pathlib.Path(request['path'])
    parent = path.parent
    if str(parent) != os.path.realpath(parent) or not parent.name.startswith('a5-root-lab-'):
        deny('LOCAL_ONLY')
    if str(parent.parent) not in ('/private/tmp', '/tmp'): deny('LOCAL_ONLY')
    mode = parent.stat()
    if mode.st_uid != os.getuid() or stat.S_IMODE(mode.st_mode) != 0o700: deny('LOCAL_ONLY')
    if path.name not in ('authority.sqlite', 'worker.sqlite') or path.is_symlink(): deny('LOCAL_ONLY')
    if path.exists() and (path.stat().st_uid != os.getuid() or stat.S_IMODE(path.stat().st_mode) != 0o600): deny('LOCAL_ONLY')
    os.umask(0o077)
    db = sqlite3.connect(str(path), timeout=15, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA synchronous=FULL')
    db.executescript('''
      CREATE TABLE IF NOT EXISTS auth(id TEXT PRIMARY KEY, nonce TEXT UNIQUE NOT NULL, session TEXT UNIQUE NOT NULL,
        state TEXT NOT NULL, expiry INTEGER NOT NULL, body TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS creds(id TEXT PRIMARY KEY, counter INTEGER NOT NULL, active INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS admission(id TEXT PRIMARY KEY, session TEXT NOT NULL UNIQUE, nonce TEXT NOT NULL UNIQUE);
      CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL, previous TEXT NOT NULL, hash TEXT NOT NULL);
    ''')
    args = request['args']; op = request['operation']; db.execute('BEGIN IMMEDIATE')
    def event(body):
        prev = db.execute('SELECT hash FROM events ORDER BY seq DESC LIMIT 1').fetchone()
        previous = prev['hash'] if prev else '0'*64
        encoded = json.dumps(body, sort_keys=True, separators=(',', ':'))
        h = hashlib.sha256((previous + '\0' + encoded).encode()).hexdigest()
        db.execute('INSERT INTO events(body,previous,hash) VALUES(?,?,?)', (encoded,previous,h))
    def auth():
        row = db.execute('SELECT * FROM auth WHERE id=?',(args['id'],)).fetchone()
        if not row: deny('AUTH_MISSING')
        return row
    def transition(row, state, body=None):
        db.execute('UPDATE auth SET state=?,body=?,version=version+1 WHERE id=? AND version=?',
          (state, json.dumps(body) if body is not None else row['body'],row['id'],row['version']))
        event({'id':row['id'],'from':row['state'],'to':state,'version':row['version']+1})
    if op == 'register':
        db.execute('INSERT INTO creds VALUES(?,?,1)', (args['id'],args['counter']))
        result = {'registered': True}
    elif op == 'prepare':
        db.execute('INSERT INTO auth(id,nonce,session,state,expiry,body) VALUES(?,?,?,\'PREPARED\',?,?)',
            (args['id'], args['nonce'],args['session'],args['expiry'],json.dumps(args['body'])))
        event({'id':args['id'],'to':'PREPARED'}); result = {'prepared':True}
    elif op in ('read', 'credential', 'audit'):
        if op == 'read': result = dict(auth())
        elif op == 'credential':
            row=db.execute('SELECT * FROM creds WHERE id=?',(args['id'],)).fetchone()
            if not row: deny('CREDENTIAL_MISSING')
            result=dict(row)
        else: result = [dict(r) for r in db.execute('SELECT * FROM events ORDER BY seq')]
    elif op == 'verify':
        row=auth(); cred=db.execute('SELECT * FROM creds WHERE id=?',(args['credential'],)).fetchone()
        if row['state'] != 'PREPARED' or args['now'] >= row['expiry']: deny('VERIFY_DENIED')
        prepared=json.loads(row['body'])
        context=prepared['context']
        if args['now'] < context['challengeIssuedAt'] or args['now'] >= context['challengeExpiresAt']: deny('CHALLENGE_EXPIRED_AT_CAS')
        if args['body']['context'] != context or args['body']['intent'] != prepared['intent']: deny('FROZEN_BINDING')
        if not cred or not cred['active'] or cred['counter'] != args['before'] or args['after'] <= args['before']: deny('COUNTER_OR_CREDENTIAL')
        db.execute('UPDATE creds SET counter=? WHERE id=?',(args['after'],args['credential']))
        transition(row,'VERIFIED',args['body']); result={'verified':True}
    elif op == 'consume':
        row=auth()
        if row['state'] != 'VERIFIED' or args['now']+120 >= row['expiry'] or args['session'] != row['session']: deny('CONSUME_DENIED')
        body=json.loads(row['body']); cred=db.execute('SELECT active FROM creds WHERE id=?',(body['credentialId'],)).fetchone()
        if not cred or not cred['active']: deny('CREDENTIAL_REVOKED')
        transition(row,'CONSUMED_SESSION_OPEN'); result={'opened':True}
    elif op == 'admit':
        db.execute('INSERT INTO admission VALUES(?,?,?)',(args['id'],args['session'],args['nonce']))
        result={'admitted':True}
    elif op in ('start', 'verified'):
        row=auth(); index=args['index']; now=args['now']
        if index not in (1,2,3) or args['session'] != row['session']: deny('STEP_SCOPE')
        expected = ('CONSUMED_SESSION_OPEN' if index==1 else 'STEP%d_VERIFIED' % (index-1)) if op=='start' else 'STEP%d_STARTED' % index
        if row['state'] != expected: deny('STEP_STATE')
        if op=='start':
            if now+120 >= row['expiry']: deny('EXPIRED')
            body=json.loads(row['body']); c=db.execute('SELECT active FROM creds WHERE id=?',(body['credentialId'],)).fetchone()
            if not c or not c['active']: deny('CREDENTIAL_REVOKED')
        transition(row,'STEP%d_%s' % (index,'STARTED' if op=='start' else 'VERIFIED')); result={'state': 'STEP%d_%s' % (index,'STARTED' if op=='start' else 'VERIFIED')}
    elif op == 'complete':
        row=auth()
        if row['state'] != 'STEP3_VERIFIED' or args['session'] != row['session']: deny('STEP_STATE')
        transition(row,'COMPLETE'); result={'state':'COMPLETE'}
    elif op in ('revoke', 'uncertain', 'expire'):
        row=auth()
        if row['state'] in ('COMPLETE','REVOKED','UNCERTAIN','EXPIRED'): deny('TERMINAL')
        state={'revoke':'REVOKED','uncertain':'UNCERTAIN','expire':'EXPIRED'}[op]
        if op=='expire' and args['now'] < row['expiry']: deny('NOT_EXPIRED')
        transition(row,state); result={'state':state}
    elif op == 'revoke_credential':
        db.execute('UPDATE creds SET active=0 WHERE id=?',(args['id'],)); result={'revoked':True}
    else: deny('OPERATION_DENIED')
    db.commit()
    # Test-only lost-response injection after durable commit; never repeats a SQL operation.
    if args.get('testCrashAfterCommit') is True: os._exit(73)
    print(json.dumps({'ok':True,'result':result}, separators=(',',':')))
except Exception as e:
    print(json.dumps({'ok':False,'error':str(e)}, separators=(',',':')))
    sys.exit(1)

// Isolated qualification only. Production is unconditionally disabled.
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"syscall"
	"testing/fstest"
	"time"

	"github.com/jackc/pgx/v4"
	"github.com/supabase/cli/pkg/migration"
)

const sourceSHA = "c37c00c1d5d34babf0c8d5c38ad0f578017b717f"
const project = "nhirlpkuvonggctdzzad"
const tenant = "8bba00ba-331b-42c8-9283-4e3836ffb870"
const denied = "PRODUCTION_AUTHORITY_BINDING_REQUIRED"
const baselineVersions = "20260720164312 20260720164327 20260720170834 20260720210000 20260720220000 20260721190000 20260722172703 20260722172737 20260723120000 20260723174724 20260723183000 20260723190000 20260723193459 20260723200000 20260723200100 20260724132839 20260724132857 20260724160000 20260724170000 20260724185434 20260725120000 20260725123000 20260728200000 20260728202853 20260728202923 20260728210000 20260728220000 20260729100000 20260729120000 20260729184500 20260729184828 20260729184916 20260729190000 20260729191000 20260809172400 20260809181400 20260810143000 20260810180000 20260823170000 20260824120000 20260824124512 20260824125000 20260824125500 20260824130000 20260824174800 20260925203000 20260926170000 20260926180000 20260926190000 20260927120000 20260927200000 20260927210000 20260927220000 20260927221000 20260928205110 20261005113919 20261005131410 20261005174218 20261005174256 20261006072046 20261006110000"

type Entry struct {
	Path    string `json:"path"`
	Version string `json:"version"`
	Name    string `json:"name"`
	SHA256  string `json:"sha256"`
}

var frozen = []Entry{
	{"supabase/migrations/20261007020208_cr_order_a5_lifecycle_ledger_expand.sql", "20261007020208", "cr_order_a5_lifecycle_ledger_expand", "a4ae81e745ec556485b004aaff218af97dcd1b60d8f32a430a2b01440491dc47"},
	{"supabase/migrations/20261007020245_cr_order_a5_lifecycle_writer.sql", "20261007020245", "cr_order_a5_lifecycle_writer", "ffb41a798cddf851b34dc2bc7f63590edb33cdf3c69c1fa7b75ac914aeddf310"},
	{"supabase/migrations/20261007020849_cr_order_a5_audit_uuid_compatibility.sql", "20261007020849", "cr_order_a5_audit_uuid_compatibility", "303cd5971c63c726caa5cce234045baefba48a464d90c6150b3298e536024f4f"},
}

type Manifest struct {
	SchemaVersion  int         `json:"schemaVersion"`
	Mode           string      `json:"mode"`
	SourceSHA      string      `json:"sourceSha"`
	ProjectRef     string      `json:"projectRef"`
	TenantID       string      `json:"tenantId"`
	Entries        []Entry     `json:"entries"`
	BaselineLedger []LedgerRow `json:"baselineLedger"`
	SchemaHashes   []string    `json:"schemaHashes"`
}
type LedgerRow struct {
	Version    string   `json:"version"`
	Name       string   `json:"name"`
	Statements []string `json:"statements"`
}
type Proof struct {
	Version              string   `json:"version"`
	Name                 string   `json:"name"`
	OriginalHash         string   `json:"originalHash"`
	StatementHashes      []string `json:"statementHashes"`
	Offsets              [][2]int `json:"offsets"`
	TransactionPreserved bool     `json:"transactionPreserved"`
}
type Result struct {
	State        string  `json:"state"`
	Reconciled   string  `json:"reconciled,omitempty"`
	ManifestHash string  `json:"manifestHash"`
	LedgerBefore string  `json:"ledgerBefore,omitempty"`
	LedgerAfter  string  `json:"ledgerAfter,omitempty"`
	SchemaAfter  string  `json:"schemaAfter,omitempty"`
	Proofs       []Proof `json:"proofs,omitempty"`
}

func digest(b []byte) string  { h := sha256.Sum256(b); return hex.EncodeToString(h[:]) }
func jsonDigest(v any) string { b, _ := json.Marshal(v); return digest(b) }
func strictDecode(b []byte, v any) error {
	// Reject duplicate keys as well as unknown fields: encoding/json alone permits duplicate keys.
	d := json.NewDecoder(strings.NewReader(string(b)))
	if err := uniqueJSON(d); err != nil {
		return err
	}
	if _, err := d.Token(); err != io.EOF {
		return errors.New("INVALID_JSON_TRAILING")
	}
	if err := exactFields(b, reflect.TypeOf(v).Elem()); err != nil {
		return err
	}
	d = json.NewDecoder(strings.NewReader(string(b)))
	d.DisallowUnknownFields()
	return d.Decode(v)
}

// encoding/json otherwise accepts differently-cased struct field names.
func exactFields(b []byte, typ reflect.Type) error {
	switch typ.Kind() {
	case reflect.Struct:
		var obj map[string]json.RawMessage
		if err := json.Unmarshal(b, &obj); err != nil || obj == nil {
			return errors.New("JSON_OBJECT_REQUIRED")
		}
		fields := map[string]reflect.Type{}
		for i := 0; i < typ.NumField(); i++ {
			f := typ.Field(i)
			fields[strings.Split(f.Tag.Get("json"), ",")[0]] = f.Type
		}
		for key, raw := range obj {
			ft, ok := fields[key]
			if !ok {
				return errors.New("UNKNOWN_FIELD")
			}
			if err := exactFields(raw, ft); err != nil {
				return err
			}
		}
	case reflect.Slice:
		var arr []json.RawMessage
		if err := json.Unmarshal(b, &arr); err != nil {
			return errors.New("JSON_ARRAY_REQUIRED")
		}
		for _, raw := range arr {
			if err := exactFields(raw, typ.Elem()); err != nil {
				return err
			}
		}
	}
	return nil
}
func uniqueJSON(d *json.Decoder) error {
	t, e := d.Token()
	if e != nil {
		return e
	}
	delim, ok := t.(json.Delim)
	if !ok {
		return nil
	}
	if delim == '{' {
		seen := map[string]bool{}
		for d.More() {
			k, e := d.Token()
			if e != nil {
				return e
			}
			s, ok := k.(string)
			if !ok || seen[s] {
				return errors.New("DUPLICATE_JSON_KEY")
			}
			seen[s] = true
			if e = uniqueJSON(d); e != nil {
				return e
			}
		}
	} else if delim == '[' {
		for d.More() {
			if e = uniqueJSON(d); e != nil {
				return e
			}
		}
	} else {
		return errors.New("INVALID_JSON")
	}
	_, e = d.Token()
	return e
}
func validateManifest(m Manifest) error {
	if m.Mode != "isolated-qualification" {
		return errors.New(denied)
	}
	if m.SchemaVersion != 1 || m.SourceSHA != sourceSHA || m.ProjectRef != project || m.TenantID != tenant || !reflect.DeepEqual(m.Entries, frozen) {
		return errors.New("FROZEN_MANIFEST_MISMATCH")
	}
	vs := strings.Fields(baselineVersions)
	if len(m.BaselineLedger) != 61 || len(m.SchemaHashes) != 4 {
		return errors.New("BASELINE_MISMATCH")
	}
	for i, r := range m.BaselineLedger {
		if r.Version != vs[i] || r.Name != "synthetic_baseline" || !reflect.DeepEqual(r.Statements, []string{"SELECT 1"}) {
			return errors.New("BASELINE_MISMATCH")
		}
	}
	for _, s := range m.SchemaHashes {
		b, e := hex.DecodeString(s)
		if e != nil || len(b) != 32 {
			return errors.New("SCHEMA_HASH_INVALID")
		}
	}
	return nil
}
func plainPath(root, relative string) error {
	if filepath.IsAbs(relative) || filepath.Clean(relative) != relative || strings.HasPrefix(relative, "..") {
		return errors.New("PATH_INVALID")
	}
	for _, p := range strings.Split(relative, string(os.PathSeparator)) {
		root = filepath.Join(root, p)
		s, e := os.Lstat(root)
		if e != nil {
			return errors.New("SOURCE_UNAVAILABLE")
		}
		if s.Mode()&os.ModeSymlink != 0 {
			return errors.New("SYMLINK_REJECTED")
		}
	}
	return nil
}
func verifiedMigrations(repo string) ([]*migration.MigrationFile, []Proof, error) {
	files := []*migration.MigrationFile{}
	proofs := []Proof{}
	for _, e := range frozen {
		if err := plainPath(repo, e.Path); err != nil {
			return nil, nil, err
		}
		b, err := os.ReadFile(filepath.Join(repo, e.Path))
		if err != nil || digest(b) != e.SHA256 {
			return nil, nil, errors.New("SOURCE_HASH_MISMATCH")
		}
		original, err := exec.Command("git", "-C", repo, "show", sourceSHA+":"+e.Path).Output()
		if err != nil || !reflect.DeepEqual(original, b) {
			return nil, nil, errors.New("SOURCE_BLOB_MISMATCH")
		}
		f, err := migration.NewMigrationFromFile(e.Path, fstest.MapFS{e.Path: &fstest.MapFile{Data: b}})
		if err != nil {
			return nil, nil, errors.New("PARSER_FAILED")
		}
		if f.Version != e.Version || f.Name != e.Name {
			return nil, nil, errors.New("PARSER_IDENTITY_MISMATCH")
		}
		p, err := equivalence(b, f)
		if err != nil {
			return nil, nil, err
		}
		files = append(files, f)
		proofs = append(proofs, p)
	}
	return files, proofs, nil
}
func equivalence(b []byte, f *migration.MigrationFile) (Proof, error) {
	p := Proof{Version: f.Version, Name: f.Name, OriginalHash: digest(b)}
	cursor := 0
	for _, s := range f.Statements {
		rel := strings.Index(string(b[cursor:]), s)
		if s == "" || rel < 0 {
			return p, errors.New("PARSER_EQUIVALENCE_FAILED")
		}
		start := cursor + rel
		if strings.Trim(string(b[cursor:start]), "; \t\r\n\v\f") != "" {
			return p, errors.New("PARSER_GAP_INVALID")
		}
		p.Offsets = append(p.Offsets, [2]int{start, start + len(s)})
		p.StatementHashes = append(p.StatementHashes, digest([]byte(s)))
		cursor = start + len(s)
	}
	if strings.Trim(string(b[cursor:]), "; \t\r\n\v\f") != "" {
		return p, errors.New("PARSER_GAP_INVALID")
	}
	if len(f.Statements) < 2 || !strings.HasSuffix(strings.TrimSpace(f.Statements[0]), "BEGIN") || !strings.HasSuffix(strings.TrimSpace(f.Statements[len(f.Statements)-1]), "COMMIT") {
		return p, errors.New("TRANSACTION_CHANGED")
	}
	p.TransactionPreserved = true
	return p, nil
}

// No caller-supplied DSN, host, port, user or database. Unix sockets only.
// The cluster must be an owned disposable directory with a matching live postmaster PID.
func localConfig(root string) (*pgx.ConnConfig, error) {
	root = filepath.Clean(root)
	tmp, e := filepath.EvalSymlinks(os.TempDir())
	if e != nil {
		return nil, errors.New("ISOLATION_INVALID")
	}
	parent, parentErr := filepath.EvalSymlinks(filepath.Dir(root))
	if parentErr != nil || parent != tmp || !strings.HasPrefix(filepath.Base(root), "a5-executor-") {
		return nil, errors.New(denied)
	}
	s, e := os.Lstat(root)
	if e != nil || !s.IsDir() || s.Mode()&os.ModeSymlink != 0 || s.Mode().Perm() != 0700 {
		return nil, errors.New("ISOLATION_INVALID")
	}
	stat, ok := s.Sys().(*syscall.Stat_t)
	if !ok || int(stat.Uid) != os.Getuid() {
		return nil, errors.New("ISOLATION_OWNER_INVALID")
	}
	if e = plainPath(root, "data/postmaster.pid"); e != nil {
		return nil, e
	}
	b, e := os.ReadFile(filepath.Join(root, "data/postmaster.pid"))
	if e != nil {
		return nil, errors.New("ISOLATION_INVALID")
	}
	lines := strings.Split(string(b), "\n")
	pid, e := strconv.Atoi(lines[0])
	if e != nil || pid < 1 || syscall.Kill(pid, 0) != nil || len(lines) < 5 || lines[1] != filepath.Join(root, "data") || lines[3] != "55449" || lines[4] != root {
		return nil, errors.New("ISOLATION_PID_INVALID")
	}
	// Never consult a libpq service file or a user's password file.
	if os.Getenv("PGSERVICE") != "" {
		return nil, errors.New("LOCAL_CREDENTIAL_CONFIG_REJECTED")
	}
	cfg, e := pgx.ParseConfig("host=/dev/null port=55449 dbname=a5_qualification user=a5_migrator sslmode=disable passfile=/dev/null password=''")
	if e != nil {
		return nil, errors.New("LOCAL_CONFIG_INVALID")
	}
	cfg.Host = root
	cfg.Password = ""
	cfg.Fallbacks = nil
	cfg.RuntimeParams = map[string]string{"application_name": "a5-isolated-executor"}
	cfg.ConnectTimeout = 5 * time.Second
	cfg.DialFunc = func(ctx context.Context, network, address string) (net.Conn, error) {
		if network != "unix" || address != filepath.Join(root, ".s.PGSQL.55449") {
			return nil, errors.New(denied)
		}
		return (&net.Dialer{}).DialContext(ctx, "unix", address)
	}
	return cfg, nil
}
func connect(ctx context.Context, cfg *pgx.ConnConfig) (*pgx.Conn, error) {
	c, e := pgx.ConnectConfig(ctx, cfg)
	if e != nil {
		return nil, errors.New("LOCAL_CONNECTION_FAILED")
	}
	var dir, user, db, listen, cluster string
	var super, bypass, inherit, createRole, createDB bool
	e = c.QueryRow(ctx, `SELECT current_setting('data_directory'),current_user,current_database(),current_setting('listen_addresses'),current_setting('cluster_name'),rolsuper,rolbypassrls,rolinherit,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname=current_user`).Scan(&dir, &user, &db, &listen, &cluster, &super, &bypass, &inherit, &createRole, &createDB)
	if e != nil || dir != filepath.Join(cfg.Host, "data") || user != "a5_migrator" || db != "a5_qualification" || listen != "" || cluster != "a5-isolated-qualification" || super || bypass || inherit || createRole || createDB {
		c.Close(ctx)
		return nil, errors.New("ISOLATED_TARGET_ROLE_MISMATCH")
	}
	return c, nil
}
func ledger(ctx context.Context, c *pgx.Conn) ([]LedgerRow, error) {
	rows, e := c.Query(ctx, "SELECT version,coalesce(name,''),coalesce(statements,ARRAY[]::text[]) FROM supabase_migrations.schema_migrations ORDER BY version")
	if e != nil {
		return nil, errors.New("LEDGER_READ_FAILED")
	}
	defer rows.Close()
	out := []LedgerRow{}
	for rows.Next() {
		var r LedgerRow
		if e = rows.Scan(&r.Version, &r.Name, &r.Statements); e != nil {
			return nil, errors.New("LEDGER_READ_FAILED")
		}
		out = append(out, r)
	}
	if rows.Err() != nil {
		return nil, errors.New("LEDGER_READ_FAILED")
	}
	return out, nil
}

// Catalog only, never business rows; complete definitions and ACLs for the affected schemas.
const catalogSQL = `SELECT jsonb_build_object(
'schemas',(SELECT jsonb_agg(to_jsonb(x) ORDER BY nspname) FROM (SELECT nspname,nspowner::regrole::text,nspacl::text FROM pg_namespace WHERE nspname IN ('public','cr_order_private','auth','supabase_migrations')) x),
'relations',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schema,name) FROM (SELECT n.nspname schema,c.relname name,c.relkind,c.relowner::regrole::text owner,c.relacl::text,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','cr_order_private','auth','supabase_migrations')) x),
'columns',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schema,name,attnum) FROM (SELECT n.nspname schema,c.relname name,a.attnum,a.attname,format_type(a.atttypid,a.atttypmod) type,a.attnotnull,pg_get_expr(d.adbin,d.adrelid) default_expr FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname IN ('public','cr_order_private','auth','supabase_migrations') AND a.attnum>0 AND NOT a.attisdropped) x),
'constraints',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schema,name,conname) FROM (SELECT n.nspname schema,c.relname name,k.conname,pg_get_constraintdef(k.oid) def FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','cr_order_private','auth','supabase_migrations')) x),
'functions',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schema,name,args) FROM (SELECT n.nspname schema,p.proname name,pg_get_function_identity_arguments(p.oid) args,pg_get_functiondef(p.oid) def,p.proowner::regrole::text owner,p.proacl::text,p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','cr_order_private','auth') AND p.prokind='f') x),
'policies',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schemaname,tablename,policyname) FROM pg_policies x WHERE schemaname IN ('public','cr_order_private','auth')),
'triggers',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schema,name,tgname) FROM (SELECT n.nspname schema,c.relname name,t.tgname,pg_get_triggerdef(t.oid) def,t.tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname IN ('public','cr_order_private','auth')) x),
'indexes',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schemaname,tablename,indexname) FROM pg_indexes x WHERE schemaname IN ('public','cr_order_private','auth','supabase_migrations')),
'enums',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schema,name,enumsortorder) FROM (SELECT n.nspname schema,t.typname name,e.enumsortorder,e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('public','cr_order_private','auth')) x),
'memberships',(SELECT jsonb_agg(to_jsonb(x) ORDER BY role,member) FROM (SELECT roleid::regrole::text role,member::regrole::text member,grantor::regrole::text grantor,admin_option,inherit_option,set_option FROM pg_auth_members) x),
'defaultACL',(SELECT jsonb_agg(to_jsonb(x) ORDER BY owner,schema,defaclobjtype) FROM (SELECT defaclrole::regrole::text owner,coalesce(n.nspname,'') schema,defaclobjtype,defaclacl::text FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace) x),
'roles',(SELECT jsonb_agg(to_jsonb(x) ORDER BY rolname) FROM (SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolbypassrls FROM pg_roles WHERE rolname IN ('a5_migrator','cr_order_writer','postgres','anon','authenticated','service_role')) x))::text`

func schema(ctx context.Context, c *pgx.Conn) (string, error) {
	var s string
	e := c.QueryRow(ctx, catalogSQL).Scan(&s)
	if e != nil {
		return "", errors.New("CATALOG_READ_FAILED")
	}
	return digest([]byte(s)), nil
}
func prefix(m Manifest, files []*migration.MigrationFile, step int) []LedgerRow {
	r := append([]LedgerRow{}, m.BaselineLedger...)
	for i := 0; i < step; i++ {
		f := files[i]
		r = append(r, LedgerRow{f.Version, f.Name, f.Statements})
	}
	return r
}
func readOnlySnapshot(ctx context.Context, cfg *pgx.ConnConfig) ([]LedgerRow, string, error) {
	c, e := connect(ctx, cfg)
	if e != nil {
		return nil, "", e
	}
	defer c.Close(ctx)
	if _, e = c.Exec(ctx, "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"); e != nil {
		return nil, "", errors.New("READ_ONLY_RECONCILIATION_FAILED")
	}
	defer c.Exec(ctx, "ROLLBACK")
	var inFlight bool
	if err := c.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='a5-isolated-executor' AND pid<>pg_backend_pid() AND state IN ('active','idle in transaction','idle in transaction (aborted)'))").Scan(&inFlight); err != nil || inFlight {
		return nil, "", errors.New("RECONCILIATION_IN_FLIGHT")
	}
	r, e := ledger(ctx, c)
	if e != nil {
		return nil, "", e
	}
	s, e := schema(ctx, c)
	return r, s, e
}
func classify(before, after, observed []LedgerRow, pre, post, actual string) string {
	if reflect.DeepEqual(observed, after) && actual == post {
		return "DDL_COMMITTED_LEDGER_COMMITTED"
	}
	if reflect.DeepEqual(observed, before) && actual == pre {
		return "DDL_NOT_COMMITTED_LEDGER_NOT_COMMITTED"
	}
	if reflect.DeepEqual(observed, before) && actual == post {
		return "DDL_COMMITTED_LEDGER_MISSING"
	}
	return "STATE_INCONSISTENT"
}
func executeLocal(ctx context.Context, m Manifest, files []*migration.MigrationFile, step int, cfg *pgx.ConnConfig) (Result, error) {
	result := Result{ManifestHash: jsonDigest(m)}
	before := prefix(m, files, step)
	after := prefix(m, files, step+1)
	c, e := connect(ctx, cfg)
	if e != nil {
		return result, e
	}
	defer c.Close(context.Background())
	// Serialise all qualified invocations without wrapping explicit migration transactions.
	if _, e = c.Exec(ctx, "SELECT pg_advisory_lock(20261007,20208)"); e != nil {
		return result, errors.New("LOCK_FAILED")
	}
	defer c.Exec(context.Background(), "SELECT pg_advisory_unlock(20261007,20208)")
	rows, e := ledger(ctx, c)
	if e != nil {
		return result, e
	}
	for _, r := range rows {
		if r.Version == files[step].Version {
			return result, errors.New("DUPLICATE_VERSION_REJECTED")
		}
	}
	if !reflect.DeepEqual(rows, before) {
		return result, errors.New("LEDGER_PREFIX_MISMATCH")
	}
	s, e := schema(ctx, c)
	if e != nil {
		return result, e
	}
	if s != m.SchemaHashes[step] {
		return result, errors.New("SCHEMA_PRECHECK_FAILED")
	}
	result.LedgerBefore = jsonDigest(rows)
	e = files[step].ExecBatch(ctx, c) // Only official bookkeeping. Never retry.
	if e != nil {
		result.State = "OUTCOME_UNCERTAIN"
		c.Close(context.Background())
	} else {
		result.State = "POSTCHECK_PENDING"
	}
	reconcileCtx, reconcileCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer reconcileCancel()
	observed, actual, re := readOnlySnapshot(reconcileCtx, cfg)
	if re != nil {
		result.State = "OUTCOME_UNCERTAIN"
		return result, errors.New("RECONCILIATION_UNAVAILABLE")
	}
	result.LedgerAfter = jsonDigest(observed)
	result.SchemaAfter = actual
	result.Reconciled = classify(before, after, observed, m.SchemaHashes[step], m.SchemaHashes[step+1], actual)
	if e != nil {
		return result, errors.New("ENGINE_FAILED_SANITIZED")
	}
	if result.Reconciled != "DDL_COMMITTED_LEDGER_COMMITTED" {
		result.State = "POSTCHECK_FAILED"
		return result, errors.New("POSTCHECK_FAILED")
	}
	result.State = "LOCAL_STEP_VERIFIED_STOP"
	return result, nil
}
func run(args []string) (Result, error) {
	// No authority data or environment variable can enable production.
	f := flag.NewFlagSet("a5-executor", flag.ContinueOnError)
	f.SetOutput(io.Discard)
	manifest := f.String("manifest", "", "")
	repo := f.String("repo", "", "")
	isolation := f.String("isolation", "", "")
	step := f.Int("step", 0, "")
	execute := f.Bool("execute-local", false, "")
	reconcile := f.Bool("reconcile-local", false, "")
	if e := f.Parse(args); e != nil || f.NArg() != 0 {
		return Result{}, errors.New(denied)
	}
	b, e := os.ReadFile(*manifest)
	if e != nil {
		return Result{}, errors.New("MANIFEST_UNAVAILABLE")
	}
	var m Manifest
	if e = strictDecode(b, &m); e != nil {
		return Result{}, errors.New("MANIFEST_INVALID")
	}
	if e = validateManifest(m); e != nil {
		return Result{}, e
	}
	files, proofs, e := verifiedMigrations(*repo)
	if e != nil {
		return Result{}, e
	}
	r := Result{State: "DRY_RUN_NO_CONNECTION", ManifestHash: digest(b), Proofs: proofs}
	if *execute && *reconcile {
		return r, errors.New("LOCAL_MODE_INVALID")
	}
	if !*execute && !*reconcile {
		return r, nil
	}
	if *step < 1 || *step > 3 {
		return r, errors.New("STEP_INVALID")
	}
	cfg, e := localConfig(*isolation)
	if e != nil {
		return r, e
	}
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	if *reconcile {
		observed, actual, e := readOnlySnapshot(ctx, cfg)
		if e != nil {
			r.State = "OUTCOME_UNCERTAIN"
			return r, e
		}
		r.State = "READ_ONLY_RECONCILIATION"
		r.LedgerAfter = jsonDigest(observed)
		r.SchemaAfter = actual
		r.Reconciled = classify(prefix(m, files, *step-1), prefix(m, files, *step), observed, m.SchemaHashes[*step-1], m.SchemaHashes[*step], actual)
		return r, nil
	}
	x, e := executeLocal(ctx, m, files, *step-1, cfg)
	x.ManifestHash = digest(b)
	x.Proofs = proofs
	return x, e
}
func main() {
	r, e := run(os.Args[1:])
	if e != nil {
		r.State = func() string {
			if r.State != "" {
				return r.State
			}
			return "REJECTED"
		}()
	}
	out := struct {
		Result
		Error string `json:"error,omitempty"`
	}{Result: r}
	if e != nil {
		out.Error = e.Error()
	}
	b, _ := json.Marshal(out)
	fmt.Println(string(b))
	if e != nil {
		os.Exit(1)
	}
}

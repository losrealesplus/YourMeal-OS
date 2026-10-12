"""
Synthetic qualification suite for EatClean commercial offer pricing enforcement.
Runs in an isolated synthetic PG 17.6 container (Orbstack tmpfs).
No network, no production DSN, no production credentials.
Verifies Canonical V2 Order Engine integration (Alternativa A) and security hardening.
"""
import subprocess, time, json, pathlib

IMAGE = "public.ecr.aws/supabase/postgres@sha256:3866d94d8426927e8db3f1c5d790752292bfbe27b5f1f46e199ae1b7d3c1710b"
NAME = "eatclean-pricing-definitive-qualification"
ROOT = pathlib.Path(__file__).resolve().parents[4]

def docker(*args, input=None):
    return subprocess.run(
        ["docker", "--context", "orbstack", *args],
        input=input,
        text=True,
        capture_output=True,
        timeout=120,
    )

def sql(cmd, ok=True):
    r = docker("exec", "-i", NAME, "psql", "-X", "-q", "-t", "-A", "-U", "supabase_admin", "-d", "postgres", "-v", "ON_ERROR_STOP=1", input=cmd)
    if ok and r.returncode != 0:
        raise RuntimeError("SYNTHETIC_SQL_ERROR: " + r.stderr[:1500])
    return r

def scalar(cmd):
    return sql(cmd).stdout.strip().splitlines()[-1]

owned = False
checks = []

def check(name, condition, details=""):
    checks.append({"name": name, "result": "PASS" if condition else "FAIL", "details": details})
    if not condition:
        raise RuntimeError(f"Check failed: {name} - {details}")

try:
    if docker("ps", "-a", "--filter", f"name=^/{NAME}$", "--format", "{{.Names}}").stdout.strip():
        docker("rm", "-f", NAME)

    r = docker(
        "run",
        "-d",
        "--name",
        NAME,
        "--label",
        "yourmeal.pricing=definitive-qualification",
        "--network",
        "none",
        "--memory",
        "1536m",
        "--tmpfs",
        "/var/lib/postgresql/data:rw,size=1073741824",
        "-e",
        "POSTGRES_PASSWORD=p0-synthetic-pricing-only",
        IMAGE,
    )
    if r.returncode != 0:
        raise RuntimeError("CONTAINER_START_FAILED")
    owned = True

    for _ in range(100):
        if docker("exec", NAME, "pg_isready", "-h", "127.0.0.1", "-U", "supabase_admin").returncode == 0:
            break
        time.sleep(0.25)
    else:
        raise RuntimeError("PG_TIMEOUT")

    sql("CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT ALL ON storage.buckets,storage.objects TO postgres; GRANT USAGE,CREATE ON SCHEMA storage TO postgres;")

    skip = (
        "20261007020208_",
        "20261007020245_",
        "20261008112217_",
        "20261008160753_",
        "20261010155728_",
        "20261010155729_",
        "20261011163814_",
        "20261011190421_",
        "20261012173000_",
    )
    for p in sorted((ROOT / "supabase/migrations").glob("*.sql")):
        if p.name.startswith(skip):
            continue
        sql("SET ROLE postgres;\n" + p.read_text())

    # EatClean Tenant ID, Users, Customer
    T = "8bba00ba-331b-42c8-9283-4e3836ffb870"
    T2 = "11000000-0000-4000-8000-000000000002"
    U = "22000000-0000-4000-8000-000000000001"   # company_admin
    U2 = "22000000-0000-4000-8000-000000000002"  # customer
    C = "33000000-0000-4000-8000-000000000001"
    C2 = "33000000-0000-4000-8000-000000000002"

    init_sql = f"""
    INSERT INTO tenants(id,slug,name) VALUES('{T}','eatclean','EatClean'),('{T2}','foreign','Foreign');
    INSERT INTO auth.users(id) VALUES('{U}'),('{U2}');
    INSERT INTO tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T}','{U}','approved','customer'),('{T}','{U2}','approved','customer');
    INSERT INTO user_roles(user_id,tenant_id,role) VALUES('{U}','{T}','company_admin'),('{U2}','{T}','customer');
    INSERT INTO customers(id,tenant_id,user_id,kind,display_name) VALUES('{C}','{T}','{U2}','individual','Synthetic Customer'),('{C2}','{T}','{U}','individual','Admin Personal Customer');
    """
    sql(init_sql)

    # Insert 28 commercial offers for 2026-10-12 (Tuesday 13 to Friday 16: 4 mains, 3 extras per day)
    days = ["2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"]
    sql(f"INSERT INTO weekly_menus(id,tenant_id,week_start,status) VALUES('55000000-0000-4000-8000-000000000001','{T}','2026-10-12','published');")

    dish_inserts = []
    slot_inserts = []
    dish_map = {}

    idx = 1
    for day in days:
        # 4 mains @ 11.90
        for m in range(1, 5):
            d_id = f"44000000-0000-4000-8000-{idx:012d}"
            dish_inserts.append(f"('{d_id}', '{T}', 'Platillo Principal {idx}', 'active', 11.90)")
            slot_inserts.append(f"('55000000-0000-4000-8000-000000000001', '{T}', '{day}', '{d_id}', 11.90)")
            dish_map[f"main_{day}_{m}"] = d_id
            idx += 1
        # 1 Crema @ 2.50
        d_id = f"44000000-0000-4000-8000-{idx:012d}"
        dish_inserts.append(f"('{d_id}', '{T}', 'Crema del Dia {idx}', 'active', 2.50)")
        slot_inserts.append(f"('55000000-0000-4000-8000-000000000001', '{T}', '{day}', '{d_id}', 2.50)")
        dish_map[f"crema_{day}"] = d_id
        idx += 1
        # 1 Postre (Dessert) @ commercial 3.50 (differs from catalog price 2.50!)
        d_id = f"44000000-0000-4000-8000-{idx:012d}"
        dish_inserts.append(f"('{d_id}', '{T}', 'Postre Especial {idx}', 'active', 2.50)")
        slot_inserts.append(f"('55000000-0000-4000-8000-000000000001', '{T}', '{day}', '{d_id}', 3.50)")
        dish_map[f"postre_{day}"] = d_id
        idx += 1
        # 1 Zumo @ 2.50
        d_id = f"44000000-0000-4000-8000-{idx:012d}"
        dish_inserts.append(f"('{d_id}', '{T}', 'Zumo Natural {idx}', 'active', 2.50)")
        slot_inserts.append(f"('55000000-0000-4000-8000-000000000001', '{T}', '{day}', '{d_id}', 2.50)")
        dish_map[f"zumo_{day}"] = d_id
        idx += 1

    sql(f"INSERT INTO dishes(id, tenant_id, name, status, price) VALUES {','.join(dish_inserts)};")
    sql(f"INSERT INTO weekly_menu_slots(weekly_menu_id, tenant_id, day_date, dish_id, unit_price) VALUES {','.join(slot_inserts)};")

    check("ALL_28_SLOTS_INITIALIZED", scalar(f"SELECT count(*) FROM weekly_menu_slots WHERE tenant_id='{T}'") == "28", "28 commercial offers loaded")
    check("FOUR_DESSERTS_DIFFERENT_CATALOG_PRICE", scalar(f"SELECT count(*) FROM weekly_menu_slots s JOIN dishes d ON d.id=s.dish_id WHERE s.tenant_id='{T}' AND s.unit_price=3.50 AND d.price=2.50") == "4", "4 desserts differ from catalog (3.50 vs 2.50)")

    # Base migrations establishing baseline state as exists in production
    sql("SET ROLE postgres;\n" + (ROOT / "supabase/migrations/20261011163814_staff_existing_order_atomic_capture.sql").read_text())
    sql((ROOT / "supabase/migrations/20261011190421_eatclean_private_session_identity_bridge.sql").read_text())
    # In production, authenticated already has EXECUTE on capture_staff_existing_order
    sql("GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;")

    # Check pre-migration ACL
    pre_acl = scalar("SELECT has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE');")
    check("PRE_MIGRATION_ACL_ACTIVE", pre_acl == "t", "authenticated has EXECUTE privilege before migration")

    # Read and apply the new definitive migration
    migration_file = ROOT / "supabase/migrations/20261012173000_eatclean_staff_order_offer_pricing_enforcement.sql"
    sql("SET ROLE postgres;\n" + migration_file.read_text())

    # Check post-migration ACL: must remain active without manual re-granting!
    post_acl = scalar("SELECT has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE');")
    check("POST_MIGRATION_ACL_RETAINED", post_acl == "t", "authenticated retains EXECUTE privilege post-migration without re-grant")

    # Verify DDL Privilege Hardening (Revocation of TRIGGER and TRUNCATE)
    anon_trigger = scalar("SELECT has_table_privilege('anon', 'public.orders', 'TRIGGER');")
    auth_trigger = scalar("SELECT has_table_privilege('authenticated', 'public.orders', 'TRIGGER');")
    anon_trunc = scalar("SELECT has_table_privilege('anon', 'public.orders', 'TRUNCATE');")
    auth_trunc = scalar("SELECT has_table_privilege('authenticated', 'public.orders', 'TRUNCATE');")
    items_auth_trigger = scalar("SELECT has_table_privilege('authenticated', 'public.order_items', 'TRIGGER');")
    items_auth_trunc = scalar("SELECT has_table_privilege('authenticated', 'public.order_items', 'TRUNCATE');")
    check("DDL_PRIVILEGES_HARDENED", anon_trigger == 'f' and auth_trigger == 'f' and anon_trunc == 'f' and auth_trunc == 'f' and items_auth_trigger == 'f' and items_auth_trunc == 'f', "TRIGGER and TRUNCATE revoked from anon and authenticated")

    # Verify GUC bypass is completely absent from database functions
    guard_source = scalar("SELECT prosrc FROM pg_proc WHERE oid='cr_order_private.guard_legacy_offer()'::regprocedure")
    check("NO_GUC_BYPASS_IN_GUARD", "staff_capture_in_progress" not in guard_source, "No session config bypass in trigger")

    rpc_source = scalar("SELECT prosrc FROM pg_proc WHERE oid='public.capture_staff_existing_order(uuid,jsonb)'::regprocedure")
    check("NO_GUC_BYPASS_IN_RPC", "staff_capture_in_progress" not in rpc_source, "No session config setting in RPC")

    # Verify PG_CONTEXT is completely removed from guard_legacy_offer
    check("NO_PG_CONTEXT_IN_GUARD", "PG_CONTEXT" not in guard_source, "No call stack inspection in trigger guard")

    # Verify guard owner is cr_order_writer
    guard_owner = scalar("SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid='cr_order_private.guard_legacy_offer()'::regprocedure")
    check("GUARD_OWNER_CR_ORDER_WRITER", guard_owner == "cr_order_writer", f"Guard owner is {guard_owner}")

    def state():
        return scalar("SELECT concat((SELECT count(*) FROM orders),':',(SELECT count(*) FROM order_items),':',(SELECT count(*) FROM audit_log WHERE entity_type='order'))")

    # Helpers for Canonical V2 Quote & Commit Flow
    comm_ctx = {
        "active": True,
        "mode": "individual_line_pricing_v1",
        "policyHash": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }

    def v2_quote_and_commit(lines, request_id, actor=U, tenant=T, customer=C, autoConfirm=False):
        cmd = {
            "operation": "capture",
            "customer": {"kind": "existing", "id": customer},
            "weekStart": "2026-10-12",
            "lines": lines,
            "autoConfirm": autoConfirm
        }
        issue_sql = f"""
        SET ROLE service_role;
        SELECT public.cr_order_offer_quote_issue(
          '{tenant}'::uuid,
          '{actor}'::uuid,
          '{request_id}'::uuid,
          '{json.dumps(cmd)}'::jsonb,
          '{json.dumps(comm_ctx)}'::jsonb
        );
        """
        r_issue = sql(issue_sql, ok=False)
        if r_issue.returncode != 0:
            return r_issue, None
        quote = json.loads(r_issue.stdout.strip().splitlines()[-1])
        quote_id = quote["quoteId"]

        commit_sql = f"""
        SET ROLE service_role;
        SELECT public.cr_order_offer_quote_commit(
          '{tenant}'::uuid,
          '{actor}'::uuid,
          '{request_id}'::uuid,
          '{quote_id}'::uuid,
          '{json.dumps(cmd)}'::jsonb,
          '{json.dumps(comm_ctx)}'::jsonb
        );
        """
        r_commit = sql(commit_sql, ok=False)
        return r_commit, quote

    # 1. Test Canonical V2: Dessert @ 3.50 auto-quoted and committed
    req1 = "a1000000-0000-4000-8000-000000000001"
    r1, q1 = v2_quote_and_commit(
        [{"kind": "dish", "dishId": dish_map["postre_2026-10-13"], "dayDate": "2026-10-13", "qty": 1}],
        req1,
        autoConfirm=False
    )
    check("CANONICAL_V2_DESSERT_QUOTED_3_50", q1 is not None and q1["total"] == "3.50", f"Quote total is 3.50 (got {q1['total'] if q1 else 'None'})")
    check("CANONICAL_V2_DESSERT_COMMITTED_3_50", r1.returncode == 0 and json.loads(r1.stdout.strip().splitlines()[-1])["order"]["total"] == 3.50, "Order committed at 3.50 €")

    # 2. Test Canonical V2 Idempotency: Replaying exact same request ID succeeds with replayed = True
    commit_replay_sql = f"""
    SET ROLE service_role;
    SELECT public.cr_order_offer_quote_commit(
      '{T}'::uuid,
      '{U}'::uuid,
      '{req1}'::uuid,
      '{q1["quoteId"]}'::uuid,
      '{json.dumps({"operation": "capture", "customer": {"kind": "existing", "id": C}, "weekStart": "2026-10-12", "lines": [{"kind": "dish", "dishId": dish_map["postre_2026-10-13"], "dayDate": "2026-10-13", "qty": 1}], "autoConfirm": False})}'::jsonb,
      '{json.dumps(comm_ctx)}'::jsonb
    );
    """
    r_replay = sql(commit_replay_sql, ok=False)
    res_replay = json.loads(r_replay.stdout.strip().splitlines()[-1])
    check("CANONICAL_V2_IDEMPOTENCY_REPLAYED", r_replay.returncode == 0 and res_replay.get("replayed") is True, "Idempotent replay returned replayed: true")

    # 3. Test Canonical V2: Request ID conflict when tampering payload with same request_id
    tampered_cmd = {"operation": "capture", "customer": {"kind": "existing", "id": C}, "weekStart": "2026-10-12", "lines": [{"kind": "dish", "dishId": dish_map["postre_2026-10-13"], "dayDate": "2026-10-13", "qty": 2}], "autoConfirm": False}
    commit_conflict_sql = f"""
    SET ROLE service_role;
    SELECT public.cr_order_offer_quote_commit(
      '{T}'::uuid,
      '{U}'::uuid,
      '{req1}'::uuid,
      '{q1["quoteId"]}'::uuid,
      '{json.dumps(tampered_cmd)}'::jsonb,
      '{json.dumps(comm_ctx)}'::jsonb
    );
    """
    r_conflict = sql(commit_conflict_sql, ok=False)
    check("CANONICAL_V2_REQUEST_ID_CONFLICT_REJECTED", r_conflict.returncode != 0 and ("QUOTE_INPUT_MISMATCH" in r_conflict.stderr or "REQUEST_ID_CONFLICT" in r_conflict.stderr), "Tampered payload with committed request ID rejected")

    # 4. Test Canonical V2 Full Combo Order: 1 Main (11.90) + 1 Crema (2.50) + 1 Postre (3.50) + 1 Zumo (2.50) = 20.40 €
    req4 = "a1000000-0000-4000-8000-000000000004"
    combo = [
        {"kind": "dish", "dishId": dish_map["main_2026-10-14_1"], "dayDate": "2026-10-14", "qty": 1},
        {"kind": "dish", "dishId": dish_map["crema_2026-10-14"], "dayDate": "2026-10-14", "qty": 1},
        {"kind": "dish", "dishId": dish_map["postre_2026-10-14"], "dayDate": "2026-10-14", "qty": 1},
        {"kind": "dish", "dishId": dish_map["zumo_2026-10-14"], "dayDate": "2026-10-14", "qty": 1},
    ]
    r4, q4 = v2_quote_and_commit(combo, req4, autoConfirm=True)
    res4 = json.loads(r4.stdout.strip().splitlines()[-1])
    check("CANONICAL_V2_COMBO_ORDER_TOTAL_20_40", r4.returncode == 0 and res4["order"]["total"] == 20.40 and res4["order"]["status"] == "confirmed", "Combo total 20.40 € calculated and confirmed")

    # 5. Test Unauthorized Actor (Customer role U2) cannot issue V2 quote
    req5 = "a1000000-0000-4000-8000-000000000005"
    r5, _ = v2_quote_and_commit([{"kind": "dish", "dishId": dish_map["main_2026-10-13_1"], "dayDate": "2026-10-13", "qty": 1}], req5, actor=U2, customer=C2)
    check("CANONICAL_V2_UNAUTHORIZED_CUSTOMER_REJECTED", r5.returncode != 0 and "PERMISSION_DENIED" in r5.stderr, "Customer role cannot issue V2 quote for other customer")

    # 6. Test Foreign Tenant rejected in V2
    req6 = "a1000000-0000-4000-8000-000000000006"
    r6, _ = v2_quote_and_commit([{"kind": "dish", "dishId": dish_map["main_2026-10-13_1"], "dayDate": "2026-10-13", "qty": 1}], req6, tenant=T2)
    check("CANONICAL_V2_FOREIGN_TENANT_REJECTED", r6.returncode != 0 and ("PERMISSION_DENIED" in r6.stderr or "TENANT_MISMATCH" in r6.stderr or "NOT_FOUND" in r6.stderr), "Foreign tenant rejected")

    # 7. PRESERVATION OF V2 CONTRACT: Direct Legacy Writer attempting to insert an explicit offer
    # Even if unit_price matches 3.50 EXACTLY, direct legacy write MUST BE REJECTED with OFFER_PRICING_QUOTE_REQUIRED!
    st_before = state()
    direct_legacy_sql = f"""
    BEGIN;
    SET SESSION AUTHORIZATION authenticated;
    SELECT set_config('request.jwt.claim.sub','{U}',false);
    INSERT INTO public.orders(id,tenant_id,customer_id,week_start,status,total)
    VALUES('99000000-0000-4000-8000-000000000001','{T}','{C}','2026-10-12','draft',3.50);
    INSERT INTO public.order_items(tenant_id,order_id,dish_id,day_date,qty,unit_price)
    VALUES('{T}','99000000-0000-4000-8000-000000000001','{dish_map["postre_2026-10-13"]}','2026-10-13',1,3.50);
    COMMIT;
    """
    r_direct = sql(direct_legacy_sql, ok=False)
    check("DIRECT_LEGACY_WRITER_EXPLICIT_OFFER_STRICTLY_REJECTED", r_direct.returncode != 0 and "OFFER_PRICING_QUOTE_REQUIRED" in r_direct.stderr and state() == st_before, "Direct legacy insert of explicit offer strictly rejected with OFFER_PRICING_QUOTE_REQUIRED even if matching price")

    # 8. Direct Legacy Writer attempting tampered price 0.01 also strictly rejected
    direct_legacy_tampered = f"""
    BEGIN;
    SET SESSION AUTHORIZATION authenticated;
    SELECT set_config('request.jwt.claim.sub','{U}',false);
    INSERT INTO public.orders(id,tenant_id,customer_id,week_start,status,total)
    VALUES('99000000-0000-4000-8000-000000000002','{T}','{C}','2026-10-12','draft',0.01);
    INSERT INTO public.order_items(tenant_id,order_id,dish_id,day_date,qty,unit_price)
    VALUES('{T}','99000000-0000-4000-8000-000000000002','{dish_map["postre_2026-10-13"]}','2026-10-13',1,0.01);
    COMMIT;
    """
    r_direct_tampered = sql(direct_legacy_tampered, ok=False)
    check("DIRECT_LEGACY_WRITER_TAMPERED_PRICE_STRICTLY_REJECTED", r_direct_tampered.returncode != 0 and "OFFER_PRICING_QUOTE_REQUIRED" in r_direct_tampered.stderr and state() == st_before, "Direct legacy insert with 0.01 strictly rejected with OFFER_PRICING_QUOTE_REQUIRED")

    # 9. Test Ambiguous Duplicate Slots with Different Prices for Same Dish and Date
    sql(f"INSERT INTO weekly_menu_slots(weekly_menu_id, tenant_id, day_date, dish_id, unit_price) VALUES('55000000-0000-4000-8000-000000000001', '{T}', '2026-10-15', '{dish_map['postre_2026-10-15']}', 4.50);")
    req9 = "a1000000-0000-4000-8000-000000000009"
    r9, _ = v2_quote_and_commit([{"kind": "dish", "dishId": dish_map["postre_2026-10-15"], "dayDate": "2026-10-15", "qty": 1}], req9)
    check("AMBIGUOUS_DUPLICATE_SLOTS_REJECTED", r9.returncode != 0 and "OFFER_AMBIGUOUS" in r9.stderr, "Two slots with different prices for same dish/day rejected as OFFER_AMBIGUOUS in V2")
    sql(f"DELETE FROM weekly_menu_slots WHERE tenant_id='{T}' AND day_date='2026-10-15' AND dish_id='{dish_map['postre_2026-10-15']}' AND unit_price=4.50;")

    # 10. Verify persisted orders in DB: exactly 2 orders created (req1 and req4)
    orders_count = scalar(f"SELECT count(*) FROM orders WHERE tenant_id='{T}'")
    check("PERSISTED_ORDERS_COUNT_EXACT", orders_count == "2", f"Orders count: {orders_count}")

    # 11. Verify write_contract_version = 2 and revision tracking on persisted orders
    v2_versions = scalar(f"SELECT count(*) FROM orders WHERE tenant_id='{T}' AND write_contract_version=2")
    check("ALL_ORDERS_WRITE_CONTRACT_VERSION_2", v2_versions == "2", "All captured orders have write_contract_version = 2")

    print(json.dumps({"status": "EATCLEAN_CANONICAL_V2_PRICING_PASS", "checks": checks, "totalSlotsVerified": 28}, indent=2))

finally:
    if owned:
        docker("rm", "-f", NAME)

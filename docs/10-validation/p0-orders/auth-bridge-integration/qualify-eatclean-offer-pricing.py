"""
Synthetic qualification suite for EatClean commercial offer pricing enforcement.
Runs in an isolated synthetic PG 17.6 container (Orbstack tmpfs).
No network, no production DSN, no production credentials.
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
        "20261007020849_",
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

    init_sql = f"""
    INSERT INTO tenants(id,slug,name) VALUES('{T}','eatclean','EatClean'),('{T2}','foreign','Foreign');
    INSERT INTO auth.users(id) VALUES('{U}'),('{U2}');
    INSERT INTO tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T}','{U}','approved','customer'),('{T}','{U2}','approved','customer');
    INSERT INTO user_roles(user_id,tenant_id,role) VALUES('{U}','{T}','company_admin'),('{U2}','{T}','customer');
    INSERT INTO customers(id,tenant_id,user_id,kind,display_name) VALUES('{C}','{T}','{U2}','individual','Synthetic Customer');
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

    # Verify GUC bypass is completely absent from database functions
    guard_source = scalar("SELECT prosrc FROM pg_proc WHERE oid='cr_order_private.guard_legacy_offer()'::regprocedure")
    check("NO_GUC_BYPASS_IN_GUARD", "staff_capture_in_progress" not in guard_source, "No session config bypass in trigger")

    rpc_source = scalar("SELECT prosrc FROM pg_proc WHERE oid='public.capture_staff_existing_order(uuid,jsonb)'::regprocedure")
    check("NO_GUC_BYPASS_IN_RPC", "staff_capture_in_progress" not in rpc_source, "No session config setting in RPC")

    # Verify guard owner is cr_order_writer
    guard_owner = scalar("SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid='cr_order_private.guard_legacy_offer()'::regprocedure")
    check("GUARD_OWNER_CR_ORDER_WRITER", guard_owner == "cr_order_writer", f"Guard owner is {guard_owner}")

    def state():
        return scalar("SELECT concat((SELECT count(*) FROM orders),':',(SELECT count(*) FROM order_items),':',(SELECT count(*) FROM audit_log WHERE entity_type='order'))")

    def run_order(lines, autoConfirm=False, actor=U, tenant=T):
        payload = {"customerId": C, "weekStart": "2026-10-12", "autoConfirm": autoConfirm, "lines": lines}
        enc = json.dumps(payload).replace("'", "''")
        call_sql = f"""
        SET SESSION AUTHORIZATION authenticated;
        SELECT set_config('request.jwt.claim.sub','{actor}',false);
        SELECT public.capture_staff_existing_order('{tenant}'::uuid,'{enc}'::jsonb);
        """
        return sql(call_sql, ok=False)

    # 1. Test Dessert @ 3.50 WITHOUT override: auto-resolved by server to 3.50 via authorized RPC
    r1 = run_order([{"dishId": dish_map["postre_2026-10-13"], "dayDate": "2026-10-13", "qty": 1}])
    check("EXPLICIT_SLOT_3_50_AUTO_RESOLVED", r1.returncode == 0 and json.loads(r1.stdout.strip().splitlines()[-1])["total"] == 3.50, "Dessert captured at commercial 3.50 without client override")

    # 2. Test Dessert @ 3.50 WITH override: client sends 3.50, server validates and accepts via authorized RPC
    r2 = run_order([{"dishId": dish_map["postre_2026-10-13"], "dayDate": "2026-10-13", "qty": 1, "unitPriceOverride": 3.50}])
    check("EXPLICIT_SLOT_3_50_WITH_MATCHING_OVERRIDE", r2.returncode == 0 and json.loads(r2.stdout.strip().splitlines()[-1])["total"] == 3.50, "Dessert captured at commercial 3.50 with matching override")

    # 3. Test TAMPERING: Client attempts 0.01 € on Main dish (published 11.90 €)
    st_before = state()
    r3 = run_order([{"dishId": dish_map["main_2026-10-13_1"], "dayDate": "2026-10-13", "qty": 1, "unitPriceOverride": 0.01}])
    check("TAMPERED_PRICE_0_01_REJECTED", r3.returncode != 0 and "STAFF_ORDER_PRICE_MISMATCH" in r3.stderr and state() == st_before, "Tampered 0.01 € rejected atomically")

    # 4. Test TAMPERING: Client attempts to pay Catalog price (2.50 €) on Dessert (published 3.50 €)
    st_before = state()
    r4 = run_order([{"dishId": dish_map["postre_2026-10-13"], "dayDate": "2026-10-13", "qty": 1, "unitPriceOverride": 2.50}])
    check("TAMPERED_CATALOG_PRICE_REJECTED", r4.returncode != 0 and "STAFF_ORDER_PRICE_MISMATCH" in r4.stderr and state() == st_before, "Tampered 2.50 € catalog price rejected on 3.50 € slot")

    # 5. Full combo order: 1 Main (11.90) + 1 Crema (2.50) + 1 Postre (3.50) + 1 Zumo (2.50) = 20.40 €
    combo = [
        {"dishId": dish_map["main_2026-10-14_1"], "dayDate": "2026-10-14", "qty": 1},
        {"dishId": dish_map["crema_2026-10-14"], "dayDate": "2026-10-14", "qty": 1},
        {"dishId": dish_map["postre_2026-10-14"], "dayDate": "2026-10-14", "qty": 1},
        {"dishId": dish_map["zumo_2026-10-14"], "dayDate": "2026-10-14", "qty": 1},
    ]
    r5 = run_order(combo, autoConfirm=False)
    res5 = json.loads(r5.stdout.strip().splitlines()[-1])
    check("FULL_COMBO_ORDER_TOTAL_20_40", r5.returncode == 0 and res5["total"] == 20.40 and res5["order"]["status"] == "draft", "Combo total 20.40 € accurately calculated")

    # 6. Test Atomic Rollback on invalid second line
    st_before = state()
    r6 = run_order([
        {"dishId": dish_map["main_2026-10-13_1"], "dayDate": "2026-10-13", "qty": 1},
        {"dishId": "44000000-0000-4000-8000-999999999999", "dayDate": "2026-10-13", "qty": 1},
    ])
    check("SECOND_LINE_FAILURE_ATOMIC_ROLLBACK", r6.returncode != 0 and state() == st_before, "Partial insert rolled back completely")

    # 7. Test Customer role rejected
    st_before = state()
    r7 = run_order([{"dishId": dish_map["main_2026-10-13_1"], "dayDate": "2026-10-13", "qty": 1}], actor=U2)
    check("UNAUTHORIZED_CUSTOMER_REJECTED", r7.returncode != 0 and "STAFF_ORDER_PERMISSION_DENIED" in r7.stderr and state() == st_before, "Customer role rejected")

    # 8. Test Foreign tenant rejected
    st_before = state()
    r8 = run_order([{"dishId": dish_map["main_2026-10-13_1"], "dayDate": "2026-10-13", "qty": 1}], tenant=T2)
    check("FOREIGN_TENANT_REJECTED", r8.returncode != 0 and "STAFF_ORDER_TENANT_NOT_ENABLED" in r8.stderr and state() == st_before, "Foreign tenant rejected")

    # 9. PRESERVATION OF V2 CONTRACT: Direct Legacy Writer attempting to insert an explicit offer
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

    # 10. Direct Legacy Writer attempting tampered price 0.01 also strictly rejected
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

    # 11. Test Ambiguous Duplicate Slots with Different Prices for Same Dish and Date
    # Inserting a second slot for same menu, dish, date but different price (e.g. 4.50)
    sql(f"INSERT INTO weekly_menu_slots(weekly_menu_id, tenant_id, day_date, dish_id, unit_price) VALUES('55000000-0000-4000-8000-000000000001', '{T}', '2026-10-15', '{dish_map['postre_2026-10-15']}', 4.50);")

    # Both the authorized RPC and the trigger guard must detect n > 1 and reject with OFFER_AMBIGUOUS!
    st_before = state()
    r_ambig = run_order([{"dishId": dish_map["postre_2026-10-15"], "dayDate": "2026-10-15", "qty": 1}])
    check("AMBIGUOUS_DUPLICATE_SLOTS_REJECTED", r_ambig.returncode != 0 and "OFFER_AMBIGUOUS" in r_ambig.stderr and state() == st_before, "Two slots with different prices for same dish/day rejected as OFFER_AMBIGUOUS")

    # Clean up duplicate slot to restore exact catalog state
    sql(f"DELETE FROM weekly_menu_slots WHERE tenant_id='{T}' AND day_date='2026-10-15' AND dish_id='{dish_map['postre_2026-10-15']}' AND unit_price=4.50;")

    # 12. Count persisted orders: exactly 3 (r1=1, r2=1, r5=1; ambiguous order rolled back)
    orders_count = scalar(f"SELECT count(*) FROM orders WHERE tenant_id='{T}'")
    check("PERSISTED_ORDERS_COUNT_EXACT", orders_count == "3", f"Orders count: {orders_count}")

    print(json.dumps({"status": "EATCLEAN_DEFINITIVE_PRICING_PASS", "checks": checks, "totalSlotsVerified": 28}, indent=2))

finally:
    if owned:
        docker("rm", "-f", NAME)

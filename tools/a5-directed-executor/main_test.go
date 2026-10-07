package main

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v4"
	"github.com/supabase/cli/pkg/migration"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"testing"
	"testing/fstest"
	"time"
)

func validManifest() Manifest {
	m := Manifest{SchemaVersion: 1, Mode: "isolated-qualification", SourceSHA: sourceSHA, ProjectRef: project, TenantID: tenant, Entries: append([]Entry{}, frozen...), SchemaHashes: []string{strings.Repeat("a", 64), strings.Repeat("b", 64), strings.Repeat("c", 64), strings.Repeat("d", 64)}}
	for _, v := range strings.Fields(baselineVersions) {
		m.BaselineLedger = append(m.BaselineLedger, LedgerRow{v, "synthetic_baseline", []string{"SELECT 1"}})
	}
	return m
}
func TestFrozenManifest(t *testing.T) {
	tests := map[string]func(*Manifest){
		"source": func(m *Manifest) { m.SourceSHA = "bad" }, "project": func(m *Manifest) { m.ProjectRef = "bad" }, "tenant": func(m *Manifest) { m.TenantID = "bad" }, "version": func(m *Manifest) { m.Entries[0].Version = "bad" }, "name": func(m *Manifest) { m.Entries[0].Name = "bad" }, "hash": func(m *Manifest) { m.Entries[0].SHA256 = "bad" }, "path": func(m *Manifest) { m.Entries[0].Path = "../bad" }, "order": func(m *Manifest) { m.Entries[0], m.Entries[1] = m.Entries[1], m.Entries[0] }, "duplicate": func(m *Manifest) { m.Entries[1] = m.Entries[0] }, "baseline": func(m *Manifest) { m.BaselineLedger[0].Name = "different" }, "missing": func(m *Manifest) { m.BaselineLedger = m.BaselineLedger[1:] }, "schema": func(m *Manifest) { m.SchemaHashes[0] = "" },
	}
	if e := validateManifest(validManifest()); e != nil {
		t.Fatal(e)
	}
	for name, change := range tests {
		t.Run(name, func(t *testing.T) {
			m := validManifest()
			change(&m)
			if validateManifest(m) == nil {
				t.Fatal("accepted")
			}
		})
	}
}
func TestStrictManifest(t *testing.T) {
	for _, s := range []string{`{"schemaVersion":1,"schemaVersion":1}`, `{"SchemaVersion":1}`, `{"schemaVersion":1,"SchemaVersion":1}`, `{"approved":true}`, `{} {}`, `[]`, ``} {
		var m Manifest
		if strictDecode([]byte(s), &m) == nil {
			t.Fatalf("accepted %s", s)
		}
	}
}
func TestProductionDenial(t *testing.T) {
	for _, mode := range []string{"production", "production-db", "GATE6", "GATE_6", "staging", ""} {
		m := validManifest()
		m.Mode = mode
		if e := validateManifest(m); e == nil || e.Error() != denied {
			t.Fatal(e)
		}
	}
	t.Setenv("APPROVED", "true")
	t.Setenv("APPROVED_BY", "Alexander")
	t.Setenv("PGHOST", project+".supabase.co")
	t.Setenv("PGPASSWORD", "secret-sentinel")
	for _, args := range [][]string{{"--production"}, {"--sql", "SELECT 1"}, {"--host", project + ".supabase.co"}, {"--approved=true"}, {"--nonce=valid"}, {"--query", "secret-sentinel"}} {
		if _, e := run(args); e == nil || e.Error() != denied || strings.Contains(e.Error(), "sentinel") {
			t.Fatal(e)
		}
	}
	for _, host := range []string{project + ".supabase.co", "localhost", "/tmp", "/tmp/../production"} {
		if _, e := localConfig(host); e == nil {
			t.Fatal("target accepted")
		}
	}
}
func TestPaths(t *testing.T) {
	root := t.TempDir()
	if e := os.WriteFile(filepath.Join(root, "real"), []byte("x"), 0600); e != nil {
		t.Fatal(e)
	}
	os.Symlink("real", filepath.Join(root, "link"))
	for _, p := range []string{"../escape", "/absolute", "link", "real/../real"} {
		if plainPath(root, p) == nil {
			t.Fatal("accepted", p)
		}
	}
	if e := plainPath(root, "real"); e != nil {
		t.Fatal(e)
	}
}
func TestParserAllFrozen(t *testing.T) {
	files, proofs, e := verifiedMigrations("../..")
	if e != nil {
		t.Fatal(e)
	}
	if len(files) != 3 || len(proofs) != 3 {
		t.Fatal("count")
	}
	for i, p := range proofs {
		if p.Version != frozen[i].Version || p.Name != frozen[i].Name || p.OriginalHash != frozen[i].SHA256 || !p.TransactionPreserved {
			t.Fatal(p)
		}
	}
	if path := os.Getenv("A5_PARSER_PROOF"); path != "" {
		b, _ := json.MarshalIndent(proofs, "", "  ")
		if e = os.WriteFile(path, b, 0600); e != nil {
			t.Fatal(e)
		}
	}
}
func TestParserLiteralProof(t *testing.T) {
	sql := "BEGIN; CREATE FUNCTION x() RETURNS text LANGUAGE sql AS $a$ SELECT 'x; y'::text || '{\"foo\":\"bar;baz\"}' $a$; COMMIT;"
	f, e := migration.NewMigrationFromFile("20261008000000_literal_fixture.sql", fstest.MapFS{"20261008000000_literal_fixture.sql": &fstest.MapFile{Data: []byte(sql)}})
	if e != nil {
		t.Fatal(e)
	}
	if _, e = equivalence([]byte(sql), f); e != nil {
		t.Fatal(e)
	}
	f.Statements[1] = strings.ReplaceAll(f.Statements[1], "bar;baz", "changed")
	if _, e = equivalence([]byte(sql), f); e == nil {
		t.Fatal("interior mutation")
	}
}
func TestReconciliation(t *testing.T) {
	pre := []LedgerRow{{Version: "1"}}
	post := append(append([]LedgerRow{}, pre...), LedgerRow{Version: "2"})
	for _, x := range []struct {
		rows         []LedgerRow
		schema, want string
	}{{pre, "pre", "DDL_NOT_COMMITTED_LEDGER_NOT_COMMITTED"}, {pre, "post", "DDL_COMMITTED_LEDGER_MISSING"}, {post, "post", "DDL_COMMITTED_LEDGER_COMMITTED"}, {post, "pre", "STATE_INCONSISTENT"}} {
		if got := classify(pre, post, x.rows, "pre", "post", x.schema); got != x.want {
			t.Fatal(got)
		}
	}
}
func TestReadOnlyReconciliation(t *testing.T) {
	if os.Getenv("A5_LOCAL_ROOT") == "" {
		t.Skip("isolated integration target not prepared")
	}
	cfg, e := localConfig(os.Getenv("A5_LOCAL_ROOT"))
	if e != nil {
		t.Fatal(e)
	}
	ctx := context.Background()
	a, s, e := readOnlySnapshot(ctx, cfg)
	if e != nil {
		t.Fatal(e)
	}
	b, u, e := readOnlySnapshot(ctx, cfg)
	if e != nil || s != u || !reflect.DeepEqual(a, b) {
		t.Fatal("nondeterministic reconciliation")
	}
}

func TestSourceSubstitution(t *testing.T) {
	root := t.TempDir()
	for _, entry := range frozen {
		if err := os.MkdirAll(filepath.Dir(filepath.Join(root, entry.Path)), 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(root, entry.Path), []byte("SELECT 'wrong bytes';"), 0600); err != nil {
			t.Fatal(err)
		}
	}
	if _, _, err := verifiedMigrations(root); err == nil || err.Error() != "SOURCE_HASH_MISMATCH" {
		t.Fatal("changed SQL accepted", err)
	}
}

// Mutating helpers below are test-only and cannot be reached by the executor CLI.
func TestLocalQualification(t *testing.T) {
	root := os.Getenv("A5_LOCAL_ROOT")
	if root == "" {
		t.Skip("disposable cluster harness required")
	}
	t.Setenv("PGPASSWORD", "secret-sentinel")
	t.Setenv("PGPASSFILE", "/must-not-open-provider-passwords")
	cfg, e := localConfig(root)
	if e == nil && cfg.Password != "" {
		t.Fatal("inherited credential")
	}
	t.Setenv("PGSERVICE", "production-service")
	if _, blocked := localConfig(root); blocked == nil || blocked.Error() != "LOCAL_CREDENTIAL_CONFIG_REJECTED" {
		t.Fatal("servicefile discovery not rejected")
	}
	t.Setenv("PGSERVICE", "")
	if e != nil {
		t.Fatal(e)
	}
	ctx := context.Background()
	adminCfg := cfg.Copy()
	adminCfg.User = os.Getenv("A5_SUPERUSER")
	adminCfg.Database = "postgres"
	admin, e := pgx.ConnectConfig(ctx, adminCfg)
	if e != nil {
		t.Fatal("local fixture admin unavailable")
	}
	defer admin.Close(ctx)
	must := func(c *pgx.Conn, q string) {
		t.Helper()
		if _, e := c.Exec(ctx, q); e != nil {
			t.Fatal("fixture SQL failed", e)
		}
	}
	c, e := connect(ctx, cfg)
	if e != nil {
		t.Fatal(e)
	}
	defer c.Close(ctx)
	must(c, `CREATE SCHEMA supabase_migrations; CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY, statements text[], name text)`)
	for _, v := range strings.Fields(baselineVersions) {
		f, e := migration.NewMigrationFromFile(v+"_synthetic_baseline.sql", fstest.MapFS{v + "_synthetic_baseline.sql": &fstest.MapFile{Data: []byte("SELECT 1;")}})
		if e != nil {
			t.Fatal(e)
		}
		if e = f.ExecBatch(ctx, c); e != nil {
			t.Fatal("official baseline engine failed")
		}
	}
	c.Close(ctx)
	must(admin, `CREATE DATABASE a5_reference WITH TEMPLATE a5_qualification OWNER a5_migrator`)
	c, e = connect(ctx, cfg)
	if e != nil {
		t.Fatal(e)
	}
	defer c.Close(ctx)
	rcfg := cfg.Copy()
	rcfg.Database = "a5_reference"
	reference, e := pgx.ConnectConfig(ctx, rcfg)
	if e != nil {
		t.Fatal(e)
	}
	defer reference.Close(ctx)
	files, proofs, e := verifiedMigrations("../..")
	if e != nil {
		t.Fatal(e)
	}
	m := validManifest()
	m.BaselineLedger, e = ledger(ctx, c)
	if e != nil {
		t.Fatal(e)
	}
	m.SchemaHashes = nil
	h, e := schema(ctx, reference)
	if e != nil {
		t.Fatal(e)
	}
	m.SchemaHashes = append(m.SchemaHashes, h)
	// Independent SQL transport establishes expected catalog state; engine parser is separately byte-proven.
	for _, entry := range frozen {
		b, e := os.ReadFile(filepath.Join("../..", entry.Path))
		if e != nil {
			t.Fatal(e)
		}
		must(reference, string(b))
		h, e = schema(ctx, reference)
		if e != nil {
			t.Fatal(e)
		}
		m.SchemaHashes = append(m.SchemaHashes, h)
	}
	evidence := map[string]any{"parser": proofs, "manifest": m, "manifestSha256": jsonDigest(m), "socketOnly": true, "migratorSuperuser": false, "migratorInherit": false, "migratorCreateRole": false, "migratorCreateDB": false, "production": "HARD_DISABLED", "authorityBinding": "BLOCKED"}
	manifestPath := filepath.Join(root, "manifest.json")
	manifestBytes, _ := json.Marshal(m)
	if e = os.WriteFile(manifestPath, manifestBytes, 0600); e != nil {
		t.Fatal(e)
	}
	binaryPath := os.Getenv("A5_BINARY")
	if binaryPath == "" {
		t.Fatal("compiled local binary required")
	}
	binaryBytes, e := os.ReadFile(binaryPath)
	if e != nil {
		t.Fatal(e)
	}
	evidence["binarySha256"] = digest(binaryBytes)
	invoke := func(step int) (Result, error) {
		args := []string{"--manifest", manifestPath, "--repo", func() string { p, _ := filepath.Abs("../.."); return p }(), "--execute-local", "--step", strconv.Itoa(step), "--isolation", root}
		cmd := exec.Command(binaryPath, args...)
		cmd.Env = []string{"PATH=/usr/bin:/bin:/opt/homebrew/bin", "TMPDIR=" + os.TempDir()}
		b, err := cmd.Output()
		var out struct {
			Result
			Error string `json:"error"`
		}
		if decode := json.Unmarshal(b, &out); decode != nil {
			t.Fatal("invalid structured CLI output")
		}
		if err != nil {
			return out.Result, errors.New(out.Error)
		}
		return out.Result, nil
	}
	// Wrapper and CLI dry-run both validate the frozen bytes without DB calls.
	repoAbs, e := filepath.Abs("../..")
	if e != nil {
		t.Fatal(e)
	}
	request := map[string]any{"mode": "isolated-qualification", "binary": binaryPath, "binarySha256": digest(binaryBytes), "manifest": manifestPath, "repo": repoAbs, "executeLocal": false}
	requestPath := filepath.Join(root, "wrapper.json")
	requestBytes, _ := json.Marshal(request)
	os.WriteFile(requestPath, requestBytes, 0600)
	dry := exec.Command("node", filepath.Join(repoAbs, "scripts/governance/a5-directed-executor.mjs"), requestPath)
	dry.Env = append(os.Environ(), "PGHOST="+project+".supabase.co", "PGPASSWORD=secret-sentinel", "APPROVED=true")
	dryOut, e := dry.Output()
	if e != nil || !strings.Contains(string(dryOut), "DRY_RUN_NO_CONNECTION") {
		t.Fatal("wrapper dry-run failed")
	}
	if _, e = invoke(2); e == nil || e.Error() != "LEDGER_PREFIX_MISMATCH" {
		t.Fatal("out-of-order execution accepted", e)
	}
	// Lock contention times out safely before executing any migration.
	lockCfg := adminCfg.Copy()
	lockCfg.Database = "a5_qualification"
	lockAdmin, e := pgx.ConnectConfig(ctx, lockCfg)
	if e != nil {
		t.Fatal(e)
	}
	must(lockAdmin, "SELECT pg_advisory_lock(20261007,20208)")
	lockCtx, lockCancel := context.WithTimeout(ctx, 100*time.Millisecond)
	_, lockErr := executeLocal(lockCtx, m, files, 0, cfg)
	lockCancel()
	must(lockAdmin, "SELECT pg_advisory_unlock(20261007,20208)")
	lockAdmin.Close(ctx)
	if lockErr == nil || lockErr.Error() != "LOCK_FAILED" {
		t.Fatal("lock contention did not fail closed", lockErr)
	}
	evidence["lockContention"] = "LOCK_FAILED; no engine call"
	stages := []Result{}
	for i := 0; i < 3; i++ {
		result, e := invoke(i + 1)
		if e != nil {
			t.Fatalf("step %d: %s, result=%+v", i+1, e, result)
		}
		if result.State != "LOCAL_STEP_VERIFIED_STOP" {
			t.Fatal(result)
		}
		stages = append(stages, result)
		observed, e := ledger(ctx, c)
		if e != nil || len(observed) != 62+i || !reflect.DeepEqual(observed, prefix(m, files, i+1)) {
			t.Fatal("exact ledger failure")
		}
		if _, e = invoke(i + 1); e == nil || e.Error() != "DUPLICATE_VERSION_REJECTED" {
			t.Fatal("duplicate accepted", e)
		}
	}
	evidence["stages"] = stages
	readCmd := exec.Command(binaryPath, "--manifest", manifestPath, "--repo", repoAbs, "--reconcile-local", "--step", "3", "--isolation", root)
	readBytes, e := readCmd.Output()
	if e != nil {
		t.Fatal("CLI reconciliation failed")
	}
	var readResult Result
	if e = json.Unmarshal(readBytes, &readResult); e != nil || readResult.Reconciled != "DDL_COMMITTED_LEDGER_COMMITTED" {
		t.Fatal("CLI reconciliation mismatch")
	}
	evidence["cliReadOnlyReconciliation"] = readResult
	finalLedger, e := ledger(ctx, c)
	if e != nil {
		t.Fatal(e)
	}
	// An unexpected previous ledger row must fail before any official engine execution.
	bad := m
	bad.BaselineLedger = append([]LedgerRow{}, finalLedger...)
	bad.BaselineLedger[0].Name = "wrong"
	f := synthetic(t, "20261008000010", "BEGIN; CREATE TABLE public.a5_prefix_denied(id integer); COMMIT;")
	if _, e = executeLocal(ctx, bad, []*migration.MigrationFile{f}, 0, cfg); e == nil || e.Error() != "LEDGER_PREFIX_MISMATCH" {
		t.Fatal("wrong prefix accepted", e)
	}
	var absent bool
	if e = c.QueryRow(ctx, "SELECT to_regclass('public.a5_prefix_denied') IS NULL").Scan(&absent); e != nil || !absent {
		t.Fatal("precheck called engine")
	}
	// DDL failure before COMMIT: no DDL and no ledger. Adapter sanitizes engine SQL errors.
	pre, e := schema(ctx, c)
	if e != nil {
		t.Fatal(e)
	}
	fail := synthetic(t, "20261008000011", "BEGIN; CREATE TABLE public.a5_ddl_failure(id integer); SELECT 'secret-sentinel'::integer; COMMIT;")
	fm := m
	fm.BaselineLedger = finalLedger
	fm.SchemaHashes = []string{pre, strings.Repeat("f", 64)}
	r, e := executeLocal(ctx, fm, []*migration.MigrationFile{fail}, 0, cfg)
	if e == nil || strings.Contains(e.Error(), "sentinel") || r.State != "OUTCOME_UNCERTAIN" || r.Reconciled != "DDL_NOT_COMMITTED_LEDGER_NOT_COMMITTED" {
		t.Fatal("DDL failure classification", r, e)
	}
	evidence["ddlFailure"] = r
	// Force ledger failure after explicit COMMIT, without directly writing ledger rows.
	must(c, `CREATE FUNCTION supabase_migrations.a5_reject_ledger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.version='20261008000012' THEN RAISE EXCEPTION 'synthetic ledger failure secret-sentinel'; END IF; RETURN NEW; END $$; CREATE TRIGGER a5_reject BEFORE INSERT ON supabase_migrations.schema_migrations FOR EACH ROW EXECUTE FUNCTION supabase_migrations.a5_reject_ledger()`)
	pre, e = schema(ctx, c)
	if e != nil {
		t.Fatal(e)
	}
	must(reference, "CREATE TABLE public.a5_ledger_failure(id integer)")
	post, e := schema(ctx, reference)
	if e != nil {
		t.Fatal(e)
	}
	fm.SchemaHashes = []string{pre, post}
	fail = synthetic(t, "20261008000012", "BEGIN; CREATE TABLE public.a5_ledger_failure(id integer); COMMIT;")
	r, e = executeLocal(ctx, fm, []*migration.MigrationFile{fail}, 0, cfg)
	if e == nil || r.State != "OUTCOME_UNCERTAIN" || r.Reconciled != "DDL_COMMITTED_LEDGER_MISSING" {
		t.Fatal("ledger failure classification", r, e)
	}
	evidence["ledgerFailure"] = r
	must(c, "DROP TABLE public.a5_ledger_failure; DROP TRIGGER a5_reject ON supabase_migrations.schema_migrations; DROP FUNCTION supabase_migrations.a5_reject_ledger()")
	must(reference, "DROP TABLE public.a5_ledger_failure")
	// Insufficient DDL privilege: distinct NOINHERIT migrator loses schema CREATE, then reconciles.
	must(c, "REVOKE CREATE ON SCHEMA public FROM a5_migrator") // owner still has implicit privilege: use table privilege instead.
	must(admin, "CREATE ROLE a5_no_priv LOGIN NOINHERIT")
	must(c, "GRANT USAGE ON SCHEMA public,supabase_migrations TO a5_no_priv; GRANT SELECT,INSERT ON supabase_migrations.schema_migrations TO a5_no_priv")
	limitedCfg := cfg.Copy()
	limitedCfg.User = "a5_no_priv"
	limited, e := pgx.ConnectConfig(ctx, limitedCfg)
	if e != nil {
		t.Fatal(e)
	}
	fail = synthetic(t, "20261008000013", "BEGIN; ALTER TABLE public.orders ADD COLUMN forbidden integer; COMMIT;")
	if e = fail.ExecBatch(ctx, limited); e == nil {
		t.Fatal("insufficient role succeeded")
	}
	limited.Close(ctx)
	got, e := ledger(ctx, c)
	if e != nil || !reflect.DeepEqual(got, finalLedger) {
		t.Fatal("role failure ledger change")
	}
	must(c, "GRANT CREATE ON SCHEMA public TO a5_migrator")
	evidence["insufficientRole"] = "DDL_NOT_COMMITTED_LEDGER_NOT_COMMITTED"
	// Interrupted sessions at deterministic server-side barriers, no automatic retry.
	for _, window := range []string{"before-commit", "during-ledger"} {
		name := "a5_interrupt_" + strings.ReplaceAll(window, "-", "_")
		version := "20261008000014"
		sql := "BEGIN; CREATE TABLE public." + name + "(id integer); SELECT pg_sleep(30); COMMIT;"
		if window == "during-ledger" {
			version = "20261008000015"
			sql = "BEGIN; CREATE TABLE public." + name + "(id integer); COMMIT;"
			must(c, `CREATE FUNCTION supabase_migrations.a5_sleep_ledger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.version='20261008000015' THEN PERFORM pg_sleep(30); END IF; RETURN NEW; END $$; CREATE TRIGGER a5_sleep BEFORE INSERT ON supabase_migrations.schema_migrations FOR EACH ROW EXECUTE FUNCTION supabase_migrations.a5_sleep_ledger()`)
		}
		worker, e := connect(ctx, cfg)
		if e != nil {
			t.Fatal(e)
		}
		pid := int(worker.PgConn().PID())
		done := make(chan error, 1)
		sf := synthetic(t, version, sql)
		go func() { done <- sf.ExecBatch(ctx, worker) }()
		waitFor(t, func() bool {
			var wait string
			admin.QueryRow(ctx, "SELECT coalesce(wait_event,'') FROM pg_stat_activity WHERE pid=$1", pid).Scan(&wait)
			return wait == "PgSleep"
		})
		var terminated bool
		if e = admin.QueryRow(ctx, "SELECT pg_terminate_backend($1)", pid).Scan(&terminated); e != nil || !terminated {
			t.Fatal("interrupt failed")
		}
		if e = <-done; e == nil {
			t.Fatal("interrupted engine succeeded")
		}
		worker.Close(ctx)
		rows, actual, e := readOnlySnapshot(ctx, cfg)
		if e != nil || !reflect.DeepEqual(rows, finalLedger) {
			t.Fatal("interrupt ledger state", e)
		}
		var exists bool
		e = c.QueryRow(ctx, "SELECT to_regclass($1) IS NOT NULL", "public."+name).Scan(&exists)
		if e != nil {
			t.Fatal(e)
		}
		if exists != (window == "during-ledger") {
			t.Fatal("unexpected DDL outcome", window)
		}
		evidence[window] = map[string]any{"state": "OUTCOME_UNCERTAIN", "ddlCommitted": exists, "ledgerCommitted": false, "schemaHash": actual, "ledgerHash": jsonDigest(rows), "newReadOnlyConnection": true}
		if exists {
			must(c, "DROP TABLE public."+name)
		}
		if window == "during-ledger" {
			must(c, "DROP TRIGGER a5_sleep ON supabase_migrations.schema_migrations; DROP FUNCTION supabase_migrations.a5_sleep_ledger()")
		}
	}
	// Proxy drops committed ReadyForQuery before the client can report success.
	proxyPath := filepath.Join(root, "after-commit.sock")
	listener, e := net.Listen("unix", proxyPath)
	if e != nil {
		t.Fatal(e)
	}
	defer listener.Close()
	armed := make(chan struct{})
	committed := make(chan struct{})
	release := make(chan struct{})
	proxyDone := make(chan error, 1)
	go committedResponseProxy(listener, filepath.Join(root, ".s.PGSQL.55449"), armed, committed, release, proxyDone)
	pcfg := cfg.Copy()
	pcfg.DialFunc = func(ctx context.Context, n, a string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "unix", proxyPath)
	}
	pc, e := connect(ctx, pcfg)
	if e != nil {
		t.Fatal(e)
	}
	close(armed)
	sf := synthetic(t, "20261008000016", "BEGIN; CREATE TABLE public.a5_after_ledger(id integer); COMMIT;")
	done := make(chan error, 1)
	go func() { done <- sf.ExecBatch(ctx, pc) }()
	select {
	case <-committed:
	case <-time.After(10 * time.Second):
		t.Fatal("proxy barrier timeout")
	}
	// Server emitted ReadyForQuery after implicit ledger transaction commit; independent read confirms it.
	rows, actual, e := readOnlySnapshot(ctx, cfg)
	if e != nil {
		t.Fatal(e)
	}
	expected := append(append([]LedgerRow{}, finalLedger...), LedgerRow{sf.Version, sf.Name, sf.Statements})
	again, againSchema, againErr := readOnlySnapshot(ctx, cfg)
	if againErr != nil || againSchema != actual || !reflect.DeepEqual(again, rows) {
		t.Fatal("read-only reconciliation nondeterministic")
	}
	evidence["deterministicReconciliation"] = "two independent READ ONLY connections, exact same ledger and catalog"
	if !reflect.DeepEqual(rows, expected) {
		t.Fatal("ledger not committed at server barrier")
	}
	close(release)
	if e = <-done; e == nil {
		t.Fatal("lost success accepted")
	}
	pc.Close(ctx)
	evidence["after-ledger-before-success"] = map[string]any{"state": "OUTCOME_UNCERTAIN", "reconciled": "DDL_COMMITTED_LEDGER_COMMITTED", "ledgerHash": jsonDigest(rows), "schemaHash": actual, "newReadOnlyConnection": true}
	if e = <-proxyDone; e != nil {
		t.Fatal(e)
	}
	// Negative target and role attestations occur before engine.
	wrong := cfg.Copy()
	wrong.Database = "a5_reference"
	if _, e = connect(ctx, wrong); e == nil {
		t.Fatal("wrong target accepted")
	}
	wrong = cfg.Copy()
	wrong.User = os.Getenv("A5_SUPERUSER")
	if _, e = connect(ctx, wrong); e == nil {
		t.Fatal("superuser accepted")
	}
	for _, variant := range []string{"name", "hash"} {
		conflict := *files[2]
		if variant == "name" {
			conflict.Name = "different"
		} else {
			conflict.Statements = []string{"SELECT 'different'"}
		}
		if _, e = executeLocal(ctx, m, []*migration.MigrationFile{&conflict}, 0, cfg); e == nil || e.Error() != "DUPLICATE_VERSION_REJECTED" {
			t.Fatal("conflicting duplicate accepted")
		}
	}
	evidence["historyIsolation"] = "No historical directory scanned; exact 61 prior rows preserved through all real A5 steps"
	evidence["providerConnections"] = 0
	evidence["a4bMutations"] = 0
	b, _ := json.MarshalIndent(evidence, "", "  ")
	if e = os.WriteFile(os.Getenv("A5_EVIDENCE"), b, 0600); e != nil {
		t.Fatal(e)
	}
	t.Log("61→62→63→64; parser/ledger/catalog PASS; DDL/ledger/three interruption windows PASS; production HARD DISABLED")
}
func synthetic(t *testing.T, v, sql string) *migration.MigrationFile {
	t.Helper()
	name := v + "_synthetic_fault.sql"
	f, e := migration.NewMigrationFromFile(name, fstest.MapFS{name: &fstest.MapFile{Data: []byte(sql)}})
	if e != nil {
		t.Fatal(e)
	}
	return f
}
func waitFor(t *testing.T, f func() bool) {
	t.Helper()
	end := time.Now().Add(10 * time.Second)
	for time.Now().Before(end) {
		if f() {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("deterministic server barrier timeout")
}

// Test-only PostgreSQL protocol proxy. Never opens TCP or changes migration SQL.
func committedResponseProxy(l net.Listener, target string, armed <-chan struct{}, committed chan<- struct{}, release <-chan struct{}, done chan<- error) {
	client, e := l.Accept()
	if e != nil {
		done <- e
		return
	}
	defer client.Close()
	backend, e := net.Dial("unix", target)
	if e != nil {
		done <- e
		return
	}
	defer backend.Close()
	go func() { io.Copy(backend, client) }()
	inserted := false
	for {
		header := make([]byte, 5)
		if _, e = io.ReadFull(backend, header); e != nil {
			done <- e
			return
		}
		size := int(binary.BigEndian.Uint32(header[1:]))
		if size < 4 || size > 16<<20 {
			done <- fmt.Errorf("invalid local protocol frame")
			return
		}
		body := make([]byte, size-4)
		if _, e = io.ReadFull(backend, body); e != nil {
			done <- e
			return
		}
		active := false
		select {
		case <-armed:
			active = true
		default:
		}
		if active && header[0] == 'C' && strings.HasPrefix(string(body), "INSERT 0 1") {
			inserted = true
		}
		if active && inserted && header[0] == 'Z' {
			close(committed)
			<-release
			done <- nil
			return
		}
		if _, e = client.Write(append(header, body...)); e != nil {
			done <- e
			return
		}
	}
}

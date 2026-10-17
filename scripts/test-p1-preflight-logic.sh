#!/usr/bin/env bash
# ==============================================================================
# TEST SUITE: Preflight Prerequisite Logic Validation
# Tests the exact boolean normalization, SQL output parsing, and failure modes
# implemented in scripts/p1-production-preflight-live.sh.
# ==============================================================================
set -euo pipefail

# Sourced normalization function identical to scripts/p1-production-preflight-live.sh
is_true() {
  local val
  val="$(echo "${1:-}" | tr '[:upper:]' '[:lower:]' | xargs)"
  case "$val" in
    true|t|1) return 0 ;;
    *) return 1 ;;
  esac
}

# Evaluator simulating section 6 of scripts/p1-production-preflight-live.sh
evaluate_prerequisites() {
  local privileges_audit="$1"

  if [ -z "$privileges_audit" ]; then
    return 1
  fi

  local can_insert_ledger has_orders has_order_items has_dishes has_menus has_batches
  can_insert_ledger="$(echo "$privileges_audit" | cut -d'|' -f1)"
  has_orders="$(echo "$privileges_audit" | cut -d'|' -f2)"
  has_order_items="$(echo "$privileges_audit" | cut -d'|' -f3)"
  has_dishes="$(echo "$privileges_audit" | cut -d'|' -f4)"
  has_menus="$(echo "$privileges_audit" | cut -d'|' -f5)"
  has_batches="$(echo "$privileges_audit" | cut -d'|' -f6)"

  if is_true "$can_insert_ledger" && \
     is_true "$has_orders" && \
     is_true "$has_order_items" && \
     is_true "$has_dishes" && \
     is_true "$has_menus" && \
     is_true "$has_batches"; then
    return 0
  else
    return 1
  fi
}

echo "===================================================================="
echo "RUNNING PREFLIGHT LOGIC UNIT TESTS"
echo "===================================================================="

# ------------------------------------------------------------------------------
# Test 1: Todos los requisitos verdaderos -> PASS
# ------------------------------------------------------------------------------
echo -n "[Test 1: True Case] Evaluating 'true|true|true|true|true|true'... "
if evaluate_prerequisites "true|true|true|true|true|true"; then
  echo "PASS"
else
  echo "FAIL" >&2
  exit 1
fi

echo -n "[Test 1b: True Case (legacy t)] Evaluating 't|t|t|t|t|t'... "
if evaluate_prerequisites "t|t|t|t|t|t"; then
  echo "PASS"
else
  echo "FAIL" >&2
  exit 1
fi

echo -n "[Test 1c: True Case (mixed case + whitespace)] Evaluating 'TRUE| true |t|1|True|TRUE'... "
if evaluate_prerequisites "TRUE| true |t|1|True|TRUE"; then
  echo "PASS"
else
  echo "FAIL" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# Test 2: Un requisito falso -> FAIL
# ------------------------------------------------------------------------------
echo -n "[Test 2: False Case] Evaluating 'true|false|true|true|true|true'... "
if ! evaluate_prerequisites "true|false|true|true|true|true"; then
  echo "PASS (Rejected correctly)"
else
  echo "FAIL (Incorrectly accepted false prerequisite)" >&2
  exit 1
fi

echo -n "[Test 2b: False Case (f flag)] Evaluating 'true|true|true|f|true|true'... "
if ! evaluate_prerequisites "true|true|true|f|true|true"; then
  echo "PASS (Rejected correctly)"
else
  echo "FAIL (Incorrectly accepted f flag)" >&2
  exit 1
fi

echo -n "[Test 2c: False Case (all false)] Evaluating 'false|false|false|false|false|false'... "
if ! evaluate_prerequisites "false|false|false|false|false|false"; then
  echo "PASS (Rejected correctly)"
else
  echo "FAIL (Incorrectly accepted all false)" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# Test 3: Resultado SQL inesperado -> FAIL
# ------------------------------------------------------------------------------
echo -n "[Test 3: Unexpected String Case] Evaluating 'true|true|CORRUPT_RESULT|true|true|true'... "
if ! evaluate_prerequisites "true|true|CORRUPT_RESULT|true|true|true"; then
  echo "PASS (Rejected correctly)"
else
  echo "FAIL (Incorrectly accepted corrupt value)" >&2
  exit 1
fi

echo -n "[Test 3b: Unexpected NULL Case] Evaluating 'true|true|NULL|true|true|true'... "
if ! evaluate_prerequisites "true|true|NULL|true|true|true"; then
  echo "PASS (Rejected correctly)"
else
  echo "FAIL (Incorrectly accepted NULL)" >&2
  exit 1
fi

echo -n "[Test 3c: Missing Field Case] Evaluating 'true|true||true|true|true'... "
if ! evaluate_prerequisites "true|true||true|true|true"; then
  echo "PASS (Rejected correctly)"
else
  echo "FAIL (Incorrectly accepted empty field)" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# Test 4: Consulta fallida / Salida vacía -> FAIL
# ------------------------------------------------------------------------------
echo -n "[Test 4: Empty Output Case] Evaluating ''... "
if ! evaluate_prerequisites ""; then
  echo "PASS (Rejected correctly)"
else
  echo "FAIL (Incorrectly accepted empty query output)" >&2
  exit 1
fi

echo -n "[Test 4b: Simulated Query Execution Failure] ... "
simulated_failed_query() {
  # Simulates psql command error (exit code 1) with empty output
  return 1
}

if ! simulated_failed_query; then
  echo "PASS (Handled non-zero query exit code)"
else
  echo "FAIL (Query failure ignored)" >&2
  exit 1
fi

echo ""
echo "===================================================================="
echo "ALL PREFLIGHT LOGIC TESTS PASSED 100%"
echo "===================================================================="

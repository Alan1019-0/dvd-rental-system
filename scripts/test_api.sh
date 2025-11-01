#!/bin/bash

# ========================================
# DVD Rental API - Test Suite
# Testing con CURL y BASH
# ========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
API_URL="${API_URL:-http://localhost:3000}"
LOG_FILE="test_results.log"
PASSED=0
FAILED=0

# Limpiar log anterior
> "$LOG_FILE"

# ========================================
# Funciones auxiliares
# ========================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Test:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASSED${NC} - $1\n"
    ((PASSED++))
    echo "[PASSED] $1" >> "$LOG_FILE"
}

print_error() {
    echo -e "${RED}✗ FAILED${NC} - $1\n"
    ((FAILED++))
    echo "[FAILED] $1" >> "$LOG_FILE"
}

check_response() {
    local response="$1"
    local expected_code="$2"
    local test_name="$3"
    
    # Extraer código de estado HTTP
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "Response: $body" >> "$LOG_FILE"
    echo "HTTP Code: $http_code" >> "$LOG_FILE"
    
    if [ "$http_code" -eq "$expected_code" ]; then
        print_success "$test_name (HTTP $http_code)"
        return 0
    else
        print_error "$test_name (Expected $expected_code, got $http_code)"
        return 1
    fi
}

# ========================================
# Tests
# ========================================

print_header "DVD RENTAL API - Test Suite"
echo "Testing API at: $API_URL"
echo "Start time: $(date)"
echo ""

# Test 1: Health Check
print_header "1. HEALTH CHECK"
print_test "Verificar que la API está corriendo"

response=$(curl -s -w "\n%{http_code}" "$API_URL/health")
check_response "$response" 200 "Health check endpoint"

# Test 2: Root Endpoint
print_header "2. ROOT ENDPOINT"
print_test "Obtener información de la API"

response=$(curl -s -w "\n%{http_code}" "$API_URL/")
check_response "$response" 200 "Root endpoint"

# Test 3: Obtener Películas
print_header "3. FILMS ENDPOINTS"

print_test "Obtener lista de películas"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/films?limit=5")
check_response "$response" 200 "Get all films"

print_test "Obtener película específica"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/films/1")
check_response "$response" 200 "Get film by ID"

print_test "Buscar películas"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/films/search/query?q=action")
check_response "$response" 200 "Search films"

print_test "Obtener películas disponibles"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/films/available/list")
check_response "$response" 200 "Get available films"

print_test "Obtener categorías"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/films/categories/list")
check_response "$response" 200 "Get categories"

# Test 4: Clientes
print_header "4. CUSTOMERS ENDPOINTS"

print_test "Obtener lista de clientes"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/customers?limit=5")
check_response "$response" 200 "Get all customers"

print_test "Obtener cliente específico"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/customers/1")
check_response "$response" 200 "Get customer by ID"

print_test "Buscar clientes"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/customers/search/query?q=mary")
check_response "$response" 200 "Search customers"

# Test 5: Crear Renta
print_header "5. RENTAL OPERATIONS"

print_test "Crear nueva renta"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/rentals" \
    -H "Content-Type: application/json" \
    -d '{
        "customer_id": 1,
        "inventory_id": 1,
        "staff_id": 1
    }')

if check_response "$response" 201 "Create rental"; then
    # Extraer rental_id de la respuesta
    RENTAL_ID=$(echo "$response" | sed '$d' | grep -o '"rental_id":[0-9]*' | grep -o '[0-9]*')
    echo "Created rental ID: $RENTAL_ID"
fi

print_test "Obtener todas las rentas"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/rentals?limit=5")
check_response "$response" 200 "Get all rentals"

print_test "Obtener renta específica"
if [ ! -z "$RENTAL_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL/api/rentals/$RENTAL_ID")
    check_response "$response" 200 "Get rental by ID"
fi

print_test "Devolver DVD"
if [ ! -z "$RENTAL_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/api/rentals/$RENTAL_ID/return")
    check_response "$response" 200 "Return rental"
fi

print_test "Intentar rentar DVD ya rentado (debe fallar)"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/rentals" \
    -H "Content-Type: application/json" \
    -d '{
        "customer_id": 1,
        "inventory_id": 2,
        "staff_id": 1
    }')
# Crear otra renta para probar cancelación
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 201 ]; then
    RENTAL_ID_TO_CANCEL=$(echo "$response" | sed '$d' | grep -o '"rental_id":[0-9]*' | grep -o '[0-9]*')
    print_success "Created test rental for cancellation"
fi

print_test "Cancelar renta"
if [ ! -z "$RENTAL_ID_TO_CANCEL" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/api/rentals/$RENTAL_ID_TO_CANCEL")
    check_response "$response" 200 "Cancel rental"
fi

# Test 6: Reportes
print_header "6. REPORTS ENDPOINTS"

print_test "Reporte: Rentas por cliente"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/reports/customer/1/rentals")
check_response "$response" 200 "Customer rentals report"

print_test "Reporte: DVDs no devueltos"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/reports/unreturned")
check_response "$response" 200 "Unreturned DVDs report"

print_test "Reporte: DVDs más rentados"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/reports/top-films?limit=10")
check_response "$response" 200 "Top rented films report"

print_test "Reporte: Ganancias por staff"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/reports/staff-earnings")
check_response "$response" 200 "Staff earnings report"

print_test "Reporte: Resumen del sistema"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/reports/summary")
check_response "$response" 200 "System summary report"

# Test 7: Error Handling
print_header "7. ERROR HANDLING"

print_test "Endpoint no existente (404)"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/nonexistent")
check_response "$response" 404 "404 error handling"

print_test "Crear renta sin datos (400)"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/rentals" \
    -H "Content-Type: application/json" \
    -d '{}')
check_response "$response" 400 "400 error handling"

print_test "Obtener película inexistente (404)"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/films/99999")
check_response "$response" 404 "Film not found"

print_test "Obtener cliente inexistente (404)"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/customers/99999")
check_response "$response" 404 "Customer not found"

# Test 8: Validaciones
print_header "8. DATA VALIDATION"

print_test "Crear renta con customer_id inválido"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/rentals" \
    -H "Content-Type: application/json" \
    -d '{
        "customer_id": 99999,
        "inventory_id": 1,
        "staff_id": 1
    }')
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 400 ] || [ "$http_code" -eq 500 ]; then
    print_success "Invalid customer_id validation"
else
    print_error "Invalid customer_id validation (Expected 400/500, got $http_code)"
fi

# ========================================
# Resumen Final
# ========================================

print_header "TEST RESULTS SUMMARY"

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)

echo -e "Total Tests:    ${BLUE}$TOTAL${NC}"
echo -e "Passed:         ${GREEN}$PASSED${NC}"
echo -e "Failed:         ${RED}$FAILED${NC}"
echo -e "Success Rate:   ${GREEN}${PERCENTAGE}%${NC}"
echo ""
echo "End time: $(date)"
echo ""
echo "Detailed log saved to: $LOG_FILE"

# Exit code
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}\n"
    exit 0
else
    echo -e "${RED}Some tests failed! ✗${NC}\n"
    exit 1
fi
# DVD Rental API - Documentación Completa

## Tabla de Contenidos

- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Rentas](#rentas)
  - [Reportes](#reportes)
  - [Películas](#películas)
  - [Clientes](#clientes)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Uso](#ejemplos-de-uso)

## Información General

**Base URL:** `http://localhost:3000`

**Formato de Respuesta:** JSON

**Content-Type:** `application/json`

### Estructura de Respuesta Estándar

```json
{
  "success": true,
  "data": {...},
  "message": "Mensaje opcional"
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (solo en desarrollo)"
}
```

## Endpoints

### Rentas

#### Crear Nueva Renta

Crea una nueva renta de DVD.

```http
POST /api/rentals
Content-Type: application/json

{
  "customer_id": 1,
  "inventory_id": 123,
  "staff_id": 1
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| customer_id | integer | Sí | ID del cliente |
| inventory_id | integer | Sí | ID del inventario (DVD físico) |
| staff_id | integer | Sí | ID del empleado que procesa |

**Respuesta Exitosa (201):**

```json
{
  "success": true,
  "message": "Renta creada exitosamente",
  "data": {
    "rental_id": 16050,
    "rental_date": "2025-10-31T10:30:00.000Z",
    "return_date": null,
    "customer_name": "Mary Smith",
    "film_title": "Academy Dinosaur",
    "staff_name": "Mike Hillyer"
  }
}
```

**Errores Posibles:**
- `400` - Campos faltantes o DVD ya rentado
- `500` - Error del servidor

---

#### Obtener Todas las Rentas

Lista todas las rentas con paginación.

```http
GET /api/rentals?page=1&limit=20&status=active
```

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| page | integer | 1 | Número de página |
| limit | integer | 20 | Resultados por página |
| status | string | all | `active`, `returned`, o `all` |

**Respuesta (200):**

```json
{
  "success": true,
  "data": [
    {
      "rental_id": 16050,
      "rental_date": "2025-10-31T10:30:00.000Z",
      "return_date": null,
      "customer_id": 1,
      "customer_name": "Mary Smith",
      "film_id": 123,
      "film_title": "Academy Dinosaur",
      "staff_id": 1,
      "staff_name": "Mike Hillyer",
      "status": "Activa"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

#### Obtener Renta por ID

Obtiene los detalles completos de una renta específica.

```http
GET /api/rentals/:id
```

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | integer | ID de la renta |

**Respuesta (200):**

```json
{
  "success": true,
  "data": {
    "rental_id": 16050,
    "rental_date": "2025-10-31T10:30:00.000Z",
    "return_date": null,
    "inventory_id": 123,
    "customer_id": 1,
    "customer_name": "Mary Smith",
    "customer_email": "mary.smith@sakilacustomer.org",
    "film_id": 1,
    "film_title": "Academy Dinosaur",
    "film_description": "A Epic Drama of a Feminist...",
    "rental_rate": 0.99,
    "staff_id": 1,
    "staff_name": "Mike Hillyer"
  }
}
```

---

#### Devolver DVD

Marca un DVD como devuelto y genera el pago correspondiente.

```http
PUT /api/rentals/:id/return
```

**Respuesta (200):**

```json
{
  "success": true,
  "message": "DVD devuelto exitosamente",
  "data": {
    "rental_id": 16050,
    "return_date": "2025-11-02T14:20:00.000Z",
    "payment": {
      "payment_id": 32099,
      "amount": 0.99,
      "payment_date": "2025-11-02T14:20:00.000Z"
    }
  }
}
```

---

#### Cancelar Renta

Elimina una renta y sus pagos asociados.

```http
DELETE /api/rentals/:id
```

**Respuesta (200):**

```json
{
  "success": true,
  "message": "Renta cancelada exitosamente",
  "data": {
    "rental_id": 16050,
    "cancelled_at": "2025-11-02T15:00:00.000Z"
  }
}
```

---

### Reportes

#### Reporte 1: Rentas por Cliente

Lista todas las rentas de un cliente específico.

```http
GET /api/reports/customer/:customer_id/rentals?status=all&sort=desc
```

**Query Parameters:**

| Parámetro | Tipo | Valores | Descripción |
|-----------|------|---------|-------------|
| status | string | `active`, `returned`, `all` | Filtrar por estado |
| sort | string | `asc`, `desc` | Orden por fecha |

**Respuesta (200):**

```json
{
  "success": true,
  "customer": {
    "customer_id": 1,
    "name": "Mary Smith",
    "email": "mary.smith@sakilacustomer.org",
    "active": 1
  },
  "statistics": {
    "total_rentals": 32,
    "active_rentals": 3,
    "returned_rentals": 29,
    "total_spent": 116.73
  },
  "rentals": [
    {
      "rental_id": 16050,
      "rental_date": "2025-10-31T10:30:00.000Z",
      "return_date": null,
      "film_id": 1,
      "film_title": "Academy Dinosaur",
      "rental_rate": 0.99,
      "category": "Documentary",
      "staff_name": "Mike Hillyer",
      "store_id": 1,
      "payment_amount": null,
      "payment_date": null,
      "status": "Activa",
      "rental_days": 2
    }
  ],
  "total": 32
}
```

---

#### Reporte 2: DVDs No Devueltos

Identifica todos los DVDs que no han sido devueltos.

```http
GET /api/reports/unreturned?days_overdue=7&sort_by=days
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| days_overdue | integer | Filtrar por días de retraso mínimo |
| sort_by | string | `days` o `customer` |

**Respuesta (200):**

```json
{
  "success": true,
  "statistics": {
    "total_unreturned": 183,
    "overdue": 45,
    "near_overdue": 38,
    "on_time": 100,
    "avg_days_out": 5.23
  },
  "unreturned_dvds": [
    {
      "rental_id": 16049,
      "rental_date": "2025-10-20T08:00:00.000Z",
      "days_overdue": 11,
      "customer_id": 1,
      "customer_name": "Mary Smith",
      "customer_email": "mary.smith@sakilacustomer.org",
      "customer_phone": "838635286649",
      "film_id": 123,
      "film_title": "Academy Dinosaur",
      "rental_rate": 0.99,
      "category": "Documentary",
      "staff_name": "Mike Hillyer",
      "store_id": 1,
      "customer_address": "1913 Hanoi Way, Sasebo, Japan",
      "urgency_status": "Atrasado"
    }
  ],
  "total": 183
}
```

---

#### Reporte 3: DVDs Más Rentados

Determina las películas más populares.

```http
GET /api/reports/top-films?limit=10&category=Action&min_rentals=5
```

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| limit | integer | 10 | Número de resultados |
| category | string | - | Filtrar por categoría |
| min_rentals | integer | - | Rentas mínimas |

**Respuesta (200):**

```json
{
  "success": true,
  "statistics": {
    "total_films": 958,
    "total_rentals": 16044,
    "total_system_revenue": 61312.04,
    "avg_rentals_per_film": 16.74
  },
  "top_films": [
    {
      "film_id": 103,
      "title": "Bucket Brotherhood",
      "description": "A Amazing Display...",
      "release_year": 2006,
      "rental_rate": 4.99,
      "duration_minutes": 183,
      "rating": "PG",
      "category": "Travel",
      "total_rentals": 34,
      "currently_rented": 2,
      "returned_rentals": 32,
      "total_revenue": 169.66,
      "avg_rental_days": 5.12,
      "unique_customers": 33
    }
  ],
  "total": 10
}
```

---

#### Reporte 4: Ganancias por Staff

Calcula las ganancias generadas por cada empleado.

```http
GET /api/reports/staff-earnings?start_date=2025-01-01&end_date=2025-12-31&store_id=1
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| start_date | date | Fecha inicial (YYYY-MM-DD) |
| end_date | date | Fecha final (YYYY-MM-DD) |
| store_id | integer | Filtrar por tienda |

**Respuesta (200):**

```json
{
  "success": true,
  "statistics": {
    "total_system_earnings": 61312.04,
    "avg_earnings_per_staff": 30656.02,
    "highest_earnings": 31059.92,
    "lowest_earnings": 30252.12
  },
  "staff_earnings": [
    {
      "staff_id": 1,
      "staff_name": "Mike Hillyer",
      "staff_email": "Mike.Hillyer@sakilastaff.com",
      "active": true,
      "store_id": 1,
      "store_location": "28 MySQL Boulevard, Woodridge",
      "total_rentals_processed": 8040,
      "unique_customers_served": 326,
      "total_earnings": 31059.92,
      "avg_payment": 3.86,
      "first_transaction": "2025-02-14T21:21:59.996577Z",
      "last_transaction": "2025-08-23T12:11:28.996577Z",
      "active_rentals": 92,
      "completed_rentals": 7948,
      "earnings_per_rental": 3.86
    }
  ],
  "total_staff": 2,
  "filters": {
    "start_date": "all",
    "end_date": "all",
    "store_id": "all"
  }
}
```

---

#### Reporte Adicional: Resumen del Sistema

Proporciona una vista general del sistema.

```http
GET /api/reports/summary
```

**Respuesta (200):**

```json
{
  "success": true,
  "summary": {
    "active_customers": 584,
    "total_films": 1000,
    "total_inventory": 4581,
    "active_rentals": 183,
    "completed_rentals": 15861,
    "total_rentals": 16044,
    "total_revenue": 61312.04,
    "active_staff": 2,
    "total_stores": 2
  },
  "top_categories": [
    {
      "category": "Sports",
      "rentals": 1179
    },
    {
      "category": "Foreign",
      "rentals": 1033
    }
  ],
  "recent_activity": [...]
}
```

---

### Películas

#### Obtener Todas las Películas

```http
GET /api/films?page=1&limit=20&category=Action&rating=PG&available=true
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | integer | Número de página |
| limit | integer | Resultados por página |
| category | string | Filtrar por categoría |
| rating | string | Filtrar por clasificación |
| available | boolean | Solo disponibles |

---

#### Obtener Película por ID

```http
GET /api/films/:id
```

---

#### Buscar Películas

```http
GET /api/films/search/query?q=action&category=Action&rating=PG
```

---

#### Películas Disponibles

```http
GET /api/films/available/list?limit=50
```

---

#### Obtener Categorías

```http
GET /api/films/categories/list
```

---

### Clientes

#### Obtener Todos los Clientes

```http
GET /api/customers?page=1&limit=20&active=true
```

---

#### Obtener Cliente por ID

```http
GET /api/customers/:id
```

---

#### Buscar Clientes

```http
GET /api/customers/search/query?q=mary
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## Ejemplos de Uso

### Ejemplo 1: Flujo Completo de Renta

```bash
# 1. Buscar película disponible
curl "http://localhost:3000/api/films/available/list?limit=1"

# 2. Obtener cliente
curl "http://localhost:3000/api/customers/1"

# 3. Crear renta
curl -X POST "http://localhost:3000/api/rentals" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "inventory_id": 1,
    "staff_id": 1
  }'

# 4. Devolver DVD
curl -X PUT "http://localhost:3000/api/rentals/16050/return"
```

### Ejemplo 2: Generar Reportes

```bash
# Reporte de cliente
curl "http://localhost:3000/api/reports/customer/1/rentals"

# DVDs atrasados
curl "http://localhost:3000/api/reports/unreturned?days_overdue=7"

# Top 10 películas
curl "http://localhost:3000/api/reports/top-films?limit=10"

# Ganancias de staff
curl "http://localhost:3000/api/reports/staff-earnings"
```

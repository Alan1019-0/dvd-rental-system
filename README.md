# Aplicación DVD-Rental

# Descripción General del Sistema
La **Aplicación DVD-Rental** es un sistema completo para gestionar la **renta, devolución y cancelación de DVDs**, además de generar múltiples **reportes** relacionados con clientes, películas y desempeño del personal.

## Integrantes
- **Gómez Juárez Alan Fabricio**
- **Luna García Erika Josabet**
- **Navarro Negrete María Fernanda**

---

El proyecto incluye:
- Backend en Node.js + Express  
- Frontend en Python (Tkinter)  
- Base de datos PostgreSQL (*dvdrental*)  
- API REST para comunicación  
- Pruebas automáticas  
- Compatibilidad con Docker  

---

# Arquitectura del Proyecto

## 🔹 1. Backend (Carpeta `backend/`)
- Construido con **Node.js y Express**.
- Maneja rutas API para clientes, películas, rentas y reportes.
- Estructura basada en:
  - `routes/` → rutas de la API  
  - `controllers/` → lógica de negocio  
  - `config/` → conexión y configuración de BD  
- Conexión PostgreSQL mediante `database.js`.

## 🔹 2. Base de Datos (Carpeta `database/`)
Contiene:
- `dvdrental.tar` → dump completo del esquema.  
- `restore.sql` → script de restauración.

Docker reconstruye la base automáticamente al levantar los contenedores.

## 🔹 3. Frontend (Carpeta `frontend/`)
- Interfaz gráfica con **Tkinter**.
- Llama al backend mediante peticiones HTTP desde `api.py`.
- Ventanas separadas dentro de `ui/`:
  - Rentas  
  - Devoluciones  
  - Cancelaciones  
  - Reportes  
  - Clientes  

---

# Estructura del Proyecto

dvd-rental-system/
│
├── backend/
│ ├── src/
│ │ ├── config/
│ │ ├── controllers/
│ │ ├── routes/
│ │ └── server.js
│ ├── Dockerfile
│ └── package.json
│
├── frontend/
│ ├── ui/
│ ├── api.py
│ ├── main.py
│ └── tests/
│
├── database/
│ ├── dvdrental.tar
│ └── restore.sql
│
├── docs/
│ └── API.md
│
├── scripts/
│
└── docker-compose.yml


---

# Instalación y Ejecución del Proyecto

## Opción 1: Ejecutar con Docker

En la raíz del proyecto ejecutar:

docker-compose up --build

Esto levanta:
- PostgreSQL con los datos de *dvdrental*
- Backend Express
- Frontend si está preparado en el compose

---

## Opción 2: Ejecutar manualmente

### 🔹 Backend
cd backend
npm install
npm start


El backend correrá en:  
**http://localhost:3000**

---

### 🔹 Frontend (Tkinter)

cd frontend
pip install -r requeriments.txt
python main.py

---

# 🖥️ Manual de Usuario

## Iniciar el Sistema
1. Ejecutar `main.py`.
2. Desde el menú principal seleccionar el módulo deseado.

---

## Renta de DVDs
1. Abrir **Rentas**.
2. Seleccionar el cliente.
3. Elegir la película.
4. Confirmar la renta.

El backend registra:
- Cliente
- Película
- Staff
- Fecha de renta

---

## Devolver un DVD
1. Abrir **Devoluciones**.
2. Seleccionar una renta activa.
3. Confirmar la devolución.

El backend actualiza la fecha de retorno.

---

## Cancelar una Renta
1. Ir a **Cancelar Renta**.
2. Seleccionar el cliente.
3. Elegir la renta.
4. Confirmar cancelación.

La renta es eliminada del registro.

---

# Reportes Disponibles

El sistema genera los siguientes reportes:

- Top DVDs más rentados  
- Ganancias por empleado (staff)  
- Actividad mensual por fechas  
- Todas las rentas de un cliente  

Todos los reportes se consumen desde el backend vía API REST.

---

# Ejecución de Pruebas

## Backend
sh scripts/test_api.sh

## Frontend
cd frontend/tests
sh run_all_tests.sh
---

# Funcionamiento Interno del Backend

## Rutas (carpeta `routes/`)
- `customer.routes.js` → clientes  
- `film.routes.js` → películas  
- `rental.routes.js` → rentas y devoluciones  
- `report.routes.js` → reportes  

## Controladores (carpeta `controllers/`)
Cada controlador contiene:
- Lógica de negocio  
- Consultas SQL  
- Validaciones  

## Servidor (`server.js`)
Configura:
- Express  
- Middlewares  
- Rutas  
- Inicio del servidor  

---

# Funcionamiento Interno del Frontend

Tkinter organiza la interfaz gráfica por módulos:

- `customer_register_window.py`  
- `rental_window.py`  
- `return_rental_window.py`  
- `cancel_rental_window.py`  
- `report_top_dvds_window.py`  
- `report_staff_earnings_window.py`  
- `report_monthly_activity_window.py`  

`main.py` funciona como menú principal general del programa.

---

La **Aplicación DVD-Rental** es un proyecto completo que integra:

- Interfaz gráfica intuitiva  
- Backend robusto  
- Base de datos real  
- Módulos de administración  
- Reportes avanzados  
- Arquitectura clara y bien organizada  


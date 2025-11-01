# Guía Rápida de Inicio - DVD Rental System


### Opción 1: Docker

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/dvd-rental-system.git
cd dvd-rental-system

# 2. Copiar archivo de configuración
cp .env.example .env

# 3. Descargar base de datos DVD Rental
wget https://www.postgresqltutorial.com/wp-content/uploads/2019/05/dvdrental.zip
unzip dvdrental.zip
mv dvdrental.tar database/

# 4. Iniciar con Docker Compose
docker-compose up -d

# 5. Esperar 30 segundos y verificar
curl http://localhost:3000/health
```

**¡Listo!** La API está corriendo en `http://localhost:3000`

---

### Opción 2: Sin Docker

#### Requisitos:
- Node.js 18+
- PostgreSQL 15+
- npm o yarn

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/dvd-rental-system.git
cd dvd-rental-system

# 2. Configurar base de datos PostgreSQL
createdb dvdrental

# 3. Descargar y restaurar datos
wget https://www.postgresqltutorial.com/wp-content/uploads/2019/05/dvdrental.zip
unzip dvdrental.zip
pg_restore -U postgres -d dvdrental dvdrental.tar

# 4. Configurar variables de entorno
cd backend
cp ../.env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 5. Instalar dependencias
npm install

# 6. Ejecutar índices y vistas adicionales
psql -U postgres -d dvdrental -f ../database/init.sql

# 7. Iniciar servidor
npm start
```

La API estará disponible en `http://localhost:3000`

---

## 🧪 Ejecutar Tests

### Tests Automáticos (CURL/BASH)

```bash
# Dar permisos de ejecución
chmod +x scripts/test_api.sh

# Ejecutar tests
cd scripts
./test_api.sh

# Ver resultados
cat test_results.log
```

### Tests en GitHub Actions

Los tests se ejecutan automáticamente en cada push:

```bash
git add .
git commit -m "Tu mensaje"
git push origin main
```

Ve los resultados en la pestaña "Actions" de tu repositorio.

---

## Primeros Pasos

### 1. Verificar que está funcionando

```bash
curl http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2025-10-31T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 2. Ver información de la API

```bash
curl http://localhost:3000/
```

### 3. Probar endpoint de películas

```bash
curl http://localhost:3000/api/films?limit=5
```

### 4. Crear tu primera renta

```bash
curl -X POST http://localhost:3000/api/rentals \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "inventory_id": 1,
    "staff_id": 1
  }'
```

### 5. Ver reportes

```bash
# DVDs no devueltos
curl http://localhost:3000/api/reports/unreturned

# Top 10 películas más rentadas
curl http://localhost:3000/api/reports/top-films?limit=10

# Ganancias por staff
curl http://localhost:3000/api/reports/staff-earnings
```

---

## Comandos Útiles

### Docker

```bash
# Ver logs en tiempo real
docker-compose logs -f api

# Ver estado de contenedores
docker-compose ps

# Reiniciar servicios
docker-compose restart

# Detener todo
docker-compose down

# Eliminar todo (incluyendo volúmenes)
docker-compose down -v
```

### Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it dvdrental-db psql -U postgres -d dvdrental

# Backup de base de datos
docker exec dvdrental-db pg_dump -U postgres dvdrental > backup.sql

# Restaurar backup
docker exec -i dvdrental-db psql -U postgres -d dvdrental < backup.sql
```

### API

```bash
# Modo desarrollo (con hot reload)
cd backend
npm run dev

# Ver logs
docker-compose logs -f api

# Ejecutar lint
cd backend
npm run lint

# Ejecutar tests unitarios
cd backend
npm test
```

---

## Solución de Problemas Comunes

### Error: "Port 3000 already in use"

```bash
# Cambiar puerto en .env
echo "API_PORT=3001" >> .env

# Reiniciar
docker-compose down
docker-compose up -d
```

### Error: "Database connection failed"

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar solo PostgreSQL
docker-compose restart postgres
```

### Error: "No such file or directory: dvdrental.tar"

```bash
# Descargar manualmente
wget https://www.postgresqltutorial.com/wp-content/uploads/2019/05/dvdrental.zip
unzip dvdrental.zip

# Asegurarse de que está en database/
mv dvdrental.tar database/

# Reiniciar
docker-compose down
docker-compose up -d
```

### API no responde después de iniciar

```bash
# Esperar 30-60 segundos para que inicie completamente
sleep 30

# Verificar logs
docker-compose logs api

# Si hay errores de DB, esperar más tiempo
docker-compose logs postgres
```

---

## 🆘 Ayuda

- 📖 Documentación completa: `README.md`
- 🔌 API Reference: `docs/API.md`
- 🐛 Reportar issues: GitHub Issues
- 💬 Preguntas: Crear una discussion en GitHub


## 📚 Siguientes Pasos

1. **Leer la documentación completa:** `docs/API.md`
2. **Configurar GitHub Actions:** Agregar secrets en GitHub
3. **Desarrollar Frontend:** Ver carpeta `frontend/`
4. **Personalizar .env:** Cambiar credenciales por defecto
5. **Explorar endpoints:** Usar Postman o Insomnia

## ✅ Checklist de Verificación

- [ ] Docker y Docker Compose instalados
- [ ] Repositorio clonado
- [ ] Base de datos descargada
- [ ] `.env` configurado
- [ ] Servicios iniciados con `docker-compose up -d`
- [ ] Health check exitoso: `curl localhost:3000/health`
- [ ] Tests pasando: `./scripts/test_api.sh`
- [ ] API respondiendo a requests

---

Para desarrollo del frontend, continúa con: `frontend/README.md`
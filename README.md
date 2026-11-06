# 🐾 PetStyle — Peluquería canina con servicio de ruta

Proyecto integrador · Desarrollo de Aplicaciones Web (Universidad ECCI).
Aplicación web full stack (SPA) con **dos roles**, cada uno con su propia vista:

| Rol               | Cómo accede                                  | Vista        | Qué puede hacer                                                                 |
|-------------------|----------------------------------------------|--------------|---------------------------------------------------------------------------------|
| **Cliente**       | Se registra solo ("Crear cuenta")            | `#/cliente`  | CRUD de sus mascotas, agendar citas (con ruta opcional), ver y cancelar sus citas |
| **Administrador** | Cuenta creada por el responsable del sistema | `#/admin`    | Ver todas las citas con teléfono y dirección del cliente; aprobar, poner en proceso, rechazar y entregar |

El registro público **siempre** crea clientes. Un cliente que intente abrir `#/admin` (o a la inversa)
recibe el mensaje *"Zona restringida"*, y además el backend rechaza la petición con `403`.

## Tecnologías
- **Frontend:** HTML5, CSS3, JavaScript (SPA con router por hash). Diseño adaptable a móvil y escritorio.
- **Backend:** Node.js + Express (API REST), autenticación con JWT.
- **Base de datos:** PostgreSQL (librería `pg`), alojada en Neon (los datos viven fuera del servidor).

## Estructura
```
petstyle/
├── docs/            modelo de datos (ER) y documentación
├── frontend/        index.html + src/ (main.js, styles/)
├── backend/
│   ├── src/         config · routes · controllers · services · models · middlewares · app.js · server.js
│   └── scripts/     seed.js (datos demo) y crear-admin.js
├── database/        schema.sql
└── tests/           pruebas de integración (login por rol, permisos, flujo de citas)
```
Capas: `routes` (endpoints) → `controllers` (HTTP) → `services` (reglas de negocio) → `models` (SQL).

## Instalación y ejecución
Requisitos: Node.js 18 o superior (se recomienda la versión 22 LTS) y una base PostgreSQL
(gratis en [Neon](https://neon.tech): crea un proyecto y copia la *connection string*).

```bash
cd backend
npm install
cp .env.example .env     # en Windows: copy .env.example .env   (y edita JWT_SECRET y DATABASE_URL)
npm run seed             # (opcional, SOLO en desarrollo) crea cuentas de demostración
npm start                # abre http://localhost:3000
```
`npm start` ejecuta `node src/server.js`. Las tablas se crean solas en la base indicada por `DATABASE_URL`.

> Para desarrollo local usa una base **distinta** a la de producción (en Neon: crea una *branch* `dev`),
> así las pruebas y el `seed` no tocan los datos reales.

### Cuentas de demostración (`npm run seed`)
| Rol           | Correo                | Contraseña  | En el login elige… |
|---------------|-----------------------|-------------|--------------------|
| Administrador | admin@petstyle.com    | admin123    | **Administrador**  |
| Cliente       | cliente@petstyle.com  | cliente123  | **Cliente**        |

### Crear o promover un administrador
```bash
npm run crear-admin -- correo@ejemplo.com                         # promueve una cuenta existente
npm run crear-admin -- correo@ejemplo.com "Nombre" "contraseña"   # crea una cuenta nueva
```

### Pruebas
Necesitan una base PostgreSQL **de pruebas** (se vacía al empezar; su nombre debe contener `test`):
```powershell
cd backend
$env:TEST_DATABASE_URL="postgresql://usuario:clave@host/petstyle_test?sslmode=require"
npm test
```
Sin `TEST_DATABASE_URL` las pruebas se omiten.

## Variables de entorno (`backend/.env`)
| Variable         | Descripción                                                                  |
|------------------|------------------------------------------------------------------------------|
| `PORT`           | Puerto del servidor (por defecto 3000)                                       |
| `JWT_SECRET`     | **Obligatoria en producción.** Cadena larga y aleatoria                      |
| `DATABASE_URL`   | **Obligatoria.** Cadena de conexión de PostgreSQL (Neon, Supabase, local…)   |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE` | Si no existe ningún administrador, se crea uno al arrancar |

## API
| Método     | Ruta                      | Rol           | Descripción                                   |
|------------|---------------------------|---------------|-----------------------------------------------|
| POST       | /api/auth/registro        | público       | Crea una cuenta de **Cliente**                |
| POST       | /api/auth/login           | público       | `{ email, password, rol }`; valida que la cuenta tenga ese rol |
| GET        | /api/auth/me              | autenticado   | Perfil actual                                 |
| GET/POST   | /api/mascotas             | Cliente       | Listar / crear mis mascotas                   |
| PUT/DELETE | /api/mascotas/:id         | Cliente       | Editar / eliminar (solo las propias)          |
| POST       | /api/citas                | Cliente       | Agendar cita (queda *Pendiente*)              |
| GET        | /api/citas/mias           | Cliente       | Mis citas agendadas                           |
| PATCH      | /api/citas/:id/cancelar   | Cliente       | Cancelar una cita propia *Pendiente*          |
| GET        | /api/citas                | Administrador | Todas las citas + contacto del cliente        |
| PATCH      | /api/citas/:id/estado     | Administrador | Aprobar / en proceso / rechazar / entregar    |

## Despliegue gratuito (Render)
1. Sube el repositorio a GitHub (sin `.env` ni `data/`).
2. En Render crea un **Web Service** conectado al repositorio, con **Root Directory vacío** (raíz del repo, porque el backend sirve la carpeta `frontend/`).
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
3. En *Environment* define: `NODE_ENV=production`, `NODE_VERSION=22`, `JWT_SECRET` (cadena larga aleatoria), `DATABASE_URL` (la de Neon), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
4. Despliega y prueba el enlace público: registro, login con ambos roles, citas.

⚠️ **Limitaciones del plan gratuito de Render:** el servicio se suspende tras 15 minutos sin tráfico y tarda cerca de un
minuto en reactivarse. Los **datos no se pierden** al reiniciar o redesplegar, porque están en PostgreSQL (Neon) y no en
el disco del servidor. Revisa también los límites del plan gratuito de Neon.

## Enlaces
- Repositorio: _(pegar URL de GitHub)_
- Aplicación publicada: _(pegar URL pública)_

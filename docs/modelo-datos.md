# Modelo de datos · PetStyle (SQLite)

```mermaid
erDiagram
    USUARIOS ||--o{ MASCOTAS : "registra"
    USUARIOS ||--o{ CITAS    : "solicita"
    MASCOTAS ||--o{ CITAS    : "recibe"

    USUARIOS {
        int id PK
        text nombre
        text email UK
        text telefono
        text password_hash
        text rol "CLIENTE | ADMINISTRADOR"
        text created_at
    }
    MASCOTAS {
        int id PK
        int usuario_id FK
        text nombre
        text especie "Perro | Gato"
        text raza
        int edad
    }
    CITAS {
        int id PK
        int usuario_id FK
        int mascota_id FK
        text servicio
        text estilo_corte
        text especificaciones
        int requiere_ruta "0 | 1"
        text direccion "obligatoria si requiere_ruta = 1"
        text fecha_hora
        text estado "Pendiente | Aprobada | En proceso | Rechazada | Entregada | Cancelada"
    }
```

## Reglas de integridad
- `usuarios.email` es único (sin distinguir mayúsculas).
- Borrar un usuario borra sus mascotas (`ON DELETE CASCADE`).
- **No** se puede borrar una mascota que tenga citas (`ON DELETE RESTRICT`).
- Las contraseñas se guardan con bcrypt (`password_hash`), nunca en texto plano.

## Ciclo de estados de una cita
```
Pendiente ──► Aprobada ──► En proceso ──► Entregada
    │             │
    │             └──► Rechazada          (administrador)
    ├──► Rechazada                        (administrador)
    └──► Cancelada                        (cliente, solo si sigue Pendiente)
```
El esquema completo está en [`database/schema.sql`](../database/schema.sql).

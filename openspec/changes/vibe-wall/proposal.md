# Propuesta: Vibe Wall

## Objetivo

Crear una galería visual administrable, asociada a eventos, que pueda explorarse por evento, mes y año.

## Cambios

### Web pública

- Nueva ruta `/vibe`.
- Acceso `VIBE WALL` en navegación de escritorio y móvil.
- Componente reutilizable con filtros y lightbox.

### Administración

- Nueva ruta `/galeria`.
- Acceso `Vibe Wall` antes de Configuración.
- Carga múltiple al bucket `galeria-eventos`.
- CRUD sobre `tGaleria`, vinculado a `mEvento`.

### Supabase

- Lectura pública únicamente de registros activos.
- Escritura de datos y archivos para usuarios autenticados.

## Fuera del alcance

- Edición de imágenes.
- Procesamiento y reproducción de video.
- Álbumes independientes de eventos.

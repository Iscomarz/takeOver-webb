# Diseño técnico: Vibe Wall

## Modelo

`tGaleria` conserva `evento_id` y `fecha_contenido` para permitir agrupaciones futuras por evento, mes y año. Se consumen `id`, `evento_id`, `tipo`, `storage_path`, `url_publica`, `descripcion`, `fecha_contenido`, `orden` y `activo`.

## Flujo administrativo

1. Se selecciona un evento.
2. La fecha toma inicialmente la fecha del evento.
3. Las imágenes se cargan en `galeria-eventos/{evento_id}/`.
4. Se crea un registro por imagen.
5. El contenido se puede ocultar, publicar o eliminar.

## Flujo público

El layout consulta los sets y la galería en paralelo. El servicio enriquece cada registro con datos del evento y el componente resuelve los filtros en cliente.

## Interfaz

- Muro responsivo mediante columnas CSS.
- Escala de grises que recupera color al interactuar.
- Lightbox sin abandonar la página.
- Componente con límite y filtros opcionales para reutilización.

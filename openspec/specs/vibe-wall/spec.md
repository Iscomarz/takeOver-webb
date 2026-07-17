# Especificación: Vibe Wall

## Publicación administrable

El sistema debe permitir que un usuario autenticado cargue imágenes, las relacione con un evento y defina fecha, descripción, orden y estado.

### Escenario: carga

- Dado un evento y archivos válidos
- Cuando el usuario publica el contenido
- Entonces los archivos se almacenan bajo el identificador del evento
- Y se crea un registro por imagen.

## Consulta pública

La web debe mostrar únicamente registros activos e identificar el evento asociado.

### Escenario: contenido oculto

- Dado un elemento inactivo
- Cuando un visitante abre Vibe Wall
- Entonces el elemento no aparece.

## Exploración

La galería debe filtrarse por evento, año y mes sin recargar la página.

### Escenario: filtro combinado

- Dado contenido de distintos eventos y fechas
- Cuando se selecciona evento, año y mes
- Entonces aparecen únicamente los elementos coincidentes.

## Vista ampliada

El visitante debe poder ampliar y cerrar una imagen sin abandonar la ruta.

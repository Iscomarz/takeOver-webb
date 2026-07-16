# Ideas Futuras para la Web de Take Over 🚀

Este documento contiene el detalle y la propuesta de desarrollo simple para las 4 ideas de mejora de diseño y dinamismo de la web, planificadas para ser implementadas cuando el tiempo lo permita. La meta es transformar el sitio de una "taquilla estática" a un "portal inmersivo de comunidad".

---

## 1. "The Sounds of Take Over" (Reproductor de Sets & Playlists)

### 📝 Concepto
Integrar la música en el sitio para que los usuarios puedan escuchar sets de DJs grabados en vivo en eventos pasados o playlists curadas de la marca mientras navegan por la web.

### 🎨 Diseño UI/UX
* **Reproductor Flotante:** Un reproductor minimalista en la esquina inferior izquierda/derecha con controles básicos (Play, Pause, volumen y barra de progreso).
* **Estética:** Glassmorphism (`backdrop-filter: blur`), color oscuro translúcido con bordes finos e iluminación sutil de acento verde (`#56FDB8`).
* **Micro-animación:** Un ecualizador de barras SVG/CSS animado que se mueva únicamente cuando el audio se esté reproduciendo para dar feedback visual de vida.

### 🛠️ Propuesta de Desarrollo Simple
* **Componente Svelte:** Crear `src/lib/components/MiniPlayer.svelte`.
* **Integración:** Usar el widget API de **SoundCloud** o el player SDK de **Spotify** en modo invisible o minimalista, controlándolo mediante llamadas de JavaScript desde nuestro componente.
* **Estado Global:** Usar un store de Svelte (`audioStore.js`) para almacenar el estado del reproductor (canción actual, si está reproduciendo) para que la música no se corte al navegar entre las distintas páginas del sitio (navegación SPA).

---

## 2. "Vibe Wall" (Galería Inmersiva de Recuerdos)

### 📝 Concepto
Una sección visualmente potente que muestre la atmósfera de los eventos anteriores mediante un collage interactivo de fotos de alta definición y bucles de video cortos (aftermovies / reels).

### 🎨 Diseño UI/UX
* **Grid Asimétrico:** Un diseño de rejilla tipo Pinterest o mosaico irregular, rompiendo la estructura monótona de tarjetas.
* **Hover Interactivo:** Por defecto, las imágenes se muestran en escala de grises y con un desenfoque ligero. Al pasar el cursor, se activan el color, la nitidez y un zoom suave de escala (`scale-105 duration-500`).
* **Modal / Lightbox:** Al dar clic en cualquier foto o video, se abre una ventana modal a pantalla completa con fondo oscurecido para ver el contenido en alta definición.

### 🛠️ Propuesta de Desarrollo Simple
* **Componente Svelte:** Crear `src/lib/components/VibeWall.svelte`.
* **Base de Datos / Storage:** Crear una cubeta en Supabase Storage `galeriaEventos` para hospedar las fotos y videos. Opcionalmente, crear una tabla en Supabase `tGaleria` que guarde la URL del recurso, descripción y el ID del evento asociado para poder filtrar las fotos por evento.
* **Efectos:** Utilizar clases nativas de Tailwind CSS (`grayscale hover:grayscale-0 transition-all duration-500 ease-out`) para evitar sobrecargar la web con librerías externas de JavaScript.

---

## 4. "Modo Teaser & Hype" (Para cuando no hay eventos activos)

### 📝 Concepto
Evitar mostrar una pantalla vacía o sosa cuando no hay un evento activo a la venta. En su lugar, activar un "modo misterio" que capture leads (correos o teléfonos de WhatsApp) generando intriga sobre la siguiente locación o fecha.

### 🎨 Diseño UI/UX
* **Estética Enigmática:** Fondo negro profundo con efectos de distorsión digital o ruido analógico. Un texto grande estilo terminal: `[NEXT DESTINATION LOADING...]`.
* **Cuenta Regresiva de Precisión:** Un reloj digital con milisegundos activos corriendo hacia atrás para generar urgencia psicológica.
* **Call to Action Ultra-Simple:** Un campo de entrada sin bordes llamativos con la leyenda *"Registra tu correo para recibir la ubicación secreta y pre-venta exclusiva"*.

### 🛠️ Propuesta de Desarrollo Simple
* **Componente Svelte:** Crear `src/lib/components/TeaserState.svelte` y renderizarlo en `src/routes/eventos/+page.svelte` y la Home cuando la propiedad `eventoActivo` del store sea falsa.
* **Base de Datos:** Crear una tabla en Supabase `tListaEspera` (`id`, `correo`, `creado_en`) para almacenar los registros directamente a través de una API interna en `/api/lista-espera`.
* **Automatización:** Conectar la inserción de esta tabla con un envío automático de correo de bienvenida de misterio (usando tu integración actual con Resend).

---

## 5. "El Manifiesto" (La Filosofía del Club)

### 📝 Concepto
Presentar las "reglas" de la promotora y su filosofía underground (ej. libre expresión, respeto, prohibido tomar fotos en la pista, priorizar la música). Esto crea identidad de culto en la comunidad.

### 🎨 Diseño UI/UX
* **Tipografía Bolder:** Usar textos gigantescos con la tipografía de títulos (`JockeyOne` o similar), en mayúsculas y colores de alto contraste.
* **Animaciones por Scroll:** Utilizar animaciones guiadas por el desplazamiento (Scroll-Driven Animations). Las frases se van iluminando (pasan de opacidad `0.1` a `1.0` y ganan brillo verde) justo cuando entran a la mitad de la pantalla del usuario.
* **Poco Texto, Mucho Mensaje:** Frases cortas y contundentes ordenadas verticalmente.

### 🛠️ Propuesta de Desarrollo Simple
* **Estructura HTML5:** Crear una sección semántica `<section id="manifiesto">` en la página principal o de "About".
* **Svelte Intersection Observer:** Usar un script simple con el API nativo `IntersectionObserver` de JavaScript en Svelte para alternar clases de Tailwind CSS (como `opacity-100 translate-y-0` y `opacity-20 text-neutral-700`) cuando los elementos entren en el viewport del usuario.
* **Rendimiento:** Al ser puro CSS y JS nativo, tiene impacto de rendimiento cero en la velocidad de carga de la página.

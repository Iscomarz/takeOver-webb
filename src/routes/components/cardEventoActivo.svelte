<script>
    export let pathImage;
    export let titulo;
    export let fecha;
    export let diaYHora;
    export let lugar;
    export let idEvento;

    import { goto } from '$app/navigation';
    import { formatDiaYHora, formatDate } from '$lib/utils/formatFechas.js';

    function navigateToEvent() {
        goto(`/eventos/${idEvento}`);
    }

    $: formattedDiaYHora = formatDiaYHora(fecha);
    $: formattedDate = formatDate(fecha);
</script>

<!-- Card con efecto glassmorphism -->
<div class="relative w-full max-w-[900px] mx-auto my-8 group/card">
  <!-- Main card -->
  <div class="relative bg-gradient-to-br from-neutral-900/95 via-zinc-900/95 to-neutral-950/95 backdrop-blur-xl rounded-[20px] overflow-hidden shadow-2xl border border-white/10">
    <!-- Efecto de brillo sutil -->
    <div class="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-black/20 pointer-events-none"></div>
    
    <!-- Textura de ruido sutil -->
    <div class="absolute inset-0 opacity-[0.015] pointer-events-none" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
    
    <div class="relative flex flex-col md:flex-row min-h-[400px]">
      <!-- Info Section -->
      <div class="flex-1 p-8 md:p-10 flex flex-col justify-center gap-6 z-10">
        <!-- Badges -->
        <div class="flex flex-wrap gap-2">
          <span class="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md text-gray-300 px-4 py-2 rounded-full text-sm font-medium border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300">
            House 
          </span>
          <span class="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md text-gray-300 px-4 py-2 rounded-full text-sm font-medium border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300">
            Indie Dance 
          </span>
          <span class="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md text-gray-300 px-4 py-2 rounded-full text-sm font-medium border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300">
            Techno 
          </span>
        </div>

        <!-- Título con efecto gradient -->
        <h1 class="font-jockey text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300 m-0 leading-tight uppercase drop-shadow-lg">
          {titulo}
        </h1>

        <!-- Detalles -->
        <div class="flex flex-col gap-4 text-gray-300">
          <!-- Dia -->
          <div class="flex items-center gap-3 text-base group/item hover:text-white transition-colors duration-300">
            <div class="p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 group-hover/item:bg-white/10 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <span>{formattedDate}</span>
          </div>

          <!-- Fecha -->
          <div class="flex items-center gap-3 text-base group/item hover:text-white transition-colors duration-300">
            <div class="p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 group-hover/item:bg-white/10 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span>{formattedDiaYHora}</span>
          </div>

          <!-- Ubicación -->
          <div class="flex items-center gap-3 text-base group/item hover:text-white transition-colors duration-300">
            <div class="p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 group-hover/item:bg-white/10 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <span>{lugar}</span>
          </div>
        </div>

        <!-- Botón con efecto cristalizado -->
        <button 
          on:click={navigateToEvent}
          class="mt-4 px-8 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-white hover:text-gray-900 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,255,255,0.3)] active:scale-95"
        >
          Obtener entradas ahora
        </button>
      </div>

      <!-- Image Section con overlay gradient -->
      <div class="relative flex-1 overflow-hidden min-h-[300px] md:min-h-0 group/image">
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent z-10 pointer-events-none"></div>
        <img 
          src={pathImage} 
          alt={titulo}
          class="w-full h-full object-cover transition-all duration-700 group-hover/image:scale-110 group-hover/image:brightness-110"
        />
      </div>
    </div>
  </div>
</div>
<script>
  import Title from "../../components/Title.svelte";
  import DateComponent from "../../components/Date.svelte";
  import Location from "../../components/Location.svelte";
  import AboutEvent from "../../components/AboutEvent.svelte";
  import Tickets from "../../components/Tickets.svelte";
  import Cards from "../../components/cards.svelte";
  import supabase from "$lib/supabase";
  import { onMount, tick } from "svelte";
  import { invalidateAll, goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import BotonComunidad from "../../components/botonComunidad.svelte";
  import { eventoId }  from "../../../lib/stores/eventoId";

  let loading = true;
  let eventoActivo = true;

  let mEvento = {};
  let fases = [];
  let productosStripe = [];
  let urlImagenPortada;
  let idEvento;

  const unsubscribe = eventoId.subscribe((value) => {
    idEvento = value;
  });

  async function loadData() {
    let { data: evento, error } = await supabase
      .from("mEvento")
      .select("*")
      .eq("idevento", idEvento);
    if (evento) {
      mEvento = evento[0];
    }

    if (error) {
      eventoActivo = false;
      console.log("Error al traer el evento activo");
    } else if (evento.length == 0) {
      eventoActivo = false;
      console.log("No hay eventos activos en este momento");
    } else {
      //Traer portada del evento
      const { data } = supabase.storage
        .from("imageEventos")
        .getPublicUrl(mEvento.pathImage);

      urlImagenPortada = data.publicUrl;
      //Obtener las faces o tickets del evento selecionado
      let { data: cFases, errorF } = await supabase
        .from("cFaseEvento")
        .select("*")
        .eq("idEvento", mEvento.idevento);

      if (cFases.length > 0) {
        fases = cFases;
        //console.log("Fases del evento:", fases);
        // Llama a la función para obtener los productos
        //productosStripe = await getProducts();
        //enlazar identificador de precio con fase (Despues hay que hacerlo directamente al crear la fase en supabase y el producto en stripe)
        //for(const producto of productosStripe){
        //  for(const fase of fases){
        //    if(producto.name == fase.nombreFace){
        //      fase.idPrecioStripe = producto.default_price;
        //    }
        //  }
        //}
      } else if (errorF) {
        console.log("Error al traer las fases");
      }
    }
    await tick();
    loading = false;
  }

  onMount(async () => {
    await loadData();
  });

  async function getProducts() {
    try {
      // Llamada al endpoint
      const response = await fetch("/api/get-products-stripe", {
        method: "GET",
      });

      // Verifica si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.statusText}`);
      }

      // Parsear los datos de los productos
      const products = await response.json();

      return products;
    } catch (error) {
      console.error("Error en la llamada al endpoint:", error);
      return null;
    }
  }

  function formatearFechaLarga(fechaStr) {
    const fecha = new Date(fechaStr);
    const str = fecha.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Pone en mayúscula solo la primera letra
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatearHora(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  }

  function formatearRangoFechas(fechaInicioStr, fechaFinStr) {
    const inicio = new Date(fechaInicioStr);
    const fin = new Date(fechaFinStr);

    const opcionesFecha = {
      timeZone: "America/Mexico_City",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };

    const opcionesHora = {
      timeZone: "America/Mexico_City",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    };

    const fecha = inicio.toLocaleDateString("es-MX", opcionesFecha);
    const horaInicio = inicio.toLocaleTimeString("es-MX", opcionesHora);
    const horaFin = fin.toLocaleTimeString("es-MX", opcionesHora);

    // Eliminar el año para hacerlo más corto
    const [diaSemana, dia, mes, _anio] = fecha.split(" ");

    // console.log(
    //   `${diaSemana} ${dia} ${mes} ${inicio.getFullYear()} ${horaInicio} - ${horaFin}`
    // );
    return `${diaSemana} ${dia} ${mes} ${inicio.getFullYear()} ${horaInicio} - ${horaFin}`;
  }
</script>

<svelte:head>
  <title>{mEvento.nombreEvento || "Take Over presenta: NORTHWAVES"}</title>
  <meta
    name="description"
    content="Adquiere tus accesos para el proximo Take Over"
  />
</svelte:head>
<section class="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] xl:w-[75%] 2xl:w-[70%] max-w-[1500px] mx-auto flex flex-col mt-[50px] md:mt-[80px] lg:mt-[100px] xl:mt-[120px] gap-4">
  {#if loading}
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center" transition:fade={{ duration: 200 }}>
      <p class="text-white/70 text-xl tracking-wider animate-pulse">Cargando evento...</p>
    </div>
  {:else if !eventoActivo}
    <div class="text-gray-100">
      <h1>Por el momento no tenemos eventos disponibles</h1>
      <BotonComunidad />
      <button on:click={() => goto("/")}>Volver al inicio</button>
    </div>
  {:else}
    <!-- Header del evento -->
    <div class="text-center mb-2 mt-4" style="font-family: 'JostRegular', sans-serif;">
      <h2 class="text-3xl md:text-4xl text-white uppercase tracking-wide mb-2 font-semibold">
        {mEvento.nombreEvento}
      </h2>
      <p class="text-gray-300 text-sm md:text-base mb-3 max-w-2xl mx-auto leading-relaxed">
        {mEvento.descripcionCorta}
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-400">
        <!-- Fecha -->
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-500">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{formatearFechaLarga(mEvento.fechaInicio)}</span>
        </div>
        <!-- Separador -->
        <span class="hidden sm:inline text-gray-600">•</span>
        <!-- Venue -->
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-500">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{mEvento.venue}</span>
        </div>
      </div>
    </div>

    <!-- Grid de 2 columnas: Tickets + Cards a la izquierda, Imagen a la derecha -->
    <div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
      <!-- Imagen (aparece primero en móvil, segundo en desktop) -->
      {#if urlImagenPortada}
        <div class="relative w-full h-full min-h-[300px] lg:min-h-[600px] group/image order-1 lg:order-2">
          <div class="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent z-10 pointer-events-none rounded-[20px]"></div>
          <img 
            src={urlImagenPortada} 
            alt="portada" 
            class="w-full h-full object-cover rounded-[20px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-700 group-hover/image:scale-105 group-hover/image:brightness-110" 
          />
        </div>
      {/if}

      <!-- Tickets y Cards (aparecen segundo en móvil, primero en desktop) -->
      <div class="flex flex-col gap-4 order-2 lg:order-1">
        {#if fases.length > 0}
          <div class=" p-7 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20 pointer-events-none rounded-[20px]"></div>
            <div class="relative z-10">
              <Tickets
                ticketDataEve={fases}
                eventoPasado={new Date(mEvento.fechaFin) < new Date()
                  ? true
                  : false}
                eventoReferidos={mEvento.referidos}
              />
            </div>
          </div>
        {/if}
        
        <div class=" p-7 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20 pointer-events-none rounded-[20px]"></div>
          <div class="relative z-10">
            <Cards />
          </div>
        </div>
      </div>
    </div>

    <!-- Info del evento abajo ocupando todo el ancho -->
    <div class=" p-8 lg:p-10 flex flex-col gap-5 relative overflow-hidden mb-4">
      <!-- Efecto de brillo sutil -->
      <div class="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20 pointer-events-none rounded-[20px]"></div>
      
      <!-- Textura de ruido sutil -->
      <div class="absolute inset-0 opacity-[0.015] pointer-events-none rounded-[20px]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulance type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
      
      <div class="relative z-10">
        <Title
          titulo={mEvento.nombreEvento}
          fecha={`${formatearFechaLarga(mEvento.fechaInicio)} / ${formatearHora(mEvento.fechaInicio)}`}
        />
        <AboutEvent descripcion={mEvento.descripcion} />

        <DateComponent
          fecha={formatearRangoFechas(
            mEvento.fechaInicio,
            mEvento.fechaFin
          )}
        />

        <Location
          nombreLugar={mEvento.venue}
          direccion={mEvento.direccion}
          linkMaps={mEvento.direccionURL}
        />
      </div>
    </div>
  {/if}
</section>


<style>
  /* Clase para el efecto glass cristalizado */
  .glass-card {
    background: linear-gradient(to bottom right, rgba(23, 23, 23, 0.95), rgba(38, 38, 38, 0.95), rgba(23, 23, 23, 0.95));
    backdrop-filter: blur(24px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
</style>

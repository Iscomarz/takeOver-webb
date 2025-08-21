<script>
  import Title from "../../components/Title.svelte";
  import DateComponent from "../../components/Date.svelte";
  import Location from "../../components/Location.svelte";
  import AboutEvent from "../../components/AboutEvent.svelte";
  import Tickets from "../../components/Tickets.svelte";
  import supabase from "$lib/supabase";
  import { onMount, tick } from "svelte";
  import { invalidateAll, goto } from "$app/navigation";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import logo from "$lib/images/takeover-logo.png";
  import { fade } from "svelte/transition";
  import BotonComunidad from "../../components/botonComunidad.svelte";
  import { eventoId } from "../../../lib/stores/eventoId";

  let scale = tweened(1, {
    duration: 400,
    easing: cubicOut,
  });
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
    //Obtener evento activo
    await loadData();
    let interval = setInterval(() => {
      if (loading) {
        scale.set(1.1);
        setTimeout(() => {
          scale.set(1);
        }, 400);
      } else {
        clearInterval(interval);
      }
    }, 1500);
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

    console.log(
      `${diaSemana} ${dia} ${mes} ${inicio.getFullYear()} ${horaInicio} - ${horaFin}`
    );
    return `${diaSemana} ${dia} ${mes} ${inicio.getFullYear()} ${horaInicio} - ${horaFin}`;
  }
</script>

<svelte:head>
  <title>{mEvento.nombreEvento}</title>
  <meta
    title="{mEvento.nombreEvento}"
    name="description"
    content="Compra tus accesos para el proximo Take Over"
  />
</svelte:head>
<section class="contenedor">
  {#if loading}
    <div class="loading-container" transition:fade={{ duration: 200 }}>
      <img src={logo} style="transform: scale({$scale})" alt="loading" />
    </div>
  {:else if !eventoActivo}
    <div class="seccion-no-evento">
      <h1>Por el momento no tenemos eventos disponibles</h1>
      <BotonComunidad />
      <button on:click={() => goto("/")}>Volver al inicio</button>
    </div>
  {:else}
    {#if urlImagenPortada}
      <div class="img-event">
        <img src={urlImagenPortada} alt="portada" />
      </div>
    {/if}

    <div class="info-event-container">
      <section class="info-event">
        <div class="components">
          {#if fases.length > 0}
            <Tickets
              ticketDataEve={fases}
              eventoPasado={new Date(mEvento.fechaFin) < new Date()
                ? true
                : false}
            />
          {/if}
          <div class="border-info">
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
      </section>
    </div>
  {/if}
</section>

<style>
  .info-event-container {
    width: 48%;
  }
  .loading-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .loading-container img {
    width: 150px;
    transition: transform 0.75s ease-in-out;
  }
  .img-event {
    width: 52%;
  }
  span {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .background-blur {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    filter: blur(
      10px
    ); /* Ajusta este valor para cambiar el nivel de desenfoque */
    z-index: -1;
  }
  img {
    border-radius: 20px;
    width: 100%;
    z-index: 1;
    border: 3px solid #4b4b4b;
  }
  .info-event-short {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .info-event {
    width: 100%;
    display: flex;
    justify-content: start;
    align-items: center;
    flex-direction: column;
    gap: 20px;
  }
  .components {
    width: 85%;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .seccion-no-evento {
    color: whitesmoke;
  }

  .border-info{
    border: 3px solid #4b4b4b;
    padding: 20px;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0);
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  @media screen and (max-width: 600px) {
    .info-event-container {
    width: 100%;
  }
    img {
      width: 100%;
    }
    span {
      width: 100%;
    }
    .img-event {
      margin-top: 40px;
      width: 100%;
    }
    .contenedor {
      width: 100% !important;
      margin-top: 50px !important;
      flex-direction: column !important;
      align-items: center;
    }
    .components {
      width: 100%;
      margin-top: 20px;
    }
  }

  @media screen and (max-width: 700px) {
    .contenedor {
      width: 90% !important;
    }
  }

  .contenedor {
    width: 60%;
    margin: 0 auto;
    display: flex;
    flex-direction: row-reverse;
    margin-top: 120px;
  }
</style>

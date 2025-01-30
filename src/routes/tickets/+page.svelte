<script>
  import Title from "../components/Title.svelte";
  import Date from "../components/Date.svelte";
  import Location from "../components/Location.svelte";
  import AboutEvent from "../components/AboutEvent.svelte";
  import Tickets from "../components/Tickets.svelte";
  import supabase from "../../lib/supabase";
  import { onMount, tick } from "svelte";

  let mEvento = {};
  let fases = [];
  let productosStripe = [];
  let urlImagenPortada;

  onMount(async () => {
    //Obtener evento activo
    let { data: evento, error } = await supabase
      .from("mEvento")
      .select("*")
      .eq("activo", 1);
    if (evento) {
      mEvento = evento[0];
    }

    if (error) {
      console.log("Error al traer el evento activo");
    } else {
      //Obtener las faces o tickets del evento selecionado
      let { data: cFases, errorF } = await supabase
        .from("cFaseEvento")
        .select("*")
        .eq("idEvento", mEvento.idevento);

      if (cFases.length > 0) {
        fases = cFases;
        // Llama a la función para obtener los productos
        productosStripe = await getProducts();
        //enlazar identificador de precio con fase (Despues hay que hacerlo directamente al crear la fase en supabase y el producto en stripe)
        for(const producto of productosStripe){
          for(const fase of fases){
            if(producto.name == fase.nombreFace){
              fase.idPrecioStripe = producto.default_price;
            }
          }
        }

      } else if (errorF) {
        console.log("Error al traer las fases");
      }
      //Traer portada del evento
      const { data } = supabase.storage
        .from("imageEventos")
        .getPublicUrl(mEvento.pathImage);

      urlImagenPortada = data.publicUrl;
    }

    await tick();
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
</script>

<svelte:head>
  <title>Tickets</title>
  <meta name="description" content="About this app" />
</svelte:head>

{#if urlImagenPortada}
  <div class="img-event">
    <span>
      <img src={urlImagenPortada} alt="portada" />
    </span>
  </div>
{/if}

<section class="info-event-short">
  <Title
    titulo={mEvento.nombreEvento}
    fecha="Domingo, 18 de agosto "
    descripcion="Descripcion Corta"
  />
</section>

<section class="info-event">
  <div class="components">
    <Date fecha="Dom, 18 Ago 2024 14:00 - 23:00 " />
    <Location
      nombreLugar={mEvento.venue}
      direccion={mEvento.direccion}
      linkMaps="https://maps.app.goo.gl/n1mhoLPbnv4xCium6"
    />
    <AboutEvent descripcion={mEvento.descripcion} />
    {#if fases.length > 0}
      <Tickets ticketDataEve={fases} />
    {/if}
  </div>
</section>

<style>
  .img-event {
    padding: 20px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  span {
    width: 85%;
  }
  img {
    border-radius: 40px;
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
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
</style>

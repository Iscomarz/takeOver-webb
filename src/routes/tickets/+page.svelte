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
      } else if (errorF) {
        console.log("Error al traer las fases");
      }

      console.log('Ruta de imagen:', mEvento.pathImage);
      //Traer portada del evento
      let { data: image , error: errorIamge } = await supabase.storage
      .from('imageEventos')
      .createSignedUrl(mEvento.pathImage, 60 * 60);

      if(errorIamge){
        console.log('Error al traer imagen',errorIamge);
      }else{
        console.log('llamada correcta al storage');
        mEvento.pathImage = image.signedUrl;
      }
    }

    await tick();
  });

  export const ssr = false;
</script>

<svelte:head>
  <title>Tickets</title>
  <meta name="description" content="About this app" />
</svelte:head>

<div class="img-event">
  <span>
    <img src={mEvento.pathImage} alt="portada"/>
  </span>
</div>

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
    <AboutEvent
      descripcion={mEvento.descripcion}
    />
    <Tickets />
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

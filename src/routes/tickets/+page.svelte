<script>
  import Title from "../components/Title.svelte";
  import Date from "../components/Date.svelte";
  import Location from "../components/Location.svelte";
  import AboutEvent from "../components/AboutEvent.svelte";
  import Counter from "../components/Counter.svelte";
  import Tickets from "../components/Tickets.svelte";
  import Ticket from "../components/Ticket.svelte";
</script>

<svelte:head>
  <title>Crew</title>
  <meta name="description" content="About this app" />
</svelte:head>

<div class="img-event">
  <span>
    <img src="src/lib/images/covers/portada-prueba.jpg" alt="" srcset="" />
  </span>
</div>

<section class="info-event-short">
  <Title
    titulo="SHOWCASE TAKE OVER"
    fecha="Domingo, 18 de agosto "
    descripcion="Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
  Curabitur sagittis sapien eget neque tristique, nec vestibulum ante."
  />
</section>

<section class="info-event">
  <div class="components">
	<Date fecha="Dom, 18 Ago 2024 14:00 - 23:00 " />
  <Location
    nombreLugar="Bar El Azteca"
    direccion="Calle Ignacio Ramirez s/n Centro"
    linkMaps="https://maps.app.goo.gl/n1mhoLPbnv4xCium6"
  />
  <AboutEvent
    descripcion="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sagittis sapien eget neque tristique, nec vestibulum ante.

Line UP
anoche
locura dj
chata dj"
  />
  <Tickets/>
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
  .components{
	width: 85%;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 30px;
  }
</style>

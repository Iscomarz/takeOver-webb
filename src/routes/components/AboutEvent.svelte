<script>
  export let descripcion = "Descripcion detallada del evento";
</script>

<div>
  <h3>About this event</h3>
  <p>{descripcion}</p>
</div>

<style>
  h3 {
    font-family: "JockeyOne";
    color: whitesmoke;
  }
  p {
    font-family: "JostRegular";
    color: whitesmoke;
    font-size: clamp(.8em, 3vw, 1em);
  }
</style>

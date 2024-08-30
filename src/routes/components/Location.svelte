<script>
  export let nombreLugar = "Nombre del Lugar";
  export let direccion = "Direccion del lugar";
  export let linkMaps = "link";
</script>

<div>
    <h3>Location</h3>
  <h4>{nombreLugar}</h4>
  <p><a target="_blank" href={linkMaps}>{direccion}</a></p>
</div>

<style>
  h3 {
    font-family: "JockeyOne";
    color: whitesmoke;
  }
  h4{
    font-weight: bold;
    font-family: "JostRegular";
    color: whitesmoke;
  }
  p {
    font-family: "JostRegular";
    color: whitesmoke;
  }
</style>

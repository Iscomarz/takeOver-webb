<script>
  export let nombreLugar = "Nombre del Lugar";
  export let direccion = "Direccion del lugar";
  export let linkMaps = "link";
</script>

<div>
  <div style="display: flex; align-items: center;gap: 10px;">
    <i style="color: aliceblue;" class="ph ph-map-pin-line"></i>
    <h3>Location</h3>
  </div>
  
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
  p a{
    font-family: "JostRegular";
    color: whitesmoke;
    font-size: clamp(.8em, 3vw, 1em);
    color: var(--color-theme-1);
  }
</style>

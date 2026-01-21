<script>
  export let nombreLugar = "Nombre del Lugar";
  export let direccion = "Direccion del lugar";
  export let linkMaps = "link";
</script>

<div class="location-container">
  <div class="flex items-center gap-3 group/item hover:text-white transition-colors duration-300">
    <div class="p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 group-hover/item:bg-white/10 transition-all duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
    <div>
      <h3>Location</h3>
      <h4>{nombreLugar}</h4>
      <p><a target="_blank" href={linkMaps}>{direccion}</a></p>
    </div>
  </div>
</div>

<style>
  .location-container {
    margin: 8px 0;
  }
  h3 {
    font-family: "JockeyOne";
    color: white;
    font-size: 1.1rem;
    margin: 0 0 4px 0;
  }
  h4{
    font-weight: bold;
    font-family: "JostRegular";
    color: white;
    margin: 4px 0;
    font-size: 1rem;
  }
  p {
    margin: 0;
  }
  p a{
    font-family: "JostRegular";
    color: rgb(209, 213, 219);
    font-size: clamp(.8em, 3vw, 0.95em);
    text-decoration: none;
    transition: color 0.3s ease;
  }
  p a:hover {
    color: white;
  }
</style>

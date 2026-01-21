<script>
  export let descripcion = "Descripcion detallada del evento";
</script>

<div class="about-container">
  <div class="flex items-center gap-3 mb-3">
    <div class="p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    </div>
    <h3>About this event</h3>
  </div>
  <p>{descripcion}</p>
</div>

<style>
  .about-container {
    margin: 8px 0;
  }
  .mb-3 {
    margin-bottom: 8px;
  }
  h3 {
    font-family: "JockeyOne";
    color: white;
    font-size: 1.1rem;
    margin: 0;
  }
  p {
    font-family: "JostRegular";
    color: rgb(209, 213, 219);
    font-size: clamp(.8em, 3vw, 1em);
    white-space: pre-wrap;
    line-height: 1.6;
    margin: 0;
  }
</style>

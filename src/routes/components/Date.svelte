<script>
  export let fecha = "ddd, dd de mmm aaaa hh:mm - hh:mm";
</script>

<div class="date-container">
  <div class="flex items-center gap-3 group/item hover:text-white transition-colors duration-300">
    <div class="p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 group-hover/item:bg-white/10 transition-all duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    </div>
    <div>
      <h3>Date & Time</h3>
      <p>{fecha}</p>
    </div>
  </div>
</div>

<style>
    .date-container {
        margin: 8px 0;
    }
    h3{
        font-family: "JockeyOne";
        color: white;
        font-size: 1.1rem;
        margin: 0 0 4px 0;
    }
    p{
        font-family: "JostRegular";
        color: rgb(209, 213, 219);
        font-size: clamp(.8em, 3vw, 1em);
        margin: 0;
    }
</style>

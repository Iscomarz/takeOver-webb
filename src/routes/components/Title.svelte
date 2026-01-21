<script>
  export let titulo = "Nombre del evento";
  export let fecha = "Dia del evento";
  export let descripcion = "Breve descripcion";

</script>

<div class="info-content">
  <div>
    <h2>{titulo}</h2>
    <div class="fecha-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="calendar-icon">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <h4>{fecha.toLowerCase()}</h4>
    </div>
  </div>
</div>

<style>
  .info-content {
    width: 85%;
    color: whitesmoke;
    gap: 12px;
    display: flex;
    flex-direction: column;
  }
  h2 {
    font-family: "JockeyOne";
    font-size: clamp(1.8em, 5vw, 2.8em);
    padding: 0px;
    margin: 0 0 12px 0;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .fecha-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: fit-content;
  }
  
  .calendar-icon {
    color: rgb(156, 163, 175);
  }
  
  h4 {
    font-family: "JostRegular";
    font-size: clamp(0.8em, 3vw, 0.95em);
    margin: 0;
    color: rgb(209, 213, 219);
  }

  @media screen and (max-width: 600px) {
    .info-content {
      width: 100%;
    }
  }
</style>

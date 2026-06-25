<script>
  import { onMount } from "svelte";
  import ButtonStyle from "./buttonStyle.svelte";
  import { formatDiaYHora, formatDate } from '$lib/utils/formatFechas.js';

  export let pathImage;
  export let titulo;
  export let fecha;
  export let lugar;
  export let idEvento;

  let fechaFormateada = "";
  let diaYHora = "";

  onMount(() => {
    fechaFormateada = formatDate(fecha);
    diaYHora = formatDiaYHora(fecha);
  });
</script>

<div class="evento-list-card">
  <div class="image-container">
    <a href={`/eventos/${idEvento}`}>
      <img class="image-list" src={pathImage} alt={titulo} />
    </a>
  </div>
  
  <div class="info-container">
    <div class="details-left">
      <h3>{titulo}</h3>
      <div class="meta-row">
        <span class="fecha-txt">{fechaFormateada}</span>
        <span class="separator">•</span>
        <span class="hora-txt">{diaYHora}</span>
      </div>
      <div class="lugar-row">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="#56FDB8"
          viewBox="0 0 256 256"
        >
          <path
            d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"
          />
        </svg>
        <span class="lugar-txt">{lugar}</span>
      </div>
    </div>
    
    <div class="action-right">
      <div class="button-wrapper">
        <ButtonStyle texto="VER MÁS" href={`eventos/${idEvento}`} />
      </div>
    </div>
  </div>
</div>

<style>
  .evento-list-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px 20px;
    width: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .evento-list-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .image-container {
    flex-shrink: 0;
    width: 160px;
    height: 100px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .image-list {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .evento-list-card:hover .image-list {
    transform: scale(1.05);
  }

  .info-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 1.5rem;
  }

  .details-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: white;
    font-family: "JostRegular", sans-serif;
  }

  h3 {
    font-size: 1.25rem;
    font-family: "JostRegular", sans-serif;
    font-weight: 600;
    margin: 0;
    letter-spacing: 0.5px;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .fecha-txt {
    color: #FFA46B;
  }

  .separator {
    color: rgba(255, 255, 255, 0.3);
  }

  .hora-txt {
    color: rgb(208, 208, 208);
  }

  .lugar-row {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgb(208, 208, 208);
    font-size: 0.9rem;
  }

  .action-right {
    flex-shrink: 0;
  }

  .button-wrapper {
    transform: scale(0.8);
    transform-origin: right center;
  }

  /* Responsive styles */
  @media screen and (max-width: 768px) {
    .evento-list-card {
      padding: 12px;
      gap: 1rem;
    }
    
    .image-container {
      width: 120px;
      height: 90px;
    }

    h3 {
      font-size: 1.1rem;
    }

    .meta-row {
      font-size: 0.85rem;
    }

    .lugar-row {
      font-size: 0.85rem;
    }

    .button-wrapper {
      transform: scale(0.75);
    }
  }

  @media screen and (max-width: 600px) {
    .evento-list-card {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 12px;
    }

    .image-container {
      width: 100%;
      height: 180px;
    }

    .info-container {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .action-right {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .button-wrapper {
      transform: scale(0.9);
      transform-origin: center;
      width: 100%;
      text-align: center;
    }
  }
</style>

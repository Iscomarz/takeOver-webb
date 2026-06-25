<script>
  import ButtonStyle from "./buttonStyle.svelte";
  import { formatDiaYHora, formatDate } from '$lib/utils/formatFechas.js';

  export let pathImage;
  export let titulo;
  export let fecha;
  export let lugar;
  export let idEvento;

  $: fechaFormateada = formatDate(fecha);
  $: diaYHora = formatDiaYHora(fecha);
</script>

<div class="evento-card">
  <div>
    <a href={`/eventos/${idEvento}`}>
      <img class="image-eve" src={pathImage} alt="" />
    </a>
  </div>
  <div class="evento-info">
    <h3>{titulo}</h3>
    <div>
      <p style="color: #FFA46B;">{fechaFormateada}</p>
      <p style="color: rgb(208, 208, 208);">{diaYHora}</p>
      <div class="evento-lugar">
        <div style="display: flex; align-items: center; gap: 5px;">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="#56FDB8"
            viewBox="0 0 256 256"
            ><path
              d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"
            ></path></svg
          >
          <p>{lugar}</p>
        </div>
        <div style="display: flex; justify-content: center; width: 100%;">
          <div class="button-wrapper">
            <ButtonStyle texto="VER MÁS" href={`eventos/${idEvento}`} />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .evento-card {
    padding: 8px;
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease;
  }

  .evento-card:hover {
    transform: translateY(-5px);
  }

  .evento-info {
    background-color: #000000;
    box-shadow: 0 3px 4px 0 rgba(0, 0, 0, 0.28);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: white;
    font-family: "JostRegular";
  }

  .evento-lugar {
    display: flex;
    gap: 6px;
    color: rgb(208, 208, 208);
    flex-direction: column;
    font-size: 0.9rem;
  }

  .button-wrapper {
    transform: scale(0.75);
  }

  h3 {
    font-size: 1rem;
    margin: 0 0 4px 0;
  }

  .evento-info p {
    margin: 4px 0;
    font-size: 0.85rem;
  }

  .image-eve {
    width: 100%;
    height: 280px;
    object-fit: cover;
    box-shadow: 0 3px 4px 0 rgba(0, 0, 0, 0.28);
  }

  @media screen and (max-width: 1200px) {
    .image-eve {
      height: 300px;
    }
  }

  @media screen and (max-width: 900px) {
    .image-eve {
      height: 280px;
    }
    
    h3 {
      font-size: 1.1rem;
    }
  }

  @media screen and (max-width: 600px) {
    .evento-card {
      padding: 10px;
    }
    
    .image-eve {
      height: 300px;
    }
    
    h3 {
      font-size: 1.2rem;
    }
    
    .evento-info {
      padding: 10px;
    }
  }
</style>

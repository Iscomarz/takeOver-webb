<script>
  import { onMount } from "svelte";

  export let pathImage;
  export let titulo;
  export let fecha;
  export let lugar;
  export let idEvento

  let fechaFormateada;
  let diaYHora;

  onMount(() => {
    fechaFormateada = formatDate(fecha);
    diaYHora = formatDiaYHora(fecha);
  });

  function formatDate(dateString) {
    console.log(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", options);
  }

  function formatDiaYHora(dateString) {
    const diaYHora = new Date(dateString).toLocaleString("es-ES", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      hour12: true,
    });
    return diaYHora.replace(",", " / ").toUpperCase();
  }
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
    </div>
  </div>
</div>

<style>
  .evento-card {
    padding: 10px 10px 10px 10px;
    width: 330px;
  }
  .evento-info {
    background-color: #494b52;
    box-shadow: 0 3px 4px 0 rgba(0, 0, 0, 0.28);
    padding: 10px;
    height: calc(100% - 290px);
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    color: white;
  }
  .evento-lugar {
    display: flex;
    align-items: center;
    gap: 5px;
    color: rgb(208, 208, 208);
  }
  h3 {
    font-size: 1.1rem;
  }
</style>

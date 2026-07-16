<script>
  import TeaserState from "../components/TeaserState.svelte";

  export let data;
  $: ({ teaserConfig = null } = data);
</script>

<svelte:head>
  <title>Próximamente - Take Over</title>
  <meta name="description" content="Registrate para recibir información del próximo evento de Take Over" />
</svelte:head>

<div class="teaser-page-container">
  <TeaserState config={teaserConfig} />
</div>

<style>
  .teaser-page-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 200px); /* Adjust to take up full height minus header/footer */
    width: 100%;
    margin-top: 80px; /* Offset for floating header */
    padding: 2rem 0;
    box-sizing: border-box;
  }
</style>

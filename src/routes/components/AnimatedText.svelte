<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

let texts = ["Dance Music","Explore Flavors", "Feel the Beat"];
let visibleTime = 3500; // milisegundos

  let currentIndex = 0;
  let currentText = texts[0];
  let visible = true;

  onMount(() => {
    const interval = setInterval(() => {
      visible = false;

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % texts.length;
        currentText = texts[currentIndex];
        visible = true;
      }, 600); // tiempo del fade-out antes de cambiar el texto
    }, visibleTime);

    return () => clearInterval(interval);
  });
</script>

<div class="mobile-text-animation">
  {#if visible}
    <span transition:fade>{ currentText }</span>
  {/if}
</div>

<style>
  .mobile-text-animation {
    display: none;
  }

  @media screen and (max-width: 600px) {
    .mobile-text-animation {
      display: block;
      position: absolute;
      right: 18px;
      top: 50%;
      transform: translateY(-50%);
      color: white;
      font-size: 1.3rem;
      font-family: 'Barett', sans-serif;
    }
  }
</style>

<script>
  export let texto = "Button";
  export let href = "#";
</script>

<button>
  <a href="/{href}">{texto}</a>
</button>

<style>
  button {
    position: relative;
    overflow: hidden;
    color: black;
    width: 40%;
    text-align: center;
    background-color: var(--color-theme-1);
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    font-weight: 700;
  }

  button::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 15px; /* Grosor de la franja */
    height: 100%;
    background-color: white;
  }
</style>

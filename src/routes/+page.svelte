<script>
  import Counter from "./Counter.svelte";
  import welcome from "$lib/images/takeover-logo.png";
  import welcome_fallback from "$lib/images/svelte-welcome.png";
</script>

<svelte:head>
  <title>HOME</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>
<div class="centro">
  <div>
    <section id="welcome">
      <h3>WELCOME TO</h3>
      <h1>TAKE OVER</h1>
    </section>

    <section id="navMenu">
      <ul>
        <li><a href="">TICKETS</a></li>
        <li><a href="">ABOUT TAKE OVER</a></li>
        <li><a href="">CREW</a></li>
        <li><a href="">CONTACT</a></li>
      </ul>
    </section>
  </div>
</div>

<style>

  .centro {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  h1 {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
    font-family: "Blacklisted" !important;
    font-size: 128px;
    color: whitesmoke;
  }

  h3 {
    font-family: "JockeyOne" !important;
    color: whitesmoke;
  }

  ul {
    display: flex;
    padding-top: 20px;
    gap: 80px;
  }

  ul li a {
    color: whitesmoke;
  }

  @font-face {
    font-family: Blacklisted;
    src: url(../lib/fonts/Blacklisted.ttf) format("truetype");
  }
  @font-face {
    font-family: JockeyOne;
    src: url(../lib/fonts/jockey-one.regular.ttf) format("truetype");
  }
  @font-face {
    font-family: JostRegular;
    src: url(../lib/fonts/static/Jost-Regular.ttf) format("truetype");
  }
</style>

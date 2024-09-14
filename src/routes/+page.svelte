<script>
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
      <div class="wel-container">
        <h3 class="welcome">WELCOME  </h3><h3>  TO</h3>
      </div>
      <h1>TAKE OVER</h1>
    </section>

    <section id="navMenu">
      <ul>
        <li><a class="link" href="/tickets">TICKETS</a></li>
        <li><a class="link" href="about">ABOUT TAKE OVER</a></li>
        <li><a class="link" href="crew">CREW</a></li>
        <li><a class="link" href="contact">CONTACT</a></li>
      </ul>
    </section>
  </div>
</div>

<style>

  .wel-container{
    display: flex;
    gap: 2px;
  }
  .welcome{
    color: var(--color-theme-1);
  }
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

  .link {
    color: whitesmoke;
	font-family: "JostRegular";
  }
</style>

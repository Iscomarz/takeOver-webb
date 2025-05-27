<script>
  import insta from "$lib/images/instagram-logo.svg";
</script>

<svelte:head>
  <title>Take Over HOME</title>
  <meta name="description" content="Take Over Show Official Website" />
</svelte:head>

<div class="centro">
  <div>
    <section id="welcome">
      <div class="wel-container">
        <h3 class="welcome">WELCOME</h3>
        <h3>TO</h3>
      </div>
      <h1>TAKE OVER</h1>
    </section>

    <section id="navMenu">
      <ul>
        <li><a class="link" href="/eventos">EVENTS</a></li>
        <li><a class="link" href="about">ABOUT TAKE OVER</a></li>
        <!-- <li><a class="link" href="crew">CREW</a></li>
        <li><a class="link" href="merch">MERCH</a></li> -->
        <li><a class="link" href="contact">CONTACT</a></li>
      </ul>
    </section>
  </div>
</div>

<section class="redes">
  <a
    href="https://www.instagram.com/_takeeover?igshid=yjlo5sgvbxsh9"
    target="_blank"
  >
    <img src={insta} alt="Instagram" />
  </a>
</section>

<style>
  .wel-container {
    display: flex;
    gap: 2px;
  }
  .welcome {
    color: var(--color-theme-1);
  }
  .centro {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60vh;
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
    font-size: clamp(3em, 15vw, 9em);
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

  .redes {
    display: none;
  }

  @media screen and (max-width: 600px) {
    ul {
      display: flex;
      flex-direction: column;
      text-align: center;
      gap: 20px;
    }
    .redes {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding-top: 100px;
    }
  }
</style>

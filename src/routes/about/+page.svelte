<script>
  import coverAbout from "$lib/images/covers/cover-about.jpg";
  import takeoverfoto from "$lib/images/takeover/takeover.jpg";
</script>
<svelte:head>
  <title>About</title>
  <meta name="description" content="About this app" />
</svelte:head>

<div class="general">
  <h1>About Take Over</h1>

  <div class="about-content">
    <span class="img-con">
      <img src="{takeoverfoto}" alt="" />
    </span>
    <div class="text-con">
      <h2>
        ¿Qué es Take Over?
      </h2>
      <p>
        Take Over es más que una fiesta, es una experiencia. Organizamos eventos en Chihuahua, llevando el mejor house, techno, indie dance y melodic house a lugares donde normalmente no se escucha este sonido. Como su nombre lo dice, tomamos el control por un día para transformar el espacio con música, energía y buena vibra.
      </p>
      <br />
      <p>
        Cada evento es una fusión de coctelería, talento emergente y sets de DJs que harán vibrar el lugar. Creemos en impulsar la escena local y conectar a las personas a través de la música.
      </p>
      <br />
      <p>
        Take Over no es solo un evento, es un movimiento. ¿Estás listo para ser parte?
      </p>
      <br />
      <button style="width: 100%; text-align: center;">
        <a href="/contact">CONTACT</a>
      </button>
    </div>
  </div>
</div>

<style>
  .general {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-top: 20px;
  }
  h1 {
    font-family: "JockeyOne";
    color: whitesmoke;
    font-size: 1.8em;
  }
  h2 {
    font-family: "JockeyOne";
    color: whitesmoke;
    font-size: 1.5em;
  }
  p {
    font-family: "JostRegular";
    color: whitesmoke;
  }
  .about-content {
    width: 85%;
    display: flex;
    gap: 20px;
  }
  .img-con {
    width: 50%;
  }
  .text-con {
    width: 50%;
  }
  button {
    color: var(--color-theme-1);
  }

  @media screen and (max-width: 600px) {
    .about-content {
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .img-con {
      width: 80%;
    }
    .text-con {
      width: 90%;
    }
  }
</style>

<script>
  import coverAbout from "$lib/images/covers/cover-about.jpg";
  import takeoverfoto from "$lib/images/takeover/takeover.jpg";
  import about2 from "$lib/images/takeover/about_2.webp";
  import insta from "$lib/images/instagram-logo.svg";
  import ButtonStyle from "../components/buttonStyle.svelte";
</script>

<svelte:head>
  <title>About</title>
  <meta name="description" content="About this app" />
</svelte:head>

<div class="general">

  <div class="about-content">
    <span class="img-con">
      <div class="overlay-title">_about</div>
      <img src={takeoverfoto} alt="" />
    </span>
    <div class="text-con">
      <h2>¿Qué es Take Over?</h2>
      <p style="padding: 10px;">
        Take Over es más que una fiesta, es una experiencia. Organizamos eventos
        en Chihuahua, llevando el mejor house, techno, indie dance y melodic
        house a lugares donde normalmente no se escucha este sonido. Como su
        nombre lo dice, tomamos el control por un día para transformar el
        espacio con música, energía y buena vibra.
      </p>

      <div class="about-2">
        <span>
          <img src={about2} alt="" />
        </span>
        <div class="text-con2">
          <h3>¿Por qué Take Over?</h3>
          <p>
            Cada evento es una fusión de coctelería, talento emergente y sets de
            DJs que harán vibrar el lugar. Creemos en impulsar la escena local y
            conectar a las personas a través de la música.
          </p>
          <br />
          <p>
            Take Over no es solo un evento, es un movimiento. ¿Estás listo para
            ser parte?
          </p>
          <br />
          <ButtonStyle texto="CONTACT" href="contact"/>
        </div>
      </div>

      <!-- <div class="redes">
        <p>FOLLOW US:</p>
        <a
          href="https://www.instagram.com/_takeeover?igshid=yjlo5sgvbxsh9"
          target="_blank"
        >
          <img src={insta} alt="Instagram" />
        </a>
      </div> -->
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
    margin-top: -5px;
  }
  h1 {
    font-family: "JockeyOne";
    color: whitesmoke;
    font-size: 1.8em;
  }
  h2 {
    font-family: "JockeyOne";
    color: rgb(0, 0, 0);
    font-size: 1.5em;
    background-color: white;
    padding: 5px 10px;
  }
  p {
    font-family: "JostRegular";
    color: whitesmoke;
  }
  .about-content {
    width: 85%;
    display: flex;
    gap: 20px;
    margin-top: 70px;
  }
  .img-con {
    width: 50%;
    position: relative;
  }
  .text-con {
    width: 50%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
    align-items: start;
  }

  .overlay-title {
    display: none; /* Oculto por defecto */
    position: absolute;
    top: 70px;
    left: 70px;
    font-family: "JockeyOne";
    font-size: 2.5em;
    color: white;
    text-transform: uppercase;
    z-index: 2;
  }

  h3 {
    font-family: "JockeyOne";
    color: rgb(255, 255, 255);
    font-size: 1.5em;
    padding: 5px 0px;
  }

  .text-con2 {
    background-color: black;
    padding: 20px;
  }

  .about-2 img {
    width: 100%;
    height: 180px; /* ajusta según cuánto quieras mostrar */
    object-fit: cover;
    object-position: center 60%; /* 20% recorta un poco de arriba. Baja este valor para mostrar más de arriba */
    display: block;
  }

  .redes {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    font-family: "JostRegular";
    padding: 5px 10px;
    width: 100%;
  }

  @media screen and (max-width: 600px) {
    .about-content {
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100% !important;
    }
    .img-con {
      width: 100%;
    }
    .overlay-title {
      display: block;
    }
    .text-con {
      width: 90%;
    }

    h2 {
      margin-left: -20px; /* Pegado al borde izquierdo */
      width: calc(100vw - 150px); /* Deja 20px de espacio al lado derecho */
      padding: 5px 15px;
      box-sizing: border-box;
    }
  }
</style>

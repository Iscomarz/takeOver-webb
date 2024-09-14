<svelte:head>
  <title>About</title>
  <meta name="description" content="About this app" />
</svelte:head>

<div class="general">
  <h1>About Take Over</h1>

  <div class="about-content">
    <span class="img-con">
      <img src="src/lib/images/covers/cover-about.jpg" alt="" />
    </span>
    <div class="text-con">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
        sagittis sapien eget neque tristique, nec vestibulum ante.
      </p>
      <br />
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
        sagittis sapien eget neque tristique, nec vestibulum ante.
      </p>
      <br />
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
        sagittis sapien eget neque tristique, nec vestibulum ante.
      </p>
      <br />
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
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
  }
  h1 {
    font-family: "JockeyOne";
    color: whitesmoke;
    font-size: 1.8em;
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

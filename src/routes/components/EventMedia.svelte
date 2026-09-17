<script>
  export let media = [];

  // Track active playing items for facade
  let playingMap = {};

  function extractYoutubeId(url) {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : null;
  }

  function getSpotifyEmbedUrl(url) {
    if (!url) return null;
    try {
      return url.replace('open.spotify.com/', 'open.spotify.com/embed/') + '?utm_source=generator&theme=0';
    } catch {
      return url;
    }
  }

  function getSoundCloudEmbedUrl(url) {
    if (!url) return null;
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2310b981&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
  }

  function playYoutube(id) {
    playingMap[id] = true;
  }
</script>

{#if media && media.length > 0}
  <div class="event-media-container">
    <!-- Header simple sin cajas anidadas -->
    <div class="flex items-center gap-3 mb-5">
      <div class="p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="text-emerald-400"
        >
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      </div>
      <div>
        <h3 class="section-title">SOUNDS & SETS</h3>
        <p class="section-subtitle">Conoce el sonido del artista</p>
      </div>
    </div>

    <!-- Lista de medios en tamaño grande, sin bordes sobre bordes -->
    <div class="media-list">
      {#each media as item (item.id)}
        <div class="media-item">
          {#if item.tipo === 'youtube'}
            {@const ytId = extractYoutubeId(item.url)}
            {#if ytId}
              <div class="player-wrapper">
                {#if playingMap[item.id]}
                  <div class="video-container">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                      title={item.titulo || 'DJ Set YouTube'}
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                      class="w-full h-full rounded-xl"
                    ></iframe>
                  </div>
                {:else}
                  <!-- Facade grande de 16:9 con thumbnail de alta resolución -->
                  <button
                    type="button"
                    on:click={() => playYoutube(item.id)}
                    class="facade-button"
                    aria-label={`Reproducir ${item.titulo || 'video de YouTube'}`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                      onerror={(e) => {
                        e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                      }}
                      alt={item.titulo || 'Thumbnail del set'}
                      loading="lazy"
                      class="facade-image"
                    />
                    <div class="facade-overlay"></div>
                    <div class="play-btn-wrapper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        class="text-white translate-x-0.5"
                      >
                        <path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"></path>
                      </svg>
                    </div>
                  </button>
                {/if}
              </div>
            {/if}
          {:else if item.tipo === 'soundcloud'}
            <div class="player-wrapper">
              <iframe
                title={item.titulo || 'SoundCloud Player'}
                width="100%"
                height="166"
                scrolling="no"
                frameborder="no"
                allow="autoplay"
                src={getSoundCloudEmbedUrl(item.url)}
                class="rounded-xl"
              ></iframe>
            </div>
          {:else if item.tipo === 'spotify'}
            <div class="player-wrapper">
              <iframe
                title={item.titulo || 'Spotify Player'}
                src={getSpotifyEmbedUrl(item.url)}
                width="100%"
                height="152"
                frameborder="0"
                allowfullscreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                class="rounded-xl"
              ></iframe>
            </div>
          {/if}

          <!-- Info abajo del reproductor -->
          {#if item.artista || item.titulo}
            <div class="media-info">
              {#if item.artista}
                <span class="info-artist">{item.artista}</span>
              {/if}
              {#if item.titulo}
                <span class="info-title">{item.titulo}</span>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .event-media-container {
    margin: 24px 0 12px 0;
    width: 100%;
  }

  .section-title {
    font-family: "JockeyOne", sans-serif;
    color: white;
    font-size: 1.15rem;
    margin: 0;
    letter-spacing: 0.05em;
  }

  .section-subtitle {
    font-family: "JostRegular", sans-serif;
    color: rgba(156, 163, 175, 0.85);
    font-size: 0.8rem;
    margin: 0;
  }

  .media-list {
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: 100%;
  }

  .media-item {
    width: 100%;
    /* Sin bordes, sin fondos anidados */
    background: transparent;
    border: none;
    padding: 0;
  }

  .player-wrapper {
    width: 100%;
    position: relative;
    border-radius: 14px;
    overflow: hidden;
  }

  .video-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
  }

  .facade-button {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    cursor: pointer;
    border: none;
    padding: 0;
    background: #000;
    display: block;
    overflow: hidden;
    border-radius: 14px;
  }

  .facade-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .facade-button:hover .facade-image {
    transform: scale(1.03);
  }

  .facade-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 60%);
    transition: opacity 0.3s ease;
  }

  .facade-button:hover .facade-overlay {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.2) 60%);
  }

  .play-btn-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.45);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .facade-button:hover .play-btn-wrapper {
    transform: translate(-50%, -50%) scale(1.12);
    background: rgb(16, 185, 129);
    box-shadow: 0 10px 40px rgba(16, 185, 129, 0.6);
  }

  .media-info {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding-left: 2px;
  }

  .info-artist {
    font-family: "JockeyOne", sans-serif;
    color: rgb(16, 185, 129);
    font-size: 1.05rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .info-title {
    font-family: "JostRegular", sans-serif;
    color: rgba(229, 231, 235, 0.9);
    font-size: 0.9rem;
    line-height: 1.35;
  }
</style>

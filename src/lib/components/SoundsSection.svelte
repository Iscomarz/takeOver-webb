<script>
	import { audioStore } from '$lib/stores/audioStore.js';

	export let sounds = [];
	export let title = 'THE SOUNDS OF TAKE OVER';
	export let eyebrow = 'SETS & SESSIONS';
	export let limit = null;

	$: visibleSounds = limit ? sounds.slice(0, limit) : sounds;

	function playSound(index) {
		const sound = visibleSounds[index];
		const globalIndex = sounds.findIndex((item) => item.id === sound.id);
		audioStore.update((state) => ({
			...state,
			currentIndex: globalIndex,
			isExpanded: true,
			positionMs: 0,
			playRequest: state.playRequest + 1
		}));
	}
</script>

{#if visibleSounds.length}
	<section class="sounds-section" aria-labelledby="sounds-heading">
		<header>
			<div>
				<span>{eyebrow}</span>
				<h2 id="sounds-heading">{title}</h2>
			</div>
			<p>Selecciones, sesiones y sets compartidos por Take Over.</p>
		</header>

		<div class="sound-list">
			{#each visibleSounds as sound, index}
				<article class="sound-row">
					<div class="info">
						<strong>{sound.titulo}</strong>
						<div class="meta">
							<span>{sound.artista || 'Take Over'}</span>
							<a href={sound.soundcloud_url} target="_blank" rel="noreferrer">SoundCloud ↗</a>
						</div>
					</div>
					<button class="play-button" on:click={() => playSound(index)} aria-label={`Reproducir ${sound.titulo}`}>
						<span aria-hidden="true">▶</span>
						<span>PLAY</span>
					</button>
				</article>
			{/each}
		</div>
	</section>
{/if}

<style>
	.sounds-section { width: min(1120px, calc(100% - 2rem)); margin: 3rem auto; padding: 3rem 0; color: #fff; }
	header { display: flex; justify-content: space-between; align-items: end; gap: 2rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,.09); padding-bottom: 1.25rem; }
	header span { color: #56fdb8; font-size: .68rem; letter-spacing: .22em; }
	h2 { margin: .35rem 0 0; font: 400 clamp(1.8rem,4vw,3rem)/1 "JockeyOne", sans-serif; letter-spacing: .04em; }
	header p { max-width: 390px; margin: 0; color: rgba(255,255,255,.48); font-size: .88rem; }
	.sound-list { border-top: 1px solid rgba(255,255,255,.09); }
	.sound-row { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1rem .25rem; border-bottom: 1px solid rgba(255,255,255,.09); transition: background-color .2s ease; }
	.sound-row:hover { background: rgba(255,255,255,.018); }
	.info { min-width: 0; display: flex; flex-direction: column; gap: .35rem; }
	.info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.meta { display: flex; align-items: center; gap: .75rem; color: rgba(255,255,255,.42); font-size: .78rem; }
	.meta a { color: rgba(255,255,255,.52); text-decoration: none; }
	.meta a:hover { color: #56fdb8; }
	.play-button { flex-shrink: 0; display: inline-flex; align-items: center; gap: .55rem; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; padding: .55rem .85rem; color: rgba(255,255,255,.78); background: transparent; font: inherit; font-size: .68rem; letter-spacing: .12em; cursor: pointer; transition: color .2s ease, border-color .2s ease; }
	.play-button:hover { color: #56fdb8; border-color: rgba(86,253,184,.45); }
	.play-button:focus-visible, a:focus-visible { outline: 2px solid #56fdb8; outline-offset: 3px; }
	@media (max-width: 650px) { .sounds-section { margin: 1rem auto; padding: 2rem 0 7rem; } header { align-items: start; flex-direction: column; gap: .7rem; } .sound-row { gap: .75rem; } .meta { align-items: flex-start; flex-direction: column; gap: .2rem; } .play-button span:last-child { display: none; } }
	@media (prefers-reduced-motion: reduce) { .sound-row, .play-button { transition: none; } }
</style>

<script>
	import { onDestroy, onMount, tick } from 'svelte';
	import { audioStore } from '$lib/stores/audioStore.js';

	export let sounds = [];

	let iframe;
	let widget;
	let scriptPromise;
	let pendingPlay = false;
	let handledPlayRequest = 0;
	let needsNativePlay = false;

	$: current = sounds[$audioStore.currentIndex] ?? null;
	$: progress = $audioStore.durationMs
		? Math.min(100, ($audioStore.positionMs / $audioStore.durationMs) * 100)
		: 0;
	$: if ($audioStore.playRequest > handledPlayRequest) {
		handledPlayRequest = $audioStore.playRequest;
		playRequestedSound();
	}

	function loadWidgetScript() {
		if (window.SC?.Widget) return Promise.resolve(window.SC);
		if (scriptPromise) return scriptPromise;

		scriptPromise = new Promise((resolve, reject) => {
			const existing = document.querySelector('script[data-soundcloud-widget]');
			if (existing) {
				existing.addEventListener('load', () => resolve(window.SC), { once: true });
				existing.addEventListener('error', reject, { once: true });
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://w.soundcloud.com/player/api.js';
			script.async = true;
			script.dataset.soundcloudWidget = 'true';
			script.onload = () => resolve(window.SC);
			script.onerror = reject;
			document.head.appendChild(script);
		});

		return scriptPromise;
	}

	async function initialize(playAfterReady = false) {
		if (!current || widget) {
			if (playAfterReady && widget) widget.play();
			return;
		}

		pendingPlay = playAfterReady;
		audioStore.update((state) => ({ ...state, status: 'loading', errorMessage: '' }));
		await tick();

		try {
			const SC = await loadWidgetScript();
			widget = SC.Widget(iframe);
			const events = SC.Widget.Events;

			widget.bind(events.READY, () => {
				widget.setVolume($audioStore.volume);
				widget.getDuration((duration) => {
					audioStore.update((state) => ({ ...state, status: 'ready', durationMs: duration || 0 }));
				});
				if (pendingPlay) {
					pendingPlay = false;
					widget.play();
				}
			});
			widget.bind(events.PLAY, () => {
				widget.getDuration((duration) => {
					audioStore.update((state) => ({
						...state,
						status: 'ready',
						isPlaying: true,
						durationMs: duration || state.durationMs
					}));
				});
			});
			widget.bind(events.PAUSE, () => {
				audioStore.update((state) => ({ ...state, isPlaying: false }));
			});
			widget.bind(events.PLAY_PROGRESS, (event) => {
				audioStore.update((state) => ({ ...state, positionMs: event.currentPosition || 0 }));
			});
			widget.bind(events.FINISH, () => changeTrack(1, true));
			if (events.ERROR) {
				widget.bind(events.ERROR, () => setError('No se pudo reproducir este set.'));
			}
		} catch (error) {
			console.error(error);
			setError('SoundCloud no esta disponible en este momento.');
		}
	}

	function setError(message) {
		audioStore.update((state) => ({
			...state,
			status: 'error',
			isPlaying: false,
			errorMessage: message
		}));
	}

	function togglePlayback() {
		if (!widget) {
			initialize(true);
			return;
		}
		if ($audioStore.isPlaying) {
			widget.pause();
			return;
		}

		needsNativePlay = false;
		widget.play();
		setTimeout(() => {
			widget?.isPaused((paused) => {
				if (paused) {
					needsNativePlay = true;
					audioStore.update((state) => ({ ...state, isExpanded: true }));
				}
			});
		}, 900);
	}

	function playRequestedSound() {
		if (!current) return;
		if (!widget) {
			initialize(true);
			return;
		}
		widget.load(current.soundcloud_url, {
			auto_play: true,
			hide_related: true,
			show_comments: false,
			show_reposts: false,
			visual: false
		});
	}

	function changeTrack(direction, autoplay = $audioStore.isPlaying) {
		if (!sounds.length) return;
		const nextIndex = ($audioStore.currentIndex + direction + sounds.length) % sounds.length;
		audioStore.update((state) => ({
			...state,
			currentIndex: nextIndex,
			positionMs: 0,
			durationMs: 0,
			isPlaying: false,
			status: widget ? 'loading' : 'idle'
		}));

		if (widget) {
			widget.load(sounds[nextIndex].soundcloud_url, {
				auto_play: autoplay,
				hide_related: true,
				show_comments: false,
				show_reposts: false,
				visual: false
			});
		}
	}

	function seek(event) {
		if (!widget || !$audioStore.durationMs) return;
		widget.seekTo((Number(event.currentTarget.value) / 100) * $audioStore.durationMs);
	}

	function setVolume(event) {
		const volume = Number(event.currentTarget.value);
		widget?.setVolume(volume);
		audioStore.update((state) => ({ ...state, volume, isMuted: volume === 0 }));
	}

	function toggleMute() {
		const muted = !$audioStore.isMuted;
		widget?.setVolume(muted ? 0 : $audioStore.volume || 70);
		audioStore.update((state) => ({ ...state, isMuted: muted }));
	}

	function formatTime(milliseconds) {
		const seconds = Math.max(0, Math.floor(milliseconds / 1000));
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	}

	function retry() {
		widget = null;
		scriptPromise = null;
		initialize(false);
	}

	onMount(() => initialize(false));

	onDestroy(() => {
		if (widget && window.SC?.Widget?.Events) {
			Object.values(window.SC.Widget.Events).forEach((event) => widget.unbind(event));
		}
	});
</script>

{#if current}
	<aside class:expanded={$audioStore.isExpanded} class="mini-player" aria-label="Sound of Take Over">
		<iframe
			bind:this={iframe}
			title="SoundCloud player"
			allow="autoplay"
			src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(current.soundcloud_url)}&auto_play=false&hide_related=true&show_comments=false&show_reposts=false&visual=false`}
		></iframe>

		<div class="summary">
			<div class:playing={$audioStore.isPlaying} class="artwork">
				{#if current.artwork_url}
					<img src={current.artwork_url} alt="" />
				{:else}
					<div class="equalizer" aria-hidden="true"><i></i><i></i><i></i></div>
				{/if}
			</div>

			<div class="metadata">
				<span class="brand">SOUND OF TAKE OVER</span>
				<strong>{current.titulo}</strong>
				<small>{current.artista || 'Take Over'}</small>
			</div>

			<button class="primary" on:click={togglePlayback} disabled={$audioStore.status === 'loading'} aria-label={$audioStore.isPlaying ? 'Pausar' : 'Reproducir'}>
				{$audioStore.status === 'loading' ? '…' : $audioStore.isPlaying ? 'Ⅱ' : '▶'}
			</button>
			<button
				class="icon-button"
				on:click={() => audioStore.update((state) => ({ ...state, isExpanded: !state.isExpanded }))}
				aria-label={$audioStore.isExpanded ? 'Contraer reproductor' : 'Expandir reproductor'}
			>
				{$audioStore.isExpanded ? '×' : '⌃'}
			</button>
		</div>

		{#if $audioStore.isExpanded}
			<div class="details">
				{#if needsNativePlay}
					<p class="native-hint" role="status">Pulsa Play en el reproductor de SoundCloud para habilitar el audio.</p>
				{/if}
				{#if $audioStore.status === 'error'}
					<p class="error" role="status">{$audioStore.errorMessage}</p>
					<div class="error-actions">
						<button on:click={retry}>Reintentar</button>
						<a href={current.soundcloud_url} target="_blank" rel="noreferrer">Abrir SoundCloud</a>
					</div>
				{:else}
					<div class="progress-row">
						<span>{formatTime($audioStore.positionMs)}</span>
						<input aria-label="Progreso" type="range" min="0" max="100" value={progress} on:input={seek} />
						<span>{formatTime($audioStore.durationMs)}</span>
					</div>
					<div class="controls">
						<button on:click={() => changeTrack(-1)} aria-label="Set anterior">◀</button>
						<button on:click={() => changeTrack(1)} aria-label="Siguiente set">▶</button>
						<button on:click={toggleMute} aria-label={$audioStore.isMuted ? 'Activar sonido' : 'Silenciar'}>
							{$audioStore.isMuted ? '🔇' : '🔊'}
						</button>
						<input aria-label="Volumen" type="range" min="0" max="100" value={$audioStore.isMuted ? 0 : $audioStore.volume} on:input={setVolume} />
						<span class="count">{$audioStore.currentIndex + 1}/{sounds.length}</span>
					</div>
				{/if}
			</div>
		{/if}
	</aside>
{/if}

<style>
	iframe { position: fixed; left: -10000px; bottom: 0; width: 500px; height: 166px; opacity: .01; pointer-events: none; border: 0; }
	.mini-player.expanded iframe { position: relative; left: auto; bottom: auto; width: 100%; height: 166px; opacity: 1; pointer-events: auto; display: block; }
	.mini-player { position: fixed; right: 1.25rem; bottom: max(1.25rem, env(safe-area-inset-bottom)); z-index: 80; width: min(390px, calc(100vw - 2rem)); color: #fff; background: rgba(11,13,13,.88); border: 1px solid rgba(86,253,184,.18); border-radius: 14px; backdrop-filter: blur(20px); box-shadow: 0 16px 50px rgba(0,0,0,.42); overflow: hidden; }
	.summary { display: grid; grid-template-columns: 48px minmax(0,1fr) 42px 32px; gap: .7rem; align-items: center; padding: .7rem; }
	.artwork { width: 48px; height: 48px; display: grid; place-items: center; overflow: hidden; border-radius: 9px; background: rgba(86,253,184,.08); }
	.artwork img { width: 100%; height: 100%; object-fit: cover; }
	.metadata { display: flex; min-width: 0; flex-direction: column; gap: .12rem; }
	.metadata strong, .metadata small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.metadata strong { font-size: .9rem; }
	.metadata small { color: rgba(255,255,255,.48); }
	.brand { color: #56fdb8; font-size: .58rem; letter-spacing: .16em; }
	button { cursor: pointer; color: inherit; }
	button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid #56fdb8; outline-offset: 2px; }
	.primary { width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(86,253,184,.35); background: rgba(86,253,184,.1); color: #56fdb8; }
	.icon-button { border: 0; background: transparent; color: rgba(255,255,255,.55); font-size: 1.1rem; }
	.details { padding: .75rem 1rem 1rem; border-top: 1px solid rgba(255,255,255,.06); }
	.progress-row, .controls { display: flex; align-items: center; gap: .7rem; }
	.progress-row span { width: 34px; font-size: .68rem; color: rgba(255,255,255,.45); }
	input[type="range"] { flex: 1; accent-color: #56fdb8; }
	.controls { margin-top: .75rem; }
	.controls button, .error-actions button { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); border-radius: 7px; padding: .4rem .55rem; }
	.count { margin-left: auto; color: rgba(255,255,255,.35); font-size: .72rem; }
	.error { color: #ff8a83; font-size: .82rem; }
	.native-hint { margin: 0 0 .75rem; color: #56fdb8; font-size: .78rem; }
	.error-actions { display: flex; gap: .75rem; align-items: center; }
	.error-actions a { color: #56fdb8; font-size: .8rem; }
	.equalizer { display: flex; align-items: end; gap: 3px; height: 20px; }
	.equalizer i { width: 3px; height: 35%; background: #56fdb8; animation: equalize .7s ease-in-out infinite alternate; animation-play-state: paused; }
	.playing .equalizer i { animation-play-state: running; }
	.equalizer i:nth-child(2) { animation-delay: -.25s; }
	.equalizer i:nth-child(3) { animation-delay: -.45s; }
	@keyframes equalize { to { height: 100%; } }
	@media (max-width: 600px) { .mini-player { left: 1rem; right: 1rem; width: auto; bottom: max(.75rem, env(safe-area-inset-bottom)); } .summary { grid-template-columns: 42px minmax(0,1fr) 40px 28px; } .artwork { width: 42px; height: 42px; } }
	@media (prefers-reduced-motion: reduce) { .equalizer i { animation: none; height: 65%; } }
</style>

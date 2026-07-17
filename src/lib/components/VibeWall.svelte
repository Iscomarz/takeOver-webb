<script>
	import { onMount } from 'svelte';

	export let items = [];
	export let showFilters = true;
	export let limit = null;

	let eventFilter = 'all';
	// let yearFilter = 'all';
	// let monthFilter = 'all';
	let selected = null;
	let galleryTrack;
	let mixedItems = [];

	function shuffle(list) {
		const result = [...list];
		for (let index = result.length - 1; index > 0; index -= 1) {
			const randomIndex = Math.floor(Math.random() * (index + 1));
			[result[index], result[randomIndex]] = [result[randomIndex], result[index]];
		}
		return result;
	}

	function mixByEvent(list) {
		const groups = new Map();
		for (const item of list) {
			const eventId = String(item.evento_id);
			if (!groups.has(eventId)) groups.set(eventId, []);
			groups.get(eventId).push(item);
		}

		const queues = shuffle([...groups.values()]).map(shuffle);
		const result = [];
		while (queues.some((queue) => queue.length)) {
			for (const queue of queues) {
				if (queue.length) result.push(queue.shift());
			}
		}
		return result;
	}

	onMount(() => {
		mixedItems = mixByEvent(items);
	});

	$: events = [...new Map(items.map((item) => [String(item.evento_id), item.evento_nombre])).entries()];
	// Filtros temporales para una futura agrupación por fecha.
	// $: years = [...new Set(items.map((item) => new Date(item.fecha_contenido).getFullYear()))].sort((a, b) => b - a);
	$: galleryItems = eventFilter === 'all' && mixedItems.length ? mixedItems : items;
	$: filtered = galleryItems.filter((item) => {
		// const date = new Date(item.fecha_contenido);
		return eventFilter === 'all' || String(item.evento_id) === eventFilter;
		// && (yearFilter === 'all' || String(date.getFullYear()) === yearFilter)
		// && (monthFilter === 'all' || String(date.getMonth() + 1) === monthFilter);
	});
	$: visible = limit ? filtered.slice(0, limit) : filtered;

	function closeLightbox() {
		selected = null;
	}

	function closeFromBackdrop(event) {
		if (event.target === event.currentTarget) closeLightbox();
	}

	function scrollGallery(direction) {
		galleryTrack?.scrollBy({
			left: direction * Math.max(galleryTrack.clientWidth * .78, 320),
			behavior: 'smooth'
		});
	}

	function changePhoto(direction) {
		if (!selected || !visible.length) return;
		const currentIndex = visible.findIndex((item) => item.id === selected.id);
		const nextIndex = (currentIndex + direction + visible.length) % visible.length;
		selected = visible[nextIndex];
	}

	function handleKeydown(event) {
		if (!selected) return;
		if (event.key === 'Escape') closeLightbox();
		if (event.key === 'ArrowLeft') changePhoto(-1);
		if (event.key === 'ArrowRight') changePhoto(1);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<section class="vibe-wall" aria-labelledby="vibe-title">
	<header>
		<span>MEMORIES FROM THE DANCE FLOOR</span>
		<h1 id="vibe-title">VIBE WALL</h1>
		<p>Momentos que vivimos juntos. Sin poses, sin filtros, sólo la energía de la noche.</p>
	</header>

	{#if showFilters && items.length}
		<div class="filters">
			<label>Evento
				<select bind:value={eventFilter}>
					<option value="all">Todos</option>
					{#each events as [id, name]}<option value={id}>{name}</option>{/each}
				</select>
			</label>
			<!-- Filtros de fecha reservados para una siguiente iteración.
			<label>Año
				<select bind:value={yearFilter}>
					<option value="all">Todos</option>
					{#each years as year}<option value={String(year)}>{year}</option>{/each}
				</select>
			</label>
			<label>Mes
				<select bind:value={monthFilter}>
					<option value="all">Todos</option>
					{#each ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] as month, index}
						<option value={String(index + 1)}>{month}</option>
					{/each}
				</select>
			</label>
			-->
		</div>
	{/if}

	{#if visible.length}
		<div class="gallery-shell">
			<button class="gallery-arrow previous" on:click={() => scrollGallery(-1)} aria-label="Ver fotos anteriores">←</button>
			<div class="grid" bind:this={galleryTrack}>
				{#each visible as item}
					<button class="tile" on:click={() => selected = item} aria-label={`Ver ${item.descripcion || item.evento_nombre}`}>
						<img src={item.url_publica} alt={item.descripcion || `Recuerdo de ${item.evento_nombre}`} loading="lazy" />
						<span><strong>{item.evento_nombre}</strong><small>{new Date(item.fecha_contenido).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}</small></span>
					</button>
				{/each}
			</div>
			<button class="gallery-arrow next" on:click={() => scrollGallery(1)} aria-label="Ver más fotos">→</button>
		</div>
	{:else}
		<p class="empty">No hay recuerdos para estos filtros.</p>
	{/if}

	<div class="gallery-signature" aria-label="The night ends, the vibe stays">
		<span class="signature-line"></span>
		<div>
			<i aria-hidden="true"></i>
			<p>THE NIGHT ENDS</p>
			<strong>THE VIBE STAYS.</strong>
		</div>
		<span class="signature-line"></span>
	</div>
</section>

{#if selected}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="lightbox" on:click={closeFromBackdrop}>
		<button class="close" on:click={closeLightbox} aria-label="Cerrar">×</button>
		{#if visible.length > 1}
			<button class="lightbox-arrow previous" on:click={() => changePhoto(-1)} aria-label="Foto anterior">←</button>
		{/if}
		<div class="lightbox-content" role="dialog" aria-modal="true" aria-label={selected.descripcion || selected.evento_nombre}>
			<img src={selected.url_publica} alt={selected.descripcion || selected.evento_nombre} />
			<div><strong>{selected.evento_nombre}</strong><p>{selected.descripcion || ''}</p></div>
		</div>
		{#if visible.length > 1}
			<button class="lightbox-arrow next" on:click={() => changePhoto(1)} aria-label="Foto siguiente">→</button>
		{/if}
	</div>
{/if}

<style>
	.vibe-wall { width: min(1180px,calc(100% - 2rem)); margin: 0 auto; padding: 7rem 0 4rem; color: #fff; }
	header { max-width: 760px; margin-bottom: 2rem; }
	header span { color: #56fdb8; font-size: .66rem; letter-spacing: .22em; }
	h1 { margin: .35rem 0 0; font: 400 clamp(1.8rem,4vw,3rem)/1 "JockeyOne",sans-serif; letter-spacing: .04em; }
	header p { color: rgba(255,255,255,.5); }
	.filters { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
	label { color: rgba(255,255,255,.45); font-size: .72rem; display: flex; align-items: center; gap: .4rem; }
	select { color: #fff; background: #111; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; padding: .45rem .7rem; }
	.gallery-shell { position: relative; }
	.grid { display: flex; align-items: stretch; gap: .75rem; overflow-x: auto; padding: .3rem 0 .8rem; scroll-snap-type: x mandatory; scrollbar-width: none; }
	.grid::-webkit-scrollbar { display: none; }
	.tile {
		position: relative;
		flex: 0 0 clamp(210px,23vw,310px);
		height: clamp(300px,35vw,430px);
		padding: 0;
		border: 0;
		background: #111;
		overflow: hidden;
		cursor: pointer;
		scroll-snap-align: start;
	}
	.tile:nth-child(5n + 1) { flex-basis: clamp(290px,36vw,470px); }
	.tile:nth-child(5n + 3) { flex-basis: clamp(180px,19vw,250px); }
	.tile img { display: block; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); transition: filter .4s ease,transform .7s cubic-bezier(.2,.7,.2,1); }
	.tile:hover img,.tile:focus-visible img { filter: grayscale(0); transform: scale(1.055); }
	.tile > span { position: absolute; inset: auto 0 0; display: flex; justify-content: space-between; align-items: end; padding: 2rem .75rem .7rem; color: #fff; text-align: left; background: linear-gradient(transparent,rgba(0,0,0,.8)); opacity: 0; transition: opacity .25s; }
	.tile:hover > span,.tile:focus-visible > span { opacity: 1; }
	.tile strong,.tile small { display: block; }
	.tile small { color: rgba(255,255,255,.6); }
	.gallery-arrow,.lightbox-arrow { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border: 1px solid rgba(255,255,255,.2); border-radius: 50%; color: #fff; background: rgba(8,8,8,.82); backdrop-filter: blur(8px); cursor: pointer; transition: color .2s,border-color .2s,transform .2s; }
	.gallery-arrow:hover,.lightbox-arrow:hover { color: #fff; border-color: #fff; transform: scale(1.06); }
	.gallery-arrow { position: absolute; z-index: 3; top: 50%; transform: translateY(-50%); }
	.gallery-arrow:hover { transform: translateY(-50%) scale(1.06); }
	.gallery-arrow.previous { left: -1.35rem; }
	.gallery-arrow.next { right: -1.35rem; }
	.empty { padding: 4rem 0; color: rgba(255,255,255,.4); text-align: center; }
	.gallery-signature { display: grid; grid-template-columns: minmax(2rem,1fr) auto minmax(2rem,1fr); align-items: center; gap: clamp(1rem,4vw,3.5rem); width: min(900px,90%); margin: clamp(4.5rem,9vw,8rem) auto 1rem; text-align: center; }
	.signature-line { height: 1px; background: linear-gradient(90deg,transparent,rgba(255,255,255,.32)); }
	.signature-line:last-child { transform: scaleX(-1); }
	.gallery-signature div { position: relative; min-width: clamp(130px,18vw,190px); }
	.gallery-signature i { display: block; width: 4px; height: 4px; margin: 0 auto .8rem; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(255,255,255,.06),0 0 14px rgba(255,255,255,.3); animation: signature-pulse 3s ease-in-out infinite; }
	.gallery-signature p { margin: 0; color: rgba(255,255,255,.38); font-size: .5rem; letter-spacing: .3em; }
	.gallery-signature strong { display: block; margin-top: .3rem; color: #fff; font: 400 clamp(1rem,1.8vw,1.4rem)/1 "JockeyOne",sans-serif; letter-spacing: .08em; }
	.lightbox { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 2rem; background: rgba(0,0,0,.94); }
	.lightbox-content { max-width: min(1000px,100%); max-height: 90vh; }
	.lightbox-content img { display: block; max-width: 100%; max-height: 75vh; margin: auto; object-fit: contain; }
	.lightbox-content div { padding-top: .8rem; color: #fff; }
	.lightbox-content p { color: rgba(255,255,255,.55); margin: .25rem 0; }
	.close { position: absolute; top: 1rem; right: 1.5rem; color: #fff; background: none; border: 0; font-size: 2rem; cursor: pointer; }
	.lightbox-arrow { position: absolute; z-index: 2; top: 50%; }
	.lightbox-arrow.previous { left: 1.5rem; }
	.lightbox-arrow.next { right: 1.5rem; }
	@keyframes signature-pulse {
		0%,100% { opacity: .45; transform: scale(.85); }
		50% { opacity: 1; transform: scale(1); }
	}
	@media(max-width:600px){
		.vibe-wall{padding-top:5.5rem}
		.grid{gap:.5rem}
		.tile,.tile:nth-child(n){flex-basis:76vw;height:58vh;max-height:430px}
		.tile img{filter:grayscale(.75)}
		.tile>span{opacity:1}
		.gallery-arrow{width:2.4rem;height:2.4rem}
		.gallery-arrow.previous{left:-.6rem}
		.gallery-arrow.next{right:-.6rem}
		.lightbox{padding:4rem 1rem 5rem}
		.lightbox-arrow{top:auto;bottom:1.25rem}
		.lightbox-arrow.previous{left:calc(50% - 3.5rem)}
		.lightbox-arrow.next{right:calc(50% - 3.5rem)}
		.gallery-signature{width:100%;gap:.85rem;margin-top:4.5rem}
		.gallery-signature p{font-size:.5rem;letter-spacing:.25em}
	}
	@media(prefers-reduced-motion:reduce){.grid{scroll-behavior:auto}.tile img,.tile>span{transition:none}.gallery-signature i{animation:none}}
</style>

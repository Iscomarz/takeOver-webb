<script>
	import { spring } from 'svelte/motion';
	import { createEventDispatcher } from 'svelte';

	export let count = 0; // Aceptar `count` como prop

	const displayed_count = spring(count);
	$: displayed_count.set(count);
	$: offset = modulo($displayed_count, 1);

	const dispatch = createEventDispatcher();

	function modulo(n, m) {
		return ((n % m) + m) % m;
	}

	function decrement() {
		if (count > 0) {
			count -= 1;
			dispatch('countChange', count); // Disparar evento al cambiar `count`
		}
	}

	function increment() {
		if (count < 10) {  // Limitar el incremento a un máximo de 10
			count += 1;
			dispatch('countChange', count); // Disparar evento al cambiar `count`
		}
	}
</script>

<div class="counter">
	<button on:click={decrement} aria-label="Decrease the counter by one">
		<svg aria-hidden="true" viewBox="0 0 1 1">
			<path d="M0,0.5 L1,0.5" />
		</svg>
	</button>

	<div class="counter-viewport">
		<div class="counter-digits" style="transform: translate(0, {100 * offset}%)">
			<strong class="hidden" aria-hidden="true">{Math.floor($displayed_count + 1)}</strong>
			<strong>{Math.floor($displayed_count)}</strong>
		</div>
	</div>

	<button on:click={increment} aria-label="Increase the counter by one">
		<svg aria-hidden="true" viewBox="0 0 1 1">
			<path d="M0,0.5 L1,0.5 M0.5,0 L0.5,1" />
		</svg>
	</button>
</div>

<style>
	.counter {
		display: flex;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		margin: 0;
	}

	.counter button {
		width: 1.5em;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background-color: transparent;
		touch-action: manipulation;
		font-size: 1.5rem;
	}

	.counter button:hover {
		background-color: var(--color-bg-1);
	}

	svg {
		width: 20%;
		height: 20%;
	}

	path {
		vector-effect: non-scaling-stroke;
		stroke-width: 1.5px;
		stroke: #444;
	}

	.counter-viewport {
		width: 1em;
		height: 2em;
		overflow: hidden;
		text-align: center;
		position: relative;
	}

	.counter-viewport strong {
		position: absolute;
		display: flex;
		width: 100%;
		height: 100%;
		font-weight: 400;
		color: var(--color-theme-1);
		font-size: 0.75rem;
		align-items: center;
		justify-content: center;
	}

	.counter-digits {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.hidden {
		top: -100%;
		user-select: none;
	}
</style>

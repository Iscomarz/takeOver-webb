<script>
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	
	let vantaEffect;
	let vantaRef;
	let reducedMotion = false;
	
	onMount(async () => {
		// Detectar preferencia de movimiento reducido
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = mediaQuery.matches;
		
		// Importar dinámicamente el efecto FOG de Vanta
		const VANTA = await import('vanta/dist/vanta.fog.min.js');
		
		if (!reducedMotion && vantaRef) {
			vantaEffect = VANTA.default({
				el: vantaRef,
				THREE: THREE,
				mouseControls: true,
				touchControls: true,
				gyroControls: false,
				minHeight: 200.00,
				minWidth: 200.00,
				highlightColor: 0x808080,      // Gris medio
				midtoneColor: 0x404040,        // Gris oscuro
				lowlightColor: 0x0,            // Negro
				baseColor: 0x0,                // Negro base
				blurFactor: 0.6,               // Suavidad del efecto
				speed: 0.5,                    // Velocidad lenta
				zoom: 0.8                      // Zoom sutil
			});
		}
		
		const handler = (e) => {
			reducedMotion = e.matches;
			if (e.matches && vantaEffect) {
				vantaEffect.destroy();
				vantaEffect = null;
			}
		};
		mediaQuery.addEventListener('change', handler);
		
		return () => mediaQuery.removeEventListener('change', handler);
	});
	
	onDestroy(() => {
		if (vantaEffect) {
			vantaEffect.destroy();
		}
	});
</script>

<div class="vanta-wrapper" bind:this={vantaRef}></div>

<style>
	.vanta-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		overflow: hidden;
		background: #000000;
	}
</style>

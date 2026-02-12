<script>
    import { onMount, onDestroy } from 'svelte';
    import * as THREE from 'three';
    
    let vantaEffect;
    let vantaRef;
    let reducedMotion = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    
    // Suavizado del movimiento del mouse
    function updateMousePosition() {
        mouseX += (targetMouseX - mouseX) * 0.15; // Interpolación más responsiva
        mouseY += (targetMouseY - mouseY) * 0.15;
        requestAnimationFrame(updateMousePosition);
    }
    
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
                blurFactor: 0.7,               // Suavidad del efecto
                speed: 1.2,                    // Velocidad más dinámica
                zoom: 1.0                      // Zoom más notorio
            });
            
            // Configurar interacción notoria con el mouse
            if (vantaEffect.uniforms) {
                vantaEffect.uniforms.uMouseInfluence = { value: 2.5 }; // Influencia más visible
            }
        }
        
        // Iniciar animación de mouse suavizada
        updateMousePosition();
        
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
    
    // Capturar movimiento del mouse
    function handleMouseMove(event) {
        if (!reducedMotion && vantaRef) {
            const rect = vantaRef.getBoundingClientRect();
            targetMouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            targetMouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        }
    }
    
    onDestroy(() => {
        if (vantaEffect) {
            vantaEffect.destroy();
        }
    });
</script>

<div 
    class="vanta-wrapper" 
    bind:this={vantaRef}
    on:mousemove={handleMouseMove}
></div>

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
        cursor: none; /* Ocultar cursor para efecto más inmersivo (opcional) */
    }
    
    /* Efecto notorio de despeje visual */
    .vanta-wrapper::after {
        content: '';
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        pointer-events: none;
        background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 40%, transparent 80%);
        transform: translate(-50%, -50%);
        transition: opacity 0.2s ease;
        opacity: 0;
        filter: blur(30px);
        mix-blend-mode: screen;
    }
    
    .vanta-wrapper:hover::after {
        opacity: 1;
    }
</style>

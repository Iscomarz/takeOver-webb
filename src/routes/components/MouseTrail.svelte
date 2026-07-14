<script>
  import { onMount } from 'svelte';

  let canvas;
  let ctx;
  let particles = [];
  let mouse = { x: 0, y: 0, lastX: 0, lastY: 0, active: false };
  let animationFrameId;
  let width = 0;
  let height = 0;
  let isHoverSupported = true;

  onMount(() => {
    // Solo activar en dispositivos que soportan puntero (mouse/hover)
    isHoverSupported = window.matchMedia('(hover: hover)').matches;
    if (!isHoverSupported) return;

    ctx = canvas.getContext('2d');
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  });

  function resizeCanvas() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      // Deriva suave: se eleva un poco y se expande
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.6 - 0.4;
      this.size = Math.random() * 10 + 10; // Tamaño inicial más grande para que parezca humo
      this.alpha = 1.0;
      // Desvanecimiento equilibrado
      this.decay = Math.random() * 0.025 + 0.018;
      // Expansión más pronunciada (el humo se infla al disiparse)
      this.expansion = Math.random() * 0.6 + 0.4;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.size += this.expansion;
      this.alpha -= this.decay;
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.beginPath();
      // Gradiente radial con radio amplio para un look muy difuminado
      let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      
      // Gris humo muy suave y transparente
      grad.addColorStop(0, `rgba(180, 180, 180, ${this.alpha * 0.15})`);
      grad.addColorStop(0.4, `rgba(180, 180, 180, ${this.alpha * 0.05})`);
      grad.addColorStop(1, 'rgba(180, 180, 180, 0)');
      
      ctx.fillStyle = grad;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function handleMouseMove(e) {
    mouse.active = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (mouse.lastX === 0 && mouse.lastY === 0) {
      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;
      return;
    }

    // Calcular la distancia recorrida para rellenar los huecos
    let dx = mouse.x - mouse.lastX;
    let dy = mouse.y - mouse.lastY;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    // Relleno de partículas un poco más continuo para un flujo de humo más uniforme
    let steps = Math.min(Math.floor(distance / 10), 6);
    for (let i = 0; i <= steps; i++) {
      let t = steps === 0 ? 1 : i / steps;
      let px = mouse.lastX + dx * t;
      let py = mouse.lastY + dy * t;
      
      // Vibración sutil de posición
      px += (Math.random() - 0.5) * 5;
      py += (Math.random() - 0.5) * 5;
      
      particles.push(new Particle(px, py));
    }

    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
  }

  function handleMouseEnter() {
    mouse.active = true;
  }

  function handleMouseLeave() {
    mouse.active = false;
    mouse.lastX = 0;
    mouse.lastY = 0;
  }

  function tick() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);

    // Actualizar y dibujar partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.update();
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      } else {
        p.draw(ctx);
      }
    }

    animationFrameId = requestAnimationFrame(tick);
  }
</script>

{#if isHoverSupported}
  <canvas bind:this={canvas}></canvas>
{/if}

<style>
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999; /* Por encima de todo, pero transparente a los clicks */
  }
</style>

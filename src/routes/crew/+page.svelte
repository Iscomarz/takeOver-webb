<script>
	import { fade, fly, blur } from "svelte/transition";
	import { quintOut } from "svelte/easing";
	import alanImg from "../../lib/images/crew/alan.jpg";
	import cobosImg from "../../lib/images/crew/cobos.jpeg";
	import iscoImg from "../../lib/images/crew/isco.jpg";
	import sokImg from "../../lib/images/crew/sok.webp";
	import CardTeamMember from "../components/cardTeamMember.svelte";
	import { onMount } from "svelte";

	export let data;

	let selectedMember = null;
	let detailsSection;
	let isMobile = false;
	let crewMembers = [];

	onMount(async () => {
	// 	
	// Detectar si es móvil o desktop
	await loadCrewMembers();

    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023px)'); // ajustar según breakpoint
    const onChange = e => isMobile = e.matches;
    isMobile = mq.matches;
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);

	//Seleccionar el primer miembro si es desktop
	if (!isMobile) {
	  selectedMember = crewMembers[0];
	}
	
    return () => mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange);
  });

  async function loadCrewMembers() {
	// Cargar los miembros del equipo desde data o servicio
	crewMembers = data?.crewMembers;
	//console.log("Crew Members cargados:", crewMembers);
  }

	function selectMember(member) {
		if (selectedMember?.team_id === member.team_id) {
			selectedMember = null;
		} else {
			selectedMember = member;
		}
	}
</script>

<svelte:head>
	<title>Crew - Take Over</title>
	<meta name="description" content="Conoce al equipo detrás de Take Over" />
</svelte:head>

<!-- Header artístico -->
<section
	class="lg:hidden mt-14 relative w-full h-[8vh] min-h-[150px] flex items-center justify-center overflow-hidden"
>
	<!-- Fondo con efecto de onda -->
	<div
		class="absolute inset-0 bg-gradient-to-b from-black-950 via-black-900 to-black-950"
	></div>

	<!-- Contenido del header -->
	<div class="relative z-10 text-center px-4">
		<h1
			class="font-jockey text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white mb-4 uppercase tracking-wider"
		>
			The Crew
		</h1>
		<p class="font-jost text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
			Los creadores y visionarios detrás de Take Over
		</p>
	</div>
</section>

<!-- Grid de cards del equipo -->
<section
	class="lg:hidden w-[95%] sm:w-[90%] md:w-[85%] max-w-[1400px] mx-auto py-4 md:py-20"
>
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		{#each crewMembers as member (member.team_id)}
			<CardTeamMember
				{member}
				isSelected={selectedMember?.team_id === member.team_id}
				onSelect={() => selectMember(member)}
			/>
		{/each}

		<div>
			<p class="font-jockey md:text-3xl text-white uppercase tracking-wider mb-4 text-center">"Sinergia que suena"</p>
			<p class="font-jost text-gray-300 text-base md:text-lg max-w-3xl mx-auto mt-6 text-left">
			El equipo de Take Over está comprometido con la realización de eventos de la más alta calidad y con el apoyo permanente a la escena underground local. Actuamos con profesionalismo, respeto y pasión para crear experiencias seguras, inclusivas y memorables que impulsen el talento emergente.
		</p>
		</div>
		
		
	</div>
</section>
<!-- Layout principal con split view -->
<section
	bind:this={detailsSection}
	class="mt-14 hidden lg:flex min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 items-center justify-center p-4 md:p-8 scroll-mt-20"
>
	<div
		class="w-full max-w-[1400px] h-[90vh] min-h-[600px] flex flex-col md:flex-row gap-8"
	>
		<!-- Panel izquierdo - Lista de crew -->
		<div class="w-full md:w-[400px] flex flex-col gap-6">
			<!-- Título -->
			<div class="mb-4">
				<h1
					class="font-jockey text-4xl md:text-5xl text-white uppercase tracking-wider mb-2"
				>
					THE CREW
				</h1>
				<div
					class="h-1 w-20 bg-gradient-to-r from-emerald-500 to-transparent"
				></div>
			</div>

			<!-- Lista de miembros -->
			<div
				class="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
			>
				{#each crewMembers as member (member.team_id)}
					<button
						class="group relative flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 {selectedMember?.id ===
						member.id
							? 'bg-white/10 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
							: ''}"
						on:click={() => selectMember(member)}
					>
						<!-- Nombre -->
						<span
							class="font-jost text-lg text-white uppercase tracking-wider {selectedMember?.id ===
							member.id
								? 'text-emerald-400'
								: ''}"
						>
							{member.name}
						</span>

						<!-- Icono + -->
						<div
							class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white/30 transition-all duration-300 group-hover:border-emerald-500 group-hover:rotate-90 {selectedMember?.id ===
							member.id
								? 'border-emerald-500 bg-emerald-500/20'
								: ''}"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								class="text-white {selectedMember?.id ===
								member.id
									? 'text-emerald-400'
									: ''}"
							>
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
						</div>

						<!-- Indicador seleccionado -->
						{#if selectedMember?.id === member.id}
							<div
								class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-l-xl"
								transition:fade={{ duration: 200 }}
							></div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Panel derecho - Detalles del miembro -->
		{#if selectedMember}
			<div
				class="flex-1 relative overflow-hidden rounded-[32px] bg-gradient-to-br from-neutral-900/95 via-neutral-900/95 to-neutral-950/95 backdrop-blur-xl border border-white/10 shadow-2xl"
				in:fly={{ x: 50, duration: 500, easing: quintOut }}
			>
				<!-- Efectos de fondo -->
				<div
					class="absolute inset-0 bg-gradient-to-br {selectedMember.color} opacity-20 mix-blend-overlay"
				></div>
				<div
					class="absolute inset-0 opacity-[0.015]"
					style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"
				></div>

				<div class="relative z-10 h-full flex flex-col">
					<!-- Imagen del miembro -->
					<div class="relative h-[50%] overflow-hidden">
						<img
							src={selectedMember.image}
							alt={selectedMember.name}
							class="w-full h-full object-cover"
							key={selectedMember.id}
						/>
						<div
							class="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"
						></div>
						<div
							class="absolute inset-0 bg-gradient-to-br {selectedMember.color} opacity-20 mix-blend-overlay"
						></div>
					</div>

					<!-- Información del miembro -->
					<div
						class="flex-1 p-8 md:p-10 flex flex-col gap-6 overflow-y-auto"
					>
						<!-- Header -->
						<div>
							<h2
								class="font-jockey text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300 mb-2 uppercase tracking-wide"
							>
								{selectedMember.name}
							</h2>
							<p
								class="font-jost text-emerald-400 text-lg uppercase tracking-wider"
							>
								{selectedMember.role}
							</p>
						</div>

						<!-- Descripción -->
						<p
							class="font-jost text-gray-300 text-base leading-relaxed"
						>
							{selectedMember.description}
						</p>

						<!-- Links de acción -->
						<div class="flex flex-wrap gap-4 mt-auto">
							<a
								href="#preskit"
								class="px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/20 text-white rounded-lg font-jost text-sm uppercase tracking-wider transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:-translate-y-1 hover:shadow-lg no-underline"
							>
								Preskit
							</a>

							<a
								href={selectedMember.socials.instagram}
								target="_blank"
								rel="noopener noreferrer"
								class="social-link"
								aria-label="Instagram"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect
										x="2"
										y="2"
										width="20"
										height="20"
										rx="5"
										ry="5"
									></rect>
									<path
										d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
									></path>
									<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"
									></line>
								</svg>
							</a>
							<a
								href={selectedMember.socials.soundcloud}
								target="_blank"
								rel="noopener noreferrer"
								class="social-link"
								aria-label="SoundCloud"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689c.446.143.636.138 1 .138v-5.949z"
									/>
								</svg>
							</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	.social-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: white;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.social-link:hover {
		background: rgba(16, 185, 129, 0.2);
		border-color: rgba(16, 185, 129, 0.5);
		transform: translateY(-2px);
		box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
		color: rgb(52, 211, 153);
	}

	.social-link-mobile {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: white;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.social-link-mobile:hover {
		background: rgba(16, 185, 129, 0.3);
		border-color: rgba(16, 185, 129, 0.6);
		color: rgb(52, 211, 153);
	}

	/* Scrollbar personalizado */
	.scrollbar-thin::-webkit-scrollbar {
		width: 6px;
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Animación de entrada de imagen */
	img {
		animation: fadeIn 0.5s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(1.1);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>

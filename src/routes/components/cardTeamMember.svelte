<script>
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    export let member;
    export let isSelected = false;
    export let onSelect;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="crew-card group relative cursor-pointer"
    on:click={onSelect}
    tabindex="0"
    role="button"
    aria-pressed={isSelected}
    aria-label={`Ver información de ${member.name}`}
>
    <!-- Card container con efecto hover y blur cuando está seleccionado -->
    <div
        class="relative h-[400px] overflow-hidden rounded-[24px] transition-all duration-500 {isSelected
            ? 'scale-95 ring-4 ring-emerald-500/50'
            : 'hover:scale-105'}"
    >
        <!-- Imagen de fondo -->
        <img
            src={member.image}
            alt={member.name}
            class="absolute inset-0 w-full h-full object-cover transition-all duration-700 {isSelected
                ? 'blur-sm scale-110 brightness-50'
                : 'group-hover:scale-110'}"
        />

        <!-- Overlay gradient más oscuro cuando está seleccionado -->
        <div
            class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-500 {isSelected
                ? 'opacity-95'
                : 'opacity-90 group-hover:opacity-95'}"
        ></div>

        <!-- Efecto de color personalizado -->
        <div
            class="absolute inset-0 bg-gradient-to-br {member.color} transition-opacity duration-500 mix-blend-overlay {isSelected
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'}"
        ></div>

        <!-- Contenido -->
        <div
            class="absolute inset-0 flex flex-col justify-end p-6 z-10 transition-all duration-500 {isSelected
                ? 'justify-start md:justify-end pt-6'
                : ''}"
        >
            <h3
                class="font-jockey text-3xl text-white mb-2 uppercase tracking-wide transition-all duration-500 {isSelected
                    ? 'md:-translate-y-2'
                    : 'group-hover:-translate-y-2'}"
            >
                {member.name}
            </h3>
            <p
                class="font-jost text-gray-300 text-sm uppercase tracking-wider mb-2"
            >
                {member.role}
            </p>

            <!-- Información expandida para móvil -->
            {#if isSelected}
                <div
                    class="md:hidden flex flex-col gap-4 mt-4"
                    in:fly={{
                        y: 20,
                        duration: 600,
                        easing: quintOut,
                        delay: 100,
                    }}
                    out:fade={{ duration: 300 }}
                >
                    <p class="font-jost text-gray-300 text-sm leading-relaxed">
                        {member.description}
                    </p>

                    <!-- Redes sociales -->
                    <div class="flex gap-3">
                        {#if member.socials.instagram}
                        <a
                            href={member.socials.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="social-link-mobile"
                            aria-label="Instagram"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
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
                        {/if}
                        {#if member.socials.soundcloud}
                        <a
                            href={member.socials.soundcloud}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="social-link-mobile"
                            aria-label="SoundCloud"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path
                                    d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689c.446.143.636.138 1 .138v-5.949z"
                                />
                            </svg>
                        </a>
                        {/if}
                        {#if member.socials.presskitPdfPath}
                            <a
                                href={member.socials.presskitPdfPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="social-link-mobile-pdf"
                                aria-label="Press Kit PDF"
                            >
                                <p>Presskit</p>
                                <!-- SVG icon for download -->
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    fill="#f5f5f5"
                                    viewBox="0 0 256 256"
                                    ><path
                                        d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-42.34-61.66a8,8,0,0,1,0,11.32l-24,24a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L120,164.69V120a8,8,0,0,1,16,0v44.69l10.34-10.35A8,8,0,0,1,157.66,154.34Z"
                                    ></path></svg
                                >
                            </a>
                        {/if}
                    </div>
                </div>

                <!-- Indicador de selección para desktop -->
                <div
                    class="hidden md:flex items-center gap-2 text-emerald-400 text-sm font-jost uppercase tracking-wider"
                    in:fade={{ duration: 400, easing: quintOut, delay: 150 }}
                    out:fade={{ duration: 250 }}
                >
                    <span>Seleccionado</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            {:else}
                <div
                    class="flex items-center gap-2 text-white/70 text-xs font-jost uppercase tracking-wider"
                    in:fade={{ duration: 400, easing: quintOut, delay: 100 }}
                    out:fade={{ duration: 250 }}
                >
                    <span>Haz clic para ver más</span>
                </div>
            {/if}
        </div>

        <!-- Borde animado -->
        <div
            class="absolute inset-0 border-2 {member.accent_color} rounded-[24px] transition-opacity duration-500 {isSelected
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'}"
        ></div>
    </div>
</div>

<style>
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
    .social-link-mobile-pdf {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 0 8px;
        height: 36px;
        gap: 4px;
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
</style>

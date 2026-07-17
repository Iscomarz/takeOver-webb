<script>
	import VibeWall from '$lib/components/VibeWall.svelte';
	export let data;
</script>

<svelte:head>
	<title>Vibe Wall - Take Over</title>
	<meta name="description" content="Recuerdos de los eventos de Take Over" />
</svelte:head>

<VibeWall items={data?.gallery ?? []} />

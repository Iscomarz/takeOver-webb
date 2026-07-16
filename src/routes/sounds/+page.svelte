<script>
	import SoundsSection from '$lib/components/SoundsSection.svelte';
	export let data;
</script>

<svelte:head>
	<title>The Sounds of Take Over</title>
	<meta name="description" content="Sets y sesiones seleccionados por Take Over" />
</svelte:head>

<div class="sounds-page">
	<SoundsSection sounds={data?.sounds ?? []} />
</div>

<style>
	@media (max-width: 600px) {
		.sounds-page {
			padding-top: 60px;
		}
	}
</style>

<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/takeover-logo.png';
	import welcome_fallback from '$lib/images/svelte-welcome.png';
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>
		<span class="welcome">
			<picture>
				<source srcset={welcome} type="image/png" />
				<img src={welcome_fallback} alt="TakeOver-logo" />
			</picture>
		</span>
	</h1>

	<h2>
		try editing <strong>src/routes/+page.svelte</strong>
	</h2>

	<Counter />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
		display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
		gap: 20px;
	}

	.welcome {
		display: block;
		position: relative;
		width: 30%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: auto;
		top: 0;
		display: block;
	}
</style>

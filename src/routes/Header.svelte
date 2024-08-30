<script>
	import { page } from '$app/stores';
	import logo from '$lib/images/takeover-logo.png';
	import github from '$lib/images/github.svg';
	import {onMount} from 'svelte';

	let showHeader = false;

	$: currentPath = $page.url.pathname;

	$: showHeader = currentPath !== '/';

</script>

<header>
	<div class="corner">
		<a href="/">
			<img src={logo} alt="TakeOver" />
		</a>
	</div>

	{#if showHeader}
	<nav>	
		<ul>
			<li aria-current={$page.url.pathname === '/tickets' ? 'page' : undefined}>
				<a href="/tickets">TICKETS</a>
			</li>
			<li aria-current={$page.url.pathname === '/about' ? 'page' : undefined}>
				<a href="/about">ABOUT TAKE OVER</a>
			</li>
			<li aria-current={$page.url.pathname === '/crew' ? 'page' : undefined}>
				<a href="/crew">CREW</a>
			</li>
			<li aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}>
				<a href="/contact">CONTACT</a>
			</li>
		</ul>	
	</nav>
	{/if}

	<div class="corner">
		<a href="https://github.com/sveltejs/kit">
			<img src={github} alt="GitHub" />
		</a>
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-around;
	}

	.corner {
		width: 4em;
		height: 4em;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 4em;
		height: 4em;
		object-fit: contain;
	}

	nav {
		display: flex;
		justify-content: center;
		--background: rgba(255, 255, 255, 0.7);
		width: 70%;
	}

	svg {
		width: 2em;
		height: 3em;
		display: block;
	}

	path {
		fill: var(--background);
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		width: 80%;
		height: 4em;
		display: flex;
		justify-content: space-evenly;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
		border-radius: 0 0 40px 40px;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	nav a:hover{
		color: var(--color-theme-1);
	}

</style>

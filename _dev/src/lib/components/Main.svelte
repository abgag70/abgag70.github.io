<script lang="ts">
	import { onMount } from "svelte";

	let main: HTMLDivElement;

	onMount(() => {
		setPagePadding();
	});

	function onPageResize() {
		setPagePadding();
	}

	let paddingIsTwentyPct = true;
	function setPagePadding() {
		if (main.clientWidth > 1000) {
			// main.style.paddingLeft = "20%";
			// main.style.paddingRight = "20%";
			paddingIsTwentyPct = true
		} else {
			// main.style.paddingLeft = "0px";
			// main.style.paddingRight = "0px";
			paddingIsTwentyPct = false
		}
	}
</script>

<svelte:window on:resize={onPageResize} />

<div class="main inconsolata {paddingIsTwentyPct ? "padding-20-left-right" : "padding-5-left-right" }" bind:this={main}>
	<div class="top-panel">
		<h2>Anthony Gagnon's Web Page</h2>
	</div>
	<div class="main-content">
		<div class="left-panel">
			<div class="left-content">
				<h3>Projects</h3>
				<ul>
					<div class="list-element">
						<li>MiraïHDR🌞</li>
						<small>Generate architectural luminance maps directly in the browser</small>
					</div>
					<div class="list-element">
						<li>MiraïHDR</li>
						#e4e4e7
					</div>
				</ul>
			</div>
		</div>
		<div class="right-panel">
			<div class="right-content">
				<h3>Blog</h3>
				<ul>
					<div class="list-element">
						<li>Minimizing a Javascript function with DLib's MaxLIPO+TR global optimization algorithm using Emscripten and WASM</li>
						<br>
						<small><a href="https://abgag70.github.io/blog/minimizing-a-javascript-function-with-dlibs-maxlipotr-global-optimization-algorithm-using-emscripten-and-wasm">View blog post</a></small>
					</div>
					
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	@font-face {
		font-family: "Inconsolata";
		src: url("/assets/fonts/Inconsolata-VariableFont_wdth,wght.ttf")
			format("truetype");
		font-weight: normal; /* Define the font weight if needed */
		font-style: normal; /* Define the font style if needed */
		font-display: swap; /* Optimize font loading behavior */
	}

	/* Font  */
	.inconsolata {
		font-family: "Inconsolata", monospace;
		font-optical-sizing: auto;
		font-style: normal;
		font-variation-settings: "wdth" 100;
	}
	:global(body) {
		padding: 0px;
		margin: 0px;
	}
	.main {
		min-height: 100vh;
		background-color: #fdfffd;
		display: flex;
		flex-direction: column;
		font-size: 1.25rem;
	}
	.padding-20-left-right {
		padding-left: 20%;
		padding-right: 20%;
	}
	.padding-5-left-right {
		padding-left: 5%;
		padding-right: 5%;
	}
	.main-content {
		display: flex;
		flex-direction: row;
		height: 100%;
	}
	.top-panel {
		background-color: #fdfffd;
		box-sizing: border-box;
		padding-left: 1.618%;
		padding-right: 1.618%;
		padding-top: 1.618%;
		padding-bottom: 1.618%;
		height: fit-content;
	}
	.left-panel {
		width: 50%;
		height: 100%;

		background-color: #fdfffd;
		padding-left: 1.618%;
		padding-right: 1.618%;
		box-sizing: border-box;
	}
	.right-panel {
		width: 50%;
		height: 100%;

		background-color: #fdfffd;
		padding-left: 1.618%;
		padding-right: 1.618%;
		box-sizing: border-box;
	}
	.left-content {
		width: 100%;
		height: 100%;
		background-color: #fdfffd;
	}
	.right-content {
		width: 100%;
		height: 100%;
		background-color: #fdfffd;
	}
	.list-element {
		padding-bottom: 15px;
	}

	/* Fix svelte shit etc... */
	:global(h1 h2 h3 h4 h5 h6) {
		margin: 0px;
	}
</style>

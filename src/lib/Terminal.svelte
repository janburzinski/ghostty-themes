<script lang="ts">
	import type { Theme } from './types';
	let { theme }: { theme: Theme } = $props();

	const c = (i: number) => theme.palette[i] || theme.foreground || '#fff';
</script>

<div class="term" style="background:{theme.background};color:{theme.foreground}">
	<div class="row">
		<span style="color:{c(2)}">➜</span>
		<span style="color:{c(6)}">~/code</span>
		<span style="color:{c(4)}">git:(</span><span style="color:{c(1)}">main</span><span
			style="color:{c(4)}">)</span
		>
		<span style="color:{c(3)}">✗</span>
	</div>
	<div class="row"><span style="color:{c(8)}">$</span> ls -la</div>
	<div class="row">
		<span style="color:{c(4)}">drwxr-xr-x</span> 12 user
		<span style="color:{c(3)}">4.0K</span>
		<span style="color:{c(6)}">src/</span>
	</div>
	<div class="row">
		<span style="color:{c(4)}">-rw-r--r--</span> 1 user
		<span style="color:{c(3)}">2.1K</span>
		<span style="color:{c(2)}">README.md</span>
	</div>
	<div class="row">
		<span style="color:{c(8)}">$</span>
		<span style="color:{c(5)}">function</span>
		<span style="color:{c(4)}">greet</span>() {'{'}
	</div>
	<div class="row">
		&nbsp;&nbsp;<span style="color:{c(5)}">echo</span>
		<span style="color:{c(2)}">"Hello, $1!"</span>
	</div>
	<div class="row">{'}'}</div>
	<div class="row">
		<span style="color:{c(9)}">error:</span> file not found
		<span style="color:{c(11)}">warning:</span> deprecated
	</div>
	<div class="row">
		<span style="color:{c(10)}">✓</span>
		<span style="color:{c(12)}">info</span>
		<span style="color:{c(13)}">debug</span>
		<span style="color:{c(14)}">trace</span>
	</div>
</div>
<div class="swatches">
	{#each theme.palette as col}
		<div style="background:{col}"></div>
	{/each}
</div>

<style>
	.term {
		width: 100%;
		box-sizing: border-box;
		padding: 16px 18px;
		font-family: 'Geist Mono', 'SF Mono', Menlo, monospace;
		font-size: 11.5px;
		line-height: 1.65;
		font-feature-settings: 'calt' 0, 'liga' 0;
		font-variant-ligatures: none;
		overflow: hidden;
	}
	.row {
		white-space: pre;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	@media (max-width: 420px) {
		.term {
			padding: 14px;
			font-size: 10.5px;
		}
	}
	.swatches {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(16, 1fr);
		height: 3px;
	}
	.swatches div {
		height: 100%;
	}
</style>

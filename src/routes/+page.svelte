<script lang="ts">
	import themesData from '$lib/themes.json';
	import type { Theme } from '$lib/types';
	import Terminal from '$lib/Terminal.svelte';
	import { configFor } from '$lib/config';

	const THEMES = themesData as Record<string, Theme>;
	const names = Object.keys(THEMES).sort();

	let query = $state('');
	let filter = $state<'all' | 'dark' | 'light'>('all');
	let selected = $state<string | null>(null);
	let mixMode = $state(false);
	let lightPick = $state('');
	let darkPick = $state('');
	let copied = $state(false);

	const lights = names.filter((n) => THEMES[n].isLight);
	const darks = names.filter((n) => !THEMES[n].isLight);

	const filtered = $derived(
		names.filter((n) => {
			if (query && !n.toLowerCase().includes(query.toLowerCase())) return false;
			const t = THEMES[n];
			if (filter === 'dark' && t.isLight) return false;
			if (filter === 'light' && !t.isLight) return false;
			return true;
		})
	);

	const visible = $derived(filtered.slice(0, 120));

	function openTheme(name: string) {
		mixMode = false;
		selected = name;
	}

	function openRandom() {
		openTheme(names[Math.floor(Math.random() * names.length)]);
	}

	function openMix() {
		lightPick = lights[Math.floor(Math.random() * lights.length)];
		darkPick = darks[Math.floor(Math.random() * darks.length)];
		mixMode = true;
		selected = '__mix__';
	}

	function close() {
		selected = null;
	}

	const configText = $derived.by(() => {
		if (!selected) return '';
		if (mixMode) {
			const tL = THEMES[lightPick],
				tD = THEMES[darkPick];
			return (
				`# Light + Dark mix in Ghostty\n\n` +
				`theme = light:${lightPick},dark:${darkPick}\n\n` +
				`# --- ${lightPick} (light) ---\n${configFor(lightPick, tL)}\n\n` +
				`# --- ${darkPick} (dark) ---\n${configFor(darkPick, tD)}`
			);
		}
		return configFor(selected, THEMES[selected]);
	});

	async function copyConfig() {
		await navigator.clipboard.writeText(configText);
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}
</script>

<svelte:head>
	<title>Ghostty Themes</title>
</svelte:head>

<header>
	<h1>Ghostty Themes <span class="sub">— Browse, preview, and mix</span></h1>
	<div class="controls">
		<input bind:value={query} placeholder="Search themes..." />
		<select bind:value={filter}>
			<option value="all">All</option>
			<option value="dark">Dark only</option>
			<option value="light">Light only</option>
		</select>
		<button onclick={openRandom}>Random theme</button>
		<button onclick={openMix}>Mix light + dark</button>
		<span class="count">{filtered.length} themes</span>
	</div>
</header>

<main>
	{#each visible as name (name)}
		<button class="card" onclick={() => openTheme(name)}>
			<div class="card-head">
				<span>{name}</span>
				<span class="badge" class:light={THEMES[name].isLight}>
					{THEMES[name].isLight ? 'LIGHT' : 'DARK'}
				</span>
			</div>
			<Terminal theme={THEMES[name]} />
		</button>
	{/each}
</main>

{#if selected}
	<div
		class="modal-bg"
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
		role="presentation"
	>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="modal-head">
				<h2>
					{#if mixMode}
						Mix: {lightPick} ☀ + {darkPick} ☾
					{:else}
						{selected}
					{/if}
				</h2>
				<button class="close" onclick={close}>×</button>
			</div>
			<div class="modal-body">
				{#if mixMode}
					<div class="mix-grid">
						<Terminal theme={THEMES[lightPick]} />
						<Terminal theme={THEMES[darkPick]} />
					</div>
					<div class="mix-row">
						<label>Light: <select bind:value={lightPick}>
								{#each lights as n}<option>{n}</option>{/each}
							</select></label>
						<label>Dark: <select bind:value={darkPick}>
								{#each darks as n}<option>{n}</option>{/each}
							</select></label>
					</div>
				{:else}
					<Terminal theme={THEMES[selected]} />
				{/if}
				<div class="config-head">
					<strong>Ghostty config</strong>
					<button class="copy" onclick={copyConfig}>{copied ? 'Copied!' : 'Copy'}</button>
				</div>
				<pre class="config">{configText}</pre>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(:root) {
		--bg: #0b0b0c;
		--fg: #e6e6e6;
		--muted: #888;
		--card: #131316;
		--border: #23232a;
		--accent: #7aa2f7;
	}
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--bg);
		color: var(--fg);
		font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
	}
	header {
		padding: 24px 32px;
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		background: rgba(11, 11, 12, 0.85);
		backdrop-filter: blur(12px);
		z-index: 10;
	}
	h1 {
		margin: 0 0 12px;
		font-size: 20px;
	}
	.sub {
		color: var(--muted);
		font-weight: 400;
	}
	.controls {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
	}
	input,
	select,
	button {
		background: var(--card);
		color: var(--fg);
		border: 1px solid var(--border);
		padding: 8px 12px;
		border-radius: 8px;
		font-size: 13px;
		font-family: inherit;
	}
	input {
		min-width: 240px;
	}
	button {
		cursor: pointer;
	}
	button:hover {
		border-color: var(--accent);
	}
	.count {
		color: var(--muted);
		font-size: 12px;
		margin-left: auto;
	}
	main {
		padding: 24px 32px;
		display: grid;
		gap: 20px;
		grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
	}
	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		padding: 0;
		text-align: left;
		color: inherit;
		font: inherit;
		transition: transform 0.15s, border-color 0.15s;
	}
	.card:hover {
		transform: translateY(-2px);
		border-color: var(--accent);
	}
	.card-head {
		padding: 10px 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--border);
		font-size: 13px;
		font-weight: 600;
	}
	.badge {
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 4px;
		background: #2a2a32;
		color: var(--muted);
		font-weight: 500;
	}
	.badge.light {
		background: #ffeaa7;
		color: #2d3436;
	}
	.modal-bg {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 24px;
	}
	.modal {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 14px;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		overflow: auto;
	}
	.modal-head {
		padding: 16px 20px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.modal-head h2 {
		margin: 0;
		font-size: 16px;
	}
	.close {
		background: none;
		border: none;
		color: var(--fg);
		font-size: 22px;
		padding: 0 6px;
	}
	.modal-body {
		padding: 20px;
		display: grid;
		gap: 16px;
	}
	.mix-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.mix-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	.mix-row label {
		font-size: 12px;
		color: var(--muted);
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.config-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.copy {
		font-size: 11px;
		padding: 6px 10px;
	}
	pre.config {
		background: #08080a;
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 14px;
		font-size: 12px;
		overflow: auto;
		margin: 0;
		color: #c8c8c8;
		font-family: 'SF Mono', Menlo, monospace;
	}
</style>

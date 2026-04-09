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
	let themePref = $state<'light' | 'dark' | 'system'>('system');

	function applyTheme(pref: 'light' | 'dark' | 'system') {
		const m = window.matchMedia('(prefers-color-scheme: light)').matches;
		const t = pref === 'system' ? (m ? 'light' : 'dark') : pref;
		document.documentElement.dataset.theme = t;
		document.documentElement.dataset.themePref = pref;
		localStorage.setItem('ui-theme', pref);
	}

	function setTheme(p: 'light' | 'dark' | 'system') {
		themePref = p;
		applyTheme(p);
	}

	function slider(node: HTMLElement, active: string) {
		const update = (key: string) => {
			const btn = node.querySelector<HTMLElement>(`[data-key="${key}"]`);
			if (!btn) return;
			node.style.setProperty('--pill-x', `${btn.offsetLeft}px`);
			node.style.setProperty('--pill-w', `${btn.offsetWidth}px`);
		};
		requestAnimationFrame(() => {
			update(active);
			requestAnimationFrame(() => node.classList.add('ready'));
		});
		const ro = new ResizeObserver(() => update(node.dataset.active || active));
		ro.observe(node);
		return {
			update(next: string) {
				update(next);
			},
			destroy() {
				ro.disconnect();
			}
		};
	}

	$effect(() => {
		const stored = (localStorage.getItem('ui-theme') as typeof themePref) || 'system';
		themePref = stored;
		const mq = window.matchMedia('(prefers-color-scheme: light)');
		const handler = () => themePref === 'system' && applyTheme('system');
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

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

	const PAGE = 60;
	let limit = $state(PAGE);
	const visible = $derived(filtered.slice(0, limit));

	$effect(() => {
		// reset when filter/query changes
		query;
		filter;
		limit = PAGE;
	});

	function sentinel(node: HTMLElement) {
		const io = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && limit < filtered.length) {
				limit = Math.min(limit + PAGE, filtered.length);
			}
		}, { rootMargin: '600px' });
		io.observe(node);
		return { destroy() { io.disconnect(); } };
	}

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
		setTimeout(() => (copied = false), 1400);
	}
</script>

<svelte:head>
	<title>Ghostty Themes</title>
</svelte:head>

<header>
	<div class="brand">
		<div class="title">
			<h1>Ghostty Themes</h1>
			<p>Browse, preview and mix {names.length} terminal themes.</p>
		</div>
		<div class="brand-right">
			<div class="seg theme-seg" data-active={themePref} use:slider={themePref}>
				<div class="seg-pill"></div>
				{#each ['light', 'system', 'dark'] as p}
					<button
						class="seg-btn"
						data-key={p}
						class:active={themePref === p}
						onclick={() => setTheme(p as typeof themePref)}
						aria-label={p}
					>
						{#if p === 'light'}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
						{:else if p === 'dark'}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
						{:else}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></svg>
						{/if}
					</button>
				{/each}
			</div>
			<div class="count"><span>{filtered.length}</span> themes</div>
		</div>
	</div>
	<div class="controls">
		<div class="search">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
			<input bind:value={query} placeholder="Search themes" />
		</div>
		<div class="seg" data-active={filter} use:slider={filter}>
			<div class="seg-pill"></div>
			{#each ['all', 'dark', 'light'] as f}
				<button
					class="seg-btn"
					data-key={f}
					class:active={filter === f}
					onclick={() => (filter = f as typeof filter)}
				>{f}</button>
			{/each}
		</div>
		<button class="btn" onclick={openRandom}>Random</button>
		<button class="btn primary" onclick={openMix}>Mix light + dark</button>
	</div>
</header>

<main>
	{#each visible as name, i (name)}
		<button
			class="card"
			style="--i:{Math.min(i, 24)}"
			onclick={() => openTheme(name)}
		>
			<div class="card-head">
				<span class="name">{name}</span>
				<span class="badge" class:light={THEMES[name].isLight}>
					{THEMES[name].isLight ? 'Light' : 'Dark'}
				</span>
			</div>
			<Terminal theme={THEMES[name]} />
		</button>
	{/each}
	{#if limit < filtered.length}
		<div use:sentinel class="sentinel" aria-hidden="true"></div>
	{/if}
</main>

<svelte:window onkeydown={(e) => selected && e.key === 'Escape' && close()} />

{#if selected}
	<div
		class="modal-bg"
		onclick={close}
		role="presentation"
	>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="modal-head">
				<h2>
					{#if mixMode}
						{lightPick} + {darkPick}
					{:else}
						{selected}
					{/if}
				</h2>
				<button class="close" onclick={close} aria-label="Close">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
				</button>
			</div>
			<div class="modal-body">
				{#if mixMode}
					<div class="mix-grid">
						<Terminal theme={THEMES[lightPick]} />
						<Terminal theme={THEMES[darkPick]} />
					</div>
					<div class="mix-row">
						<label>Light
							<select bind:value={lightPick}>
								{#each lights as n}<option>{n}</option>{/each}
							</select>
						</label>
						<label>Dark
							<select bind:value={darkPick}>
								{#each darks as n}<option>{n}</option>{/each}
							</select>
						</label>
					</div>
				{:else}
					<Terminal theme={THEMES[selected]} />
				{/if}
				<div class="config-head">
					<strong>Ghostty config</strong>
					<button class="copy" onclick={copyConfig}>
						{copied ? 'Copied' : 'Copy'}
					</button>
				</div>
				<pre class="config">{configText}</pre>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(:root),
	:global(html[data-theme='dark']) {
		--bg: #000;
		--fg: #fff;
		--muted: #888;
		--muted-2: #a1a1a1;
		--border: #1a1a1a;
		--border-hi: #2a2a2a;
		--card: #0a0a0a;
		--card-hi: #111;
		--pill: #1f1f1f;
		--accent: #fff;
		--accent-fg: #000;
		--accent-hover: #e5e5e5;
		--ease: cubic-bezier(0.2, 0, 0, 1);
	}
	:global(html[data-theme='light']) {
		--bg: #fafafa;
		--fg: #0a0a0a;
		--muted: #737373;
		--muted-2: #525252;
		--border: #e5e5e5;
		--border-hi: #d4d4d4;
		--card: #fff;
		--card-hi: #f5f5f5;
		--pill: #ebebeb;
		--accent: #0a0a0a;
		--accent-fg: #fff;
		--accent-hover: #262626;
	}
	:global(html),
	:global(body) {
		transition: background-color 0.2s var(--ease), color 0.2s var(--ease);
	}
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--bg);
		color: var(--fg);
		font-family: 'Geist', -apple-system, system-ui, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-feature-settings: 'ss01', 'cv11';
	}
	:global(::selection) {
		background: var(--fg);
		color: var(--bg);
	}

	header {
		padding: 32px 40px 16px;
		max-width: 1400px;
		margin: 0 auto;
	}
	.brand {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
		margin-bottom: 18px;
	}
	.title h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.035em;
		text-wrap: balance;
	}
	.title p {
		margin: 4px 0 0;
		color: var(--muted);
		font-size: 13px;
		letter-spacing: -0.01em;
	}
	.brand-right {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.count {
		font-family: 'Geist Mono', monospace;
		font-size: 12px;
		color: var(--muted);
		letter-spacing: -0.01em;
		font-variant-numeric: tabular-nums;
	}
	.count span {
		color: var(--fg);
	}

	.controls {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0 12px;
		min-width: 260px;
		flex: 1;
		max-width: 360px;
		min-height: 36px;
		transition-property: border-color, background-color;
		transition-duration: 0.15s;
		transition-timing-function: var(--ease);
	}
	.search:focus-within {
		border-color: var(--border-hi);
		background: var(--card-hi);
	}
	.search svg {
		color: var(--muted);
		flex-shrink: 0;
	}
	.search input {
		background: none;
		border: none;
		outline: none;
		color: var(--fg);
		padding: 9px 0;
		font-size: 13px;
		font-family: inherit;
		flex: 1;
		min-width: 0;
		letter-spacing: -0.01em;
	}
	.search input::placeholder {
		color: var(--muted);
	}

	.seg {
		display: flex;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 3px;
		position: relative;
	}
	.seg-pill {
		position: absolute;
		top: 3px;
		bottom: 3px;
		left: 0;
		width: var(--pill-w, 0);
		transform: translateX(var(--pill-x, 0));
		background: #2a2a2a;
		border-radius: 5px;
		box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08);
		pointer-events: none;
	}
	:global(html[data-theme='light']) .seg-pill {
		background: #fff;
		box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.06);
	}
	.seg.ready .seg-pill {
		transition: transform 0.35s var(--ease), width 0.35s var(--ease);
	}
	.theme-seg .seg-btn {
		padding: 6px 9px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.seg-btn {
		background: none;
		border: none;
		color: var(--muted-2);
		padding: 6px 12px;
		border-radius: 5px;
		font-size: 12px;
		font-family: inherit;
		text-transform: capitalize;
		cursor: pointer;
		font-weight: 500;
		min-height: 28px;
		letter-spacing: -0.01em;
		position: relative;
		z-index: 1;
		transition-property: color, background-color, scale;
		transition-duration: 0.25s;
		transition-timing-function: var(--ease);
	}
	.seg-btn:hover { color: var(--fg); }
	.seg-btn.active { color: var(--fg); }
	.seg-btn:active { scale: 0.96; }

	.btn {
		background: var(--card);
		color: var(--fg);
		border: 1px solid var(--border);
		padding: 0 14px;
		border-radius: 8px;
		font-size: 13px;
		font-family: inherit;
		font-weight: 500;
		cursor: pointer;
		min-height: 36px;
		letter-spacing: -0.01em;
		transition-property: background-color, border-color, color, scale;
		transition-duration: 0.15s;
		transition-timing-function: var(--ease);
	}
	.btn:hover {
		background: var(--card-hi);
		border-color: var(--border-hi);
	}
	.btn:active { scale: 0.96; }
	.btn.primary {
		background: var(--accent);
		color: var(--accent-fg);
		border-color: var(--accent);
	}
	.btn.primary:hover {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}

	main {
		padding: 24px 40px 96px;
		max-width: 1400px;
		margin: 0 auto;
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		align-items: start;
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
		display: flex;
		flex-direction: column;
		transition-property: border-color, background-color, transform;
		transition-duration: 0.2s;
		transition-timing-function: var(--ease);
		animation: card-in 0.5s var(--ease) both;
		animation-delay: calc(var(--i) * 24ms);
	}
	.card:hover {
		border-color: var(--border-hi);
		background: var(--card-hi);
	}
	.card:active { transform: scale(0.995); }

	.card-head {
		padding: 14px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 13px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.badge {
		font-family: 'Geist Mono', monospace;
		font-size: 10px;
		padding: 3px 7px;
		border-radius: 5px;
		background: var(--pill);
		color: var(--muted-2);
		font-weight: 500;
		border: 1px solid var(--border);
	}
	.badge.light {
		background: var(--accent);
		color: var(--accent-fg);
		border-color: var(--accent);
	}

	.modal-bg {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 24px;
		animation: fade-in 0.2s var(--ease);
	}
	.modal {
		background: var(--card);
		border: 1px solid var(--border-hi);
		border-radius: 14px;
		max-width: 880px;
		width: 100%;
		max-height: 90vh;
		overflow: auto;
		animation: modal-in 0.3s var(--ease);
	}
	.modal-head {
		padding: 18px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		background: var(--card);
		z-index: 1;
	}
	.modal-head h2 {
		margin: 0;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.015em;
	}
	.close {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--fg);
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		transition-property: background-color, border-color, scale;
		transition-duration: 0.15s;
		transition-timing-function: var(--ease);
	}
	.close:hover {
		background: var(--card-hi);
		border-color: var(--border-hi);
	}
	.close:active { scale: 0.96; }

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
		gap: 8px;
		align-items: center;
		letter-spacing: -0.01em;
	}
	.mix-row select {
		background: var(--card-hi);
		color: var(--fg);
		border: 1px solid var(--border);
		padding: 6px 10px;
		border-radius: 6px;
		font-family: 'Geist Mono', monospace;
		font-size: 11px;
	}
	.config-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.config-head strong {
		font-size: 12px;
		color: var(--muted);
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.copy {
		background: var(--card-hi);
		color: var(--fg);
		border: 1px solid var(--border);
		font-family: inherit;
		font-size: 12px;
		font-weight: 500;
		padding: 0 12px;
		border-radius: 6px;
		cursor: pointer;
		min-height: 30px;
		letter-spacing: -0.01em;
		transition-property: background-color, border-color, color, scale;
		transition-duration: 0.15s;
		transition-timing-function: var(--ease);
	}
	.copy:hover {
		background: var(--accent);
		color: var(--accent-fg);
		border-color: var(--accent);
	}
	.copy:active { scale: 0.96; }

	pre.config {
		background: #000;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 16px;
		font-size: 11.5px;
		line-height: 1.65;
		overflow: auto;
		margin: 0;
		color: #c8c8c8;
		font-family: 'Geist Mono', 'SF Mono', Menlo, monospace;
		max-height: 320px;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes card-in {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes modal-in {
		from { opacity: 0; transform: translateY(8px) scale(0.985); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	@media (max-width: 720px) {
		header { padding: 20px 16px 12px; }
		main { padding: 12px 16px 64px; grid-template-columns: 1fr; gap: 12px; }
		.brand { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
		.brand-right { width: 100%; justify-content: space-between; }
		.title h1 { font-size: 22px; }
		.title p { font-size: 12px; }
		.controls { gap: 8px; }
		.search { flex: 1 1 100%; max-width: none; min-width: 0; min-height: 40px; order: -1; }
		.search input { font-size: 16px; padding: 11px 0; }
		.seg { flex: 1 1 auto; }
		.seg-btn { padding: 8px 12px; min-height: 32px; }
		.btn { flex: 1 1 calc(50% - 4px); min-height: 40px; padding: 0 12px; }
		.card-head { padding: 12px 14px; }
		.mix-grid { grid-template-columns: 1fr; }
		.modal-bg { padding: 0; align-items: flex-end; }
		.modal { max-height: 92vh; max-width: 100%; border-radius: 14px 14px 0 0; border-bottom: none; }
		.modal-head { padding: 14px 16px; }
		.modal-body { padding: 16px; gap: 14px; }
		.mix-row { gap: 8px; }
		.mix-row label { flex: 1 1 100%; }
		.mix-row select { flex: 1; }
		pre.config { font-size: 11px; padding: 12px; max-height: 240px; }
	}
</style>

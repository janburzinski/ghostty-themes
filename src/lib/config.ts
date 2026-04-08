import type { Theme } from './types';

export function configFor(name: string, t: Theme): string {
	const lines = [`# ${name}`, `theme = ${name}`, '', '# Or inline:'];
	for (let i = 0; i < 16; i++) lines.push(`palette = ${i}=${t.palette[i]}`);
	for (const k of [
		'background',
		'foreground',
		'cursor-color',
		'cursor-text',
		'selection-background',
		'selection-foreground'
	] as const) {
		if (t[k]) lines.push(`${k} = ${t[k]}`);
	}
	return lines.join('\n');
}

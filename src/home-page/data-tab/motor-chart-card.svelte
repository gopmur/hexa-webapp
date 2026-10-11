<script lang="ts">
	import * as Chart from "$lib/components/ui/chart/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { LineChart } from "layerchart";
	import ChartLegend from "./chart-legend.svelte";
	import ChartPauseButton from "./chart-pause-button.svelte";

	type ChartPoint = { t: number } & Record<string, number>;
	type ChartSeries = { key: string; label: string; color: string };
	type Props = {
		title: string;
		data: ChartPoint[];
		series: ChartSeries[];
		unit: string;
		domain: [number, number];
		paused: boolean;
		onPauseToggle: () => void;
	};

	let { title, data, series, unit, domain, paused, onPauseToggle }: Props = $props();
	const chartConfig = {
		telemetry: { label: "Telemetry", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;
	const values = $derived.by(() => {
		const latest = data.at(-1);
		if (!latest) return undefined;
		return Object.fromEntries(
			series.map(({ key }) => {
				const value = latest[key];
				return [key, Number.isFinite(value) ? `${value.toFixed(1)}${unit}` : "N/A"];
			}),
		);
	});
</script>

<Card.Root class="flex min-h-64 min-w-0 flex-col gap-0 rounded-lg py-0">
	<header class="flex shrink-0 items-center justify-between border-b px-3 py-2">
		<h3 class="text-xs font-semibold">{title}</h3>
		<ChartPauseButton {paused} chartName={title} onclick={onPauseToggle} />
	</header>
	<ChartLegend {series} {values} />
	{#if data.length > 0}
		<Chart.Container class="min-h-0 flex-1 aspect-auto" config={chartConfig}>
			<LineChart
				{data}
				x="t"
				axis="x"
				{series}
				props={{ highlight: { points: false }, xAxis: { format: (value) => String(value / 1_000_000) } }}
				yDomain={domain}
				xDomain={[data[0].t, data[0].t + 5_000_000]}
			/>
		</Chart.Container>
	{:else}
		<p class="p-3 text-xs text-muted-foreground">Waiting for motor telemetry...</p>
	{/if}
</Card.Root>
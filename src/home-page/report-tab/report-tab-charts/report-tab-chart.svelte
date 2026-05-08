<script lang="ts">
	import { LineChart } from "layerchart";
	import { scaleUtc } from "d3-scale";
	import { curveLinear } from "d3-shape";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import type {
		GaitAnalysisPageChartRecordType,
		GaitAnalysisPageChartSeriesType,
	} from "./report-tab-chart";
	import { cn } from "$lib/utils";

	const chartConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	export let data: GaitAnalysisPageChartRecordType[];
	export let series: GaitAnalysisPageChartSeriesType[];
	let className = "";
	export { className as class };
</script>

<Chart.Container config={chartConfig} class={cn(className)}>
	<LineChart
		{data}
		x="date"
		xScale={scaleUtc()}
		axis="x"
		{series}
		props={{
			spline: { curve: curveLinear, motion: "tween", strokeWidth: 2 },
			xAxis: {
				format: (v: Date) => v.toLocaleDateString("en-US", { month: "short" }),
			},
			highlight: { points: { r: 4 } },
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip hideLabel />
		{/snippet}
	</LineChart>
</Chart.Container>

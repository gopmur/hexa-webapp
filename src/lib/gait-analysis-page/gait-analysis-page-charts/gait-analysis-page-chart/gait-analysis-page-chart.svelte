<script lang="ts">
	import { LineChart } from "layerchart";
	import { scaleUtc } from "d3-scale";
	import { curveLinear } from "d3-shape";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import type {
		GaitAnalysisPageChartRecordType,
		GaitAnalysisPageChartSeriesType,
	} from "./gait-analysis-page-chart";

	const chartConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	export let data: GaitAnalysisPageChartRecordType[];
	export let series: GaitAnalysisPageChartSeriesType[];
</script>

<Chart.Container config={chartConfig}>
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

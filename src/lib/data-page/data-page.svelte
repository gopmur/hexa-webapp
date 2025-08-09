<script lang="ts">
	import { LineChart } from "layerchart";
	import { scaleUtc } from "d3-scale";
	import { curveLinear } from "d3-shape";
	import * as Chart from "$lib/components/ui/chart/index.js";

	const chartData = [
		{ time: 1, position: 186, torque: 30 },
		{ time: 2, position: 305, torque: 30 },
		{ time: 3, position: 237, torque: 30 },
		{ time: 4, position: 73, torque: 30 },
		{ time: 5, position: 209, torque: 30 },
		{ time: 6, position: 214, torque: 30 },
	];
	const chartConfig = {
		position: { label: "Position", color: "var(--chart-1)" },
		torque: { label: "Torque", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;
</script>

<Chart.Container config={chartConfig}>
	<LineChart
		data={chartData}
		x="time"
		axis="x"
		series={[
			{
				key: "position",
				label: "Position",
				color: chartConfig.position.color,
			},
			{
				key: "torque",
				label: "Torque",
				color: chartConfig.torque.color,
			},
		]}
		props={{
			spline: { curve: curveLinear, strokeWidth: 2 },
			highlight: { points: { r: 4 } },
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip hideLabel />
		{/snippet}
	</LineChart>
</Chart.Container>

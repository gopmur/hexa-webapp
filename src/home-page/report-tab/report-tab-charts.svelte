<script lang="ts">
	import GaitAnalysisPageChart from "../report-tab/report-tab-charts/report-tab-chart.svelte";
	import type { ChartDataType } from "./report-tab-charts";

	export let data: ChartDataType[] = [];
	let className = "";
	export { className as class };

	const series = [
		[
			{
				key: "rightRom",
				label: "Right",
				color: "#0055A4",
			},
			{
				key: "leftRom",
				label: "Left",
				color: "#4CAF50",
			},
		],
		[
			{
				key: "cadence",
				label: "Cadence",
				color: "#FFC107",
			},
		],
		[
			{
				key: "rightStepLength",
				label: "Right",
				color: "#0055A4",
			},
			{
				key: "leftStepLength",
				label: "Left",
				color: "#4CAF50",
			},
		],
		[
			{
				key: "symmetry",
				label: "Symmetry",
				color: "#FFC107",
			},
		],
		[
			{
				key: "rightStrideTime",
				label: "Right",
				color: "#0055A4",
			},
			{
				key: "leftStrideTime",
				label: "Left",
				color: "#4CAF50",
			},
		],
		[
			{
				key: "rightSwingTime",
				label: "Right",
				color: "#0055A4",
			},
			{
				key: "leftSwingTime",
				label: "Left",
				color: "#4CAF50",
			},
		],
		[
			{
				key: "rightStanceTime",
				label: "Right",
				color: "#0055A4",
			},
			{
				key: "leftStanceTime",
				label: "Left",
				color: "#4CAF50",
			},
		],
	];
</script>

<div class={className}>
	{#each series as graphSeries}
		<GaitAnalysisPageChart series={graphSeries} {data} />
	{/each}
</div>

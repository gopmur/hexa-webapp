<script lang="ts">
	import GaitAnalysisPageChart from "./gait-analysis-page-chart/gait-analysis-page-chart.svelte";
	import type { ChartDataType } from "./gait-analysis-page-charts";

	export let data: ChartDataType[];

	const romSeries = [
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
	];

	// const 
</script>

<div>
	<GaitAnalysisPageChart series={romSeries} {data} />
</div>

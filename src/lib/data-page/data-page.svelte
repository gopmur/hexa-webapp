<script lang="ts">
	import { LineChart } from "layerchart";
	import { curveLinear } from "d3-shape";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import Button from "$lib/components/ui/button/button.svelte";
	import { onMount } from "svelte";

	const chartConfig = {
		position: { label: "Position", color: "var(--chart-1)" },
		torque: { label: "Torque", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	const onPrintButtonClick = () => {
		print();
	};
</script>

<div>

</div>

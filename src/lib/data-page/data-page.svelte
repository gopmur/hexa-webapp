<script lang="ts">
	import { LineChart } from "layerchart";
	import { curveLinear } from "d3-shape";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { data } from "./data";
	import Button from "$lib/components/ui/button/button.svelte";
	import { onMount } from "svelte";

	const chartConfig = {
		position: { label: "Position", color: "var(--chart-1)" },
		torque: { label: "Torque", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	let myData = []

	onMount(() => {
		myData = []
		setTimeout(() => (myData = data), 2000);
	});

	const onPrintButtonClick = () => {
		print();
	};
</script>

<div>
	<div class="p-10" id="print-section">
		<Chart.Container config={chartConfig} class="max-h-1/2">
			<LineChart
				data={myData}
				x="callback_time"
				axis="x"
				series={[
					{
						key: "SMCmr_pos",
						label: "Position",
						color: chartConfig.position.color,
					},
				]}
				yDomain={[-100, 100]}
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
	</div>
	<Button class="mx-10" onclick={onPrintButtonClick}>print</Button>
</div>

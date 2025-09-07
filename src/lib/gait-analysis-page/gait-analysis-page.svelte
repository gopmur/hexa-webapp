<script lang="ts">
	import { data } from "./data.json";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Button } from "$lib/components/ui/button/index";
	import { LineChart } from "layerchart";
	import { scaleUtc } from "d3-scale";
	import { curveLinear } from "d3-shape";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import type { ChartDataType, SummaryType } from "./gait-analysis-page.types";
	import {
		analysisSingleSession,
		makeTableData,
	} from "./gait-analysis-page.helper";
	import type { TableRowType } from "./gait-analysis-page-table/gait-analysis-page-table.type";
	import GaitAnalysisTable from "./gait-analysis-page-table/gait-analysis-page-table.svelte";

	let progress = 0;
	let loading = false;
	let dataAvailable = false;

	const summary: SummaryType[] = [];
	let chartData: ChartDataType[] = [];

	let tableData: TableRowType[] = [];

	const onPrintClick = async () => {
		loading = true;
		dataAvailable = false;
		const progressChunk = (1 / data.length) * 100;
		progress = 0;
		for (const sessionData of data) {
			const sessionSummary = analysisSingleSession(
				sessionData,
				0.9,
				new Date(sessionData.Date),
			);
			if (sessionSummary) {
				summary.push(sessionSummary);
			}
			progress += progressChunk;
		}
		tableData = makeTableData(summary);
		progress = 100;
		dataAvailable = true;
		loading = false;
	};

	const chartConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;
</script>

<div>
	<Button onclick={onPrintClick}>Print Data</Button>
	{#if dataAvailable && !loading}
		<GaitAnalysisTable data={tableData} />
		<div class="w-1/2">
			<Chart.Container config={chartConfig}>
				<LineChart
					data={chartData}
					x="Date"
					xScale={scaleUtc()}
					axis="x"
					series={[
						{
							key: "Cadence",
							label: "Cadence",
							color: chartConfig.desktop.color,
						},
					]}
					props={{
						spline: { curve: curveLinear, motion: "tween", strokeWidth: 2 },
						xAxis: {
							format: (v: Date) =>
								v.toLocaleDateString("en-US", { month: "short" }),
						},
						highlight: { points: { r: 4 } },
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</LineChart>
			</Chart.Container>
		</div>
	{:else if loading}
		<Progress value={progress} />
	{/if}
</div>

<script lang="ts">
	import { data } from "./data.json";
	import { Button } from "$lib/components/ui/button/index";

	import type { SummaryType } from "./gait-analysis-page";
	import {
		analyzeSessions,
		makeChartData,
		makeTableData,
	} from "./gait-analysis-page.functions";
	import type { TableRowType } from "./gait-analysis-page-table/gait-analysis-page-table.type";
	import GaitAnalysisTable from "./gait-analysis-page-table/gait-analysis-page-table.svelte";
	import GaitAnalysisPageCharts from "./gait-analysis-page-charts/gait-analysis-page-charts.svelte";
	import type { ChartDataType } from "./gait-analysis-page-charts/gait-analysis-page-charts";

	let loading = false;
	let dataAvailable = false;

	let summary: SummaryType[] = [];
	let chartData: ChartDataType[] = [];
	let tableData: TableRowType[] = [];

	const onPrintClick = async () => {
		loading = true;
		dataAvailable = false;
		summary = analyzeSessions(data, 0.9);
		tableData = makeTableData(summary);
		chartData = makeChartData(summary);
		dataAvailable = true;
		loading = false;
	};
</script>

<div class="p-4 gap-4 flex flex-col">
	<div class="flex gap-4">
		<Button onclick={onPrintClick}>Analyze Data</Button>
		<Button onclick={() => print()}>Download PDF</Button>
	</div>
	{#if dataAvailable && !loading}
		<div id="print-section">
			<div class="overflow-x-auto">
				<GaitAnalysisTable data={tableData} />
			</div>
			<GaitAnalysisPageCharts data={chartData} />
		</div>
	{/if}
</div>

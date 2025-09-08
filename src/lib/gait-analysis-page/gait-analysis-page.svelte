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

<div class="max-w">
	<Button onclick={onPrintClick}>Print Data</Button>
	{#if dataAvailable && !loading}
	<div class="p-10 overflow-clip">
				<GaitAnalysisTable data={tableData} />
			<GaitAnalysisPageCharts data={chartData} />
		</div>
	{/if}
</div>

<script lang="ts">
	// import { data } from "./data.json";
	import { Button } from "$lib/components/ui/button/index";
	import type { GaitData, SummaryType } from "./report-tab";
	import {
		analyzeSessions,
		makeChartData,
		makeTableData,
	} from "./report-tab.functions";
	import type { TableRowType } from "./report-tab/report-tab-table";
	import GaitAnalysisTable from "./report-tab/report-tab-table.svelte";
	import ReportTabCharts from "./report-tab/report-tab-table.svelte";
	import type { ChartDataType } from "./report-tab/report-tab-charts";
	let data: GaitData[] = [];
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
			<ReportTabCharts data={chartData} />
		</div>
	{/if}
</div>

<!-- <script lang="ts">
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
</div> -->

<script lang="ts">
	import { API_ADDRESS } from "$src/config";
	import { onMount } from "svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		FileIcon,
		FolderIcon,
	} from "lucide-svelte";
	import { Button } from "$lib/components/ui/button";
	import Separator from "$lib/components/ui/separator/separator.svelte";

	type PwdResponseData = {
		pwd: string;
	};

	type EntryType = "file" | "folder";

	type Entry = {
		name: string;
		type: EntryType;
	};

	type LsResponse = {
		entries: Array<Entry>;
	};

	let workingDirectory = $state("/");
	let entries: Array<Entry> = $state([]);
	let backHistory: Array<string> = $state([]);
	let isTouchDevice = $state(false);
	let columns = $state(1);

	const getFileManagerStates = async () => {
		const pwdResponse = await fetch(`${API_ADDRESS}/api/file-manager/pwd`);
		const pwdResponseData: PwdResponseData = await pwdResponse.json();
		const lsResponse = await fetch(`${API_ADDRESS}/api/file-manager/ls`);
		const lsResponseData: LsResponse = await lsResponse.json();
		workingDirectory = pwdResponseData.pwd;
		entries = lsResponseData.entries;
		entries.sort((a, b) => (a.name == b.name ? 0 : a.name < b.name ? -1 : 1));
		entries.sort((a, b) =>
			a.type == b.type ? 0 : a.type == "folder" ? -1 : 1,
		);
	};

	const updateColumns = () => {
		columns = Math.floor(window.innerWidth / 150);
	};

	onMount(() => {
		getFileManagerStates();
		isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
		updateColumns();
		window.addEventListener("resize", updateColumns);
		return () => window.removeEventListener("resize", updateColumns);
	});

	const cd = async (path: string) => {
		await fetch(`${API_ADDRESS}/api/file-manager/cd`, {
			method: "PUT",
			body: JSON.stringify({
				path: `${path}`,
			}),
		});
	};

	const onFolderClicked = (folderName: string) => {
		return async () => {
			backHistory = [];
			cd(`${workingDirectory}${folderName}/`);
			await getFileManagerStates();
		};
	};

	const onBackClicked = async () => {
		backHistory.push(workingDirectory);
		const newWorkingDirectory =
			workingDirectory.split("/").slice(0, -2).join("/") + "/";
		await cd(newWorkingDirectory);
		await getFileManagerStates();
	};

	const onForwardClicked = async () => {
		const newWorkingDirectory = backHistory.pop();
		if (newWorkingDirectory == null || newWorkingDirectory == undefined) {
			return;
		}
		await cd(newWorkingDirectory);
		await getFileManagerStates();
	};
</script>

<div class="h-full overflow-hidden flex flex-col">
	<div class="w-full flex gap-2 p-4">
		<Button size="icon-lg" variant="outline" onclick={onBackClicked}>
			<ChevronLeftIcon />
		</Button>
		<Button
			size="icon-lg"
			variant="outline"
			disabled={backHistory.length == 0}
			onclick={onForwardClicked}
		>
			<ChevronRightIcon />
		</Button>
	</div>
	<div
		class="sm:grid sm:gap-10 w-full max-h-full overflow-auto px-6 pb-4 flex-col"
		style={`grid-template-columns: repeat(${columns}, minmax(0, 1fr));`}
	>
		{#each entries as entry, i (`${entry.name}${entry.type}`)}
			<div class="flex items-center justify-center">
				<Button
					class="sm:h-30 h-18 sm:aspect-square w-full flex sm:flex-col items-center sm:justify-between sm:gap-0 gap-2 justify-start p-2 m-0"
					variant="ghost"
					ondblclick={!isTouchDevice && entry.type == "folder"
						? onFolderClicked(entry.name)
						: undefined}
					onclick={isTouchDevice && entry.type == "folder"
						? onFolderClicked(entry.name)
						: undefined}
				>
					{#if entry.type == "folder"}
						<FolderIcon class="sm:size-20 size-12" strokeWidth={0.6} />
					{:else}
						<FileIcon class="sm:size-20 size-12" strokeWidth={0.6} />
					{/if}
					{entry.name}
				</Button>
			</div>
			{#if i != entries.length - 1}
				<Separator class="sm:hidden" />
			{/if}
		{/each}
	</div>
</div>

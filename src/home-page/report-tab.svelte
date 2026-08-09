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
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		FileIcon,
		FolderIcon,
	} from "lucide-svelte";
	import { Button } from "$lib/components/ui/button";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import BreadcrumbItem from "$lib/components/ui/breadcrumb/breadcrumb-item.svelte";

	type EntryType = "file" | "folder";

	type Entry = {
		name: string;
		type: EntryType;
	};

	type LsResponse = {
		entries: Array<Entry>;
	};

	type BreadcrumbItem = {
		folderName: string;
		path: string;
	};

	let workingDirectory = $state("/");
	let entries: Array<Entry> = $state([]);
	let redoHistory: Array<string> = $state([]);
	let undoHistory: Array<string> = $state([]);
	let isTouchDevice = $state(false);
	let columns = $state(1);
	let breadcrumbItems: Array<BreadcrumbItem> = $state([
		{
			path: "/",
			folderName: "/",
		},
	]);

	const getFileManagerStates = async () => {
		const lsResponse = await fetch(
			`${API_ADDRESS}/api/file-manager/ls${workingDirectory.slice(0, -1)}`,
		);
		const lsResponseData: LsResponse = await lsResponse.json();
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
		let breadcrumbPath = "";
		breadcrumbItems = [];
		let breadcrumbFolderNames = ["/", ...path.split("/").slice(1, -1)];
		for (const folderName of breadcrumbFolderNames) {
			if (breadcrumbPath == "") {
				breadcrumbPath += folderName;
			} else {
				breadcrumbPath += folderName + "/";
			}
			breadcrumbItems.push({
				folderName: folderName,
				path: breadcrumbPath,
			});
		}
		console.log(breadcrumbItems);
		workingDirectory = path;
	};

	const onFolderClicked = (folderName: string) => {
		return async () => {
			redoHistory = [];
			undoHistory.push(workingDirectory);
			cd(`${workingDirectory}${folderName}/`);
			await getFileManagerStates();
		};
	};

	const onBackClicked = async () => {
		redoHistory.push(workingDirectory);
		const newWorkingDirectory = undoHistory.pop();
		if (newWorkingDirectory == undefined) {
			return;
		}
		await cd(newWorkingDirectory);
		await getFileManagerStates();
	};

	const onForwardClicked = async () => {
		undoHistory.push(workingDirectory);
		const newWorkingDirectory = redoHistory.pop();
		if (newWorkingDirectory == null || newWorkingDirectory == undefined) {
			return;
		}
		await cd(newWorkingDirectory);
		await getFileManagerStates();
	};

	const onBreadcrumbItemClicked = (path: string) => {
		return async () => {
			undoHistory.push(workingDirectory);
			redoHistory = []
			await cd(path);
			await getFileManagerStates();
		};
	};
</script>

<div class="h-full overflow-hidden flex flex-col">
	<div class="w-full flex justify-start items-center">
		<div class="flex gap-2 p-4">
			<Button
				size="icon-lg"
				variant="outline"
				disabled={undoHistory.length == 0}
				onclick={onBackClicked}
			>
				<ChevronLeftIcon />
			</Button>
			<Button
				size="icon-lg"
				variant="outline"
				disabled={redoHistory.length == 0}
				onclick={onForwardClicked}
			>
				<ChevronRightIcon />
			</Button>
		</div>
		<Breadcrumb.Root>
			<Breadcrumb.List>
				{#each breadcrumbItems as breadcrumbItem (breadcrumbItem.path)}
					<Breadcrumb.Item>
						<Breadcrumb.Link
							class="cursor-pointer"
							onclick={onBreadcrumbItemClicked(breadcrumbItem.path)}
							>{breadcrumbItem.folderName}</Breadcrumb.Link
						>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
				{/each}
			</Breadcrumb.List>
		</Breadcrumb.Root>
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

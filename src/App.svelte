<script lang="ts">
	import Header from "$src/header/header.svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ChartIcon from "@lucide/svelte/icons/chart-spline";
	import UserRoundCogIcon from "@lucide/svelte/icons/user-round-cog";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import GaitAnalysisPage from "$src/gait-analysis-page/gait-analysis-page.svelte";
	import SettingsPage from "./settings-page/settings-page.svelte";
	import DataPage from "./data-page/data-page.svelte";
	import { API_ADDRESS, WS_API_ADDRESS } from "./config";

	let readDataStream = false;
	let settingsPage = true;

	const onTabChange = (tab: string) => {
		readDataStream = tab == "data";
	};

	const ws = new WebSocket(`${WS_API_ADDRESS}/api/data`);
</script>

<main class="h-dvh w-screen flex flex-col">
	<Header />
	<Tabs.Root
		value="settings"
		class="flex-1 flex flex-col overflow-y-hidden gap-0"
		onValueChange={onTabChange}
	>
		<Tabs.Content value="settings" class="flex-1 overflow-scroll">
			<SettingsPage {ws} />
		</Tabs.Content>
		<Tabs.Content value="data" class="flex-1 overflow-scroll">
			<DataPage {readDataStream} {ws} />
		</Tabs.Content>
		<Tabs.Content value="patients" class="flex-1 overflow-scroll"
		></Tabs.Content>
		<Tabs.Content value="report" class="flex-1 overflow-scroll">
			<GaitAnalysisPage />
		</Tabs.Content>

		<Tabs.List class="w-full rounded-none min-h-20">
			<Tabs.Trigger class="flex flex-col" value="settings">
				<SettingsIcon class="size-6" /> Settings
			</Tabs.Trigger>
			<Tabs.Trigger class="flex flex-col" value="data">
				<ChartIcon class="size-6" /> Data
			</Tabs.Trigger>
			<Tabs.Trigger class="flex flex-col" value="patients">
				<UserRoundCogIcon class="size-6" /> Patients
			</Tabs.Trigger>
			<Tabs.Trigger class="flex flex-col" value="report">
				<FileTextIcon class="size-6" /> Report
			</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>
</main>

<style>
</style>

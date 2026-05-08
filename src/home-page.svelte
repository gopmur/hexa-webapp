<script lang="ts">
	import Header from "$src/header/header.svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ChartIcon from "@lucide/svelte/icons/chart-spline";
	import UserRoundCogIcon from "@lucide/svelte/icons/user-round-cog";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import GaitAnalysisPage from "$src/gait-analysis-page/gait-analysis-page.svelte";
	import SettingsPage from "./control-tab/settings-page.svelte";
	import DataPage from "./data-page/data-page.svelte";
	import { API_ADDRESS, WS_API_ADDRESS } from "./config";

	let readDataStream = false;
	let settingsPage = true;

	const onTabChange = (tab: string) => {
		readDataStream = tab == "data";
	};

	const ws = new WebSocket(`${WS_API_ADDRESS}/api/data`);
</script>

<Tabs.Root
	value="settings"
	class="flex flex-col h-full gap-0 overflow-hidden"
	onValueChange={onTabChange}
>
	<Tabs.Content value="settings" class="overflow-hidden">
		<SettingsPage {ws} />
	</Tabs.Content>
	<Tabs.Content value="data" class="overflow-hidden">
		<DataPage {readDataStream} {ws} />
	</Tabs.Content>
	<Tabs.Content value="patients" class="overflow-hidden"></Tabs.Content>
	<Tabs.Content value="report" class="overflow-hidden">
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

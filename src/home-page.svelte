<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ChartIcon from "@lucide/svelte/icons/chart-spline";
	import UserRoundCogIcon from "@lucide/svelte/icons/user-round-cog";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ReportTab from "$src/home-page/report-tab.svelte";
	import ControlTab from "./home-page/control-tab.svelte";
	import DataTab from "./home-page/data-tab.svelte";
	import { WS_API_ADDRESS } from "./config";
	import { JoystickIcon } from "lucide-svelte";
	import { onMount } from "svelte";
	import { getWebSocket } from "./context/ws";
	import PatientsTab from "./home-page/patients-tab.svelte";

	let tab = $state<"settings" | "data" | "patients" | "report">("settings");

	const onTabChange = (newTab: string) => {
		void newTab;
	};
</script>

<Tabs.Root
	bind:value={tab}
	class="flex flex-col h-full gap-0 overflow-hidden"
	onValueChange={onTabChange}
>
	<Tabs.Content value="settings" class="overflow-hidden">
		<ControlTab />
	</Tabs.Content>
	<Tabs.Content value="data" class="overflow-hidden">
		<DataTab />
	</Tabs.Content>
	<Tabs.Content value="patients" class="overflow-hidden">
		<PatientsTab />
	</Tabs.Content>
	<Tabs.Content value="report" class="overflow-hidden">
		<ReportTab />
	</Tabs.Content>
	<Tabs.List class="w-full rounded-none min-h-20">
		<Tabs.Trigger class="flex flex-col" value="settings">
			<JoystickIcon class="size-6" /> Control
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

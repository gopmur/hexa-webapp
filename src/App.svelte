<script lang="ts">
	import Header from "$lib/header/header.svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ChartIcon from "@lucide/svelte/icons/chart-spline";
	import UserRoundCogIcon from "@lucide/svelte/icons/user-round-cog";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import DataPage from "$lib/gait-analysis-page/gait-analysis-page.svelte";
</script>

<main class="h-dvh w-screen flex flex-col">
	<Header />
	<Tabs.Root value="settings" class="flex-1 flex flex-col overflow-hidden gap-0">
		<Tabs.Content value="settings"
		>a</Tabs.Content>
		<Tabs.Content value="data" class="flex-1 overflow-scroll">
			<div class="flex-1">
				<DataPage />
			</div>
		</Tabs.Content>
		<Tabs.Content value="patients" class="h-full">
			<div class="h-full"></div>
		</Tabs.Content>
		<Tabs.Content value="report" class="h-full">
			<div class="h-full"></div>
		</Tabs.Content>

		<!-- Tabs list stays fixed at bottom -->
		<Tabs.List class="w-full rounded-none h-20">
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

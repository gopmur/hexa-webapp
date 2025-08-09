<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import Header from "$lib/components/header/header.svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ChartIcon from "@lucide/svelte/icons/chart-spline";
	import UserRoundCogIcon from "@lucide/svelte/icons/user-round-cog";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
</script>

<main class="h-dvh w-screen">
	<div class="flex flex-col h-full w-full justify-between">
		<Header />
		<Tabs.Root value="settings" class="w-screen h-full">
			<Tabs.Content value="settings" class="h-full"
				><div class="h-full"></div></Tabs.Content
			>
			<Tabs.Content value="data"><div class="h-full"></div></Tabs.Content>
			<Tabs.Content value="patients"><div class="h-full"></div></Tabs.Content>
			<Tabs.Content value="report"><div class="h-full"></div></Tabs.Content>
			<Tabs.List class="w-full rounded-none h-20">
				<Tabs.Trigger class="flex flex-col" value="settings"><SettingsIcon class="size-6" /> Settings</Tabs.Trigger>
				<Tabs.Trigger class="flex flex-col" value="data"><ChartIcon class="size-6" /> Data</Tabs.Trigger>
				<Tabs.Trigger class="flex flex-col" value="patients"
					><UserRoundCogIcon class="size-6" /> Patients</Tabs.Trigger
				>
				<Tabs.Trigger class="flex flex-col" value="report"><FileTextIcon class="size-6" /> Report</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>
</main>

<style>
</style>

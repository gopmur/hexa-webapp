<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Tabs from "$lib/components/ui/tabs";
</script>

<main class="h-screen w-screen">
	<div class="flex flex-col h-full w-full justify-between">
		<div class="h-10"></div>
		<Tabs.Root value="settings" class="w-screen h-full">
			<Tabs.Content value="settings" class="h-full"><div class="h-full">alam</div></Tabs.Content>
			<Tabs.Content value="data"><div class="h-full"></div></Tabs.Content>
			<Tabs.Content value="patients"><div class="h-full"></div></Tabs.Content>
			<Tabs.Content value="report"><div class="h-full"></div></Tabs.Content>
			<Tabs.List class="w-full rounded-none h-20">
				<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				<Tabs.Trigger value="data">Data</Tabs.Trigger>
				<Tabs.Trigger value="patients">Patients</Tabs.Trigger>
				<Tabs.Trigger value="report">Report</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>
</main>

<style>
</style>

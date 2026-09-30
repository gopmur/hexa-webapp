<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs";
	import ChartIcon from "@lucide/svelte/icons/chart-spline";
	import UserRoundCogIcon from "@lucide/svelte/icons/user-round-cog";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import Button from "$lib/components/ui/button/button.svelte";
	import ReportTab from "$src/home-page/report-tab.svelte";
	import ControlTab from "./home-page/control-tab.svelte";
	import DataTab from "./home-page/data-tab.svelte";
	import { JoystickIcon } from "lucide-svelte";
	import { onMount } from "svelte";
	import PatientsTab from "./home-page/patients-tab.svelte";

	let tab = $state<"settings" | "data" | "patients" | "report">("settings");
	let wideTab = $state<"dashboard" | "patients" | "report">("dashboard");
	let isWideViewport = $state(false);

	onMount(() => {
		const mediaQuery = window.matchMedia("(min-width: 1280px)");
		const updateViewport = () => (isWideViewport = mediaQuery.matches);
		updateViewport();
		mediaQuery.addEventListener("change", updateViewport);
		return () => mediaQuery.removeEventListener("change", updateViewport);
	});
</script>

{#if isWideViewport}
	<Tabs.Root bind:value={wideTab} class="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
		<header class="flex shrink-0 items-center gap-8 border-b px-6 py-3">
			<div class="min-w-48">
				<div class="text-[10px] font-semibold uppercase text-muted-foreground">HEXA / ROBOTICS</div>
				<div class="text-sm font-semibold">Operations deck</div>
			</div>
			<Tabs.List class="ml-auto h-10 rounded-md bg-muted p-1">
				<Tabs.Trigger value="dashboard" class="flex items-center gap-2 px-4">
					<JoystickIcon class="size-4" /> Dashboard
				</Tabs.Trigger>
				<Tabs.Trigger value="patients" class="flex items-center gap-2 px-4">
					<UserRoundCogIcon class="size-4" /> Patients
				</Tabs.Trigger>
				<Tabs.Trigger value="report" class="flex items-center gap-2 px-4">
					<FileTextIcon class="size-4" /> Reports
				</Tabs.Trigger>
			</Tabs.List>
		</header>
		<Tabs.Content
			value="dashboard"
			class="grid min-h-0 flex-1 grid-cols-[minmax(22rem,0.8fr)_minmax(0,1.7fr)] overflow-hidden"
		>
			<section class="flex min-h-0 min-w-0 flex-col border-r">
				<div class="shrink-0 border-b px-5 py-3">
					<div class="text-[10px] font-semibold uppercase text-muted-foreground">01 / command</div>
					<h1 class="text-base font-semibold">Robot control</h1>
				</div>
				<div class="min-h-0 flex-1 overflow-hidden"><ControlTab /></div>
			</section>
			<section class="flex min-h-0 min-w-0 flex-col">
				<div class="shrink-0 border-b px-5 py-3">
					<div class="text-[10px] font-semibold uppercase text-muted-foreground">02 / telemetry</div>
					<h2 class="text-base font-semibold">Live feedback</h2>
				</div>
				<div class="min-h-0 flex-1 overflow-hidden p-3"><DataTab dashboard={true} /></div>
			</section>
		</Tabs.Content>
		<Tabs.Content value="patients" class="min-h-0 flex-1 overflow-auto p-4">
			<PatientsTab />
		</Tabs.Content>
		<Tabs.Content value="report" class="min-h-0 flex-1 overflow-hidden p-4">
			<ReportTab />
		</Tabs.Content>
	</Tabs.Root>
{:else}
	<Tabs.Root bind:value={tab} class="flex h-full flex-col gap-0 overflow-hidden">
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
		<Tabs.List class="w-full min-h-20 rounded-none">
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
{/if}

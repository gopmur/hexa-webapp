<script lang="ts">
	import ThermometerIcon from "@lucide/svelte/icons/thermometer";
	import PowerIcon from "@lucide/svelte/icons/power";
	import Wifi from "@lucide/svelte/icons/wifi";
	import WifiHigh from "@lucide/svelte/icons/wifi-high";
	import WifiLow from "@lucide/svelte/icons/wifi-low";
	import WifiZero from "@lucide/svelte/icons/wifi-zero";
	import BatteryFull from "@lucide/svelte/icons/battery-full";
	import UserRoundIcon from "@lucide/svelte/icons/user-round";
	import { Button } from "$lib/components/ui/button";
	import { API_ADDRESS } from "$src/config";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";

	type WifiScanResponseType = Record<string, { rssi: number }>;

	let wifis: WifiScanResponseType = {};
	let pendingWifiScans = 0;

	const onRestartClicked = async () => {
		await fetch(`${API_ADDRESS}/api/restart`);
		window.location.reload();
	};

	const onWifiButtonClicked = async () => {
		pendingWifiScans++;
		const response = await fetch(`${API_ADDRESS}/api/wifi/scan`);
		wifis = await response.json();		
		pendingWifiScans--;
	};
</script>

<header class="bg-accent w-full p-4">
	<Dialog.Root>
		<Dialog.Content class="min-h-2/3 max-h-2/3 flex flex-col">
			<Dialog.Header>
				{#if pendingWifiScans}
					<Spinner />
				{/if}
			</Dialog.Header>
			<div class="flex flex-col items-center gap-2 max-h-full h-full w-full overflow-y-scroll">
				{#each Object.keys(wifis) as wifi_name (wifi_name)}
					<Button class="w-4/5 flex justify-start" variant="outline">
						{#if wifis[wifi_name].rssi > -50}
							<Wifi />
						{:else if wifis[wifi_name].rssi > -70}
							<WifiHigh />
						{:else if wifis[wifi_name].rssi > -80}
							<WifiLow />
						{:else}
							<WifiZero />
						{/if}
						{wifi_name}</Button
					>
				{/each}
			</div>
		</Dialog.Content>
		<div class="flex justify-between items-center">
			<div
				class="w-fit h-fit rounded-full border-2 border-black flex justify-center items-center aspect-square"
			>
				<UserRoundIcon class="size-6" />
			</div>
			<div class="flex gap-4">
				<Dialog.Trigger onclick={onWifiButtonClicked}>
					<Button variant="default" size="icon"><Wifi class="size-6" /></Button>
				</Dialog.Trigger>
				<Button variant="default" size="icon" onclick={onRestartClicked}
					><PowerIcon class="size-6" /></Button
				>
				<Button variant="default" size="icon"
					><BatteryFull class="size-6" /></Button
				>
				<Button variant="default" size="icon"
					><ThermometerIcon class="size-6" /></Button
				>
			</div>
		</div>
	</Dialog.Root>
</header>

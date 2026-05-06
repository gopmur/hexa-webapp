<script lang="ts">
	import ThermometerIcon from "@lucide/svelte/icons/thermometer";
	import PowerIcon from "@lucide/svelte/icons/power";
	import Wifi from "@lucide/svelte/icons/wifi";
	import WifiHigh from "@lucide/svelte/icons/wifi-high";
	import WifiLow from "@lucide/svelte/icons/wifi-low";
	import WifiZero from "@lucide/svelte/icons/wifi-zero";
	import WifiOff from "@lucide/svelte/icons/wifi-off";
	import RotateCw from "@lucide/svelte/icons/rotate-cw";
	import Lock from "@lucide/svelte/icons/lock";
	import BatteryFull from "@lucide/svelte/icons/battery-full";
	import UserRoundIcon from "@lucide/svelte/icons/user-round";
	import { Button, Root } from "$lib/components/ui/button";
	import { API_ADDRESS } from "$src/config";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { onMount } from "svelte";
	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import { Input } from "$lib/components/ui/input/index.js";

	type WifiScanRecordType = {
		rssi: number;
		ssid: string;
		bssid: string;
		open: boolean;
	};

	type ConnectedWifiResponseType =
		| {
				ssid: string;
				rssi: number;
				bssid: string;
				connected: true;
		  }
		| {
				connected: false;
				message: string;
		  };

	let wifis: WifiScanRecordType[] = [];
	let pendingWifiScan = false;
	let wifiStatusLoading = true;
	let wifiConnected = false;
	let connectedWifiRssi = 0;
	let connectedWifiSsid = "";
	let connectedWifiBssid = "";
	let wifiPasswordInput = "";
	let wifiSsidToConnect = "";

	const restart = async () => {
		await fetch(`${API_ADDRESS}/api/restart`);
		window.location.reload();
	};
	const restartEsp = async () => {
		await fetch(`${API_ADDRESS}/api/restart/esp`);
		window.location.reload();
	};
	const restartStm = async () => {
		await fetch(`${API_ADDRESS}/api/restart/stm`);
		window.location.reload();
	};

	const scanWifi = async () => {
		if (pendingWifiScan) {
			return;
		}
		pendingWifiScan = true;
		fetch(`${API_ADDRESS}/api/null`);
		const scanResponse = await fetch(`${API_ADDRESS}/api/wifi/scan`);
		getWifiStatus();
		wifis = await scanResponse.json();
		wifis.sort((a, b) => b.rssi - a.rssi);
		pendingWifiScan = false;
	};

	const getWifiStatus = async () => {
		wifiStatusLoading = true;

		const response = await fetch(`${API_ADDRESS}/api/wifi`);
		const connected_wifi: ConnectedWifiResponseType = await response.json();

		if (connected_wifi.connected) {
			connectedWifiRssi = connected_wifi.rssi;
			connectedWifiSsid = connected_wifi.ssid;
			connectedWifiBssid = connected_wifi.bssid;
			wifiConnected = true;
		} else {
			wifiConnected = false;
		}

		if (connected_wifi) wifiStatusLoading = false;
	};

	const onSelectedWifiChange = (wifiBssid: string) => {
		wifiSsidToConnect =
			wifis.find((wifi) => wifi.bssid == wifiBssid)?.ssid || "";
	};

	const connectToWifi = async () => {
		await fetch(`${API_ADDRESS}/api/wifi/connect`, {
			method: "POST",
			body: JSON.stringify({
				ssid: wifiSsidToConnect,
				password: wifiPasswordInput,
			}),
		});
	};

	onMount(() => {
		getWifiStatus();
		const interval = setInterval(getWifiStatus, 5000);

		return () => clearInterval(interval);
	});
</script>

<header class="bg-accent w-full p-4">
	<div class="flex justify-between items-center">
		<div
			class="w-fit h-fit rounded-full border-2 border-black flex justify-center items-center aspect-square"
		>
			<UserRoundIcon class="size-6" />
		</div>
		<div class="flex gap-4">
			<Dialog.Root>
				<Dialog.Content class="min-h-2/3 max-h-2/3 flex flex-col p-0">
					<Dialog.Header class="mt-6 mx-6">
						<Dialog.Title>WIFI</Dialog.Title>
						<Dialog.Description>
							<Button class="flex gap-2" onclick={scanWifi}>
								Scan
								{#if pendingWifiScan}
									<Spinner />
								{/if}
							</Button>
						</Dialog.Description>
					</Dialog.Header>
					{#if wifis.length > 0}
						<div
							class="flex flex-col items-center gap-2 mx-w-full overflow-y-scroll mb-6 box-border"
						>
							<div class="w-full px-6">
								<Accordion.Root
									type="single"
									class="w-full overflow-hidden"
									onValueChange={onSelectedWifiChange}
								>
									{#each wifis as wifi (wifi)}
										<Accordion.Item value={wifi.bssid}>
											<Accordion.Trigger enableIcon={false}
												><div class="flex gap-2">
													{#if wifi.rssi > -50}
														<Wifi />
													{:else if wifi.rssi > -70}
														<WifiHigh />
													{:else if wifi.rssi > -80}
														<WifiLow />
													{:else}
														<WifiZero />
													{/if}
													{wifi.ssid}
												</div>
												<div>
													{#if !wifi.open}
														<Lock />
													{/if}
												</div></Accordion.Trigger
											>
											<Accordion.Content
												class="flex flex-row gap-4 text-balance pt-1"
											>
												<Input
													type="password"
													placeholder="Password"
													bind:value={wifiPasswordInput}
												/>
												<Button onclick={connectToWifi}>Connect</Button>
											</Accordion.Content>
										</Accordion.Item>
									{/each}
								</Accordion.Root>
							</div>
						</div>
					{/if}
				</Dialog.Content>
				<Dialog.Trigger onclick={scanWifi}>
					<Button variant="default" size="icon">
						{#if !wifiConnected}
							<WifiOff class="size-6" />
						{:else if connectedWifiRssi > -50}
							<Wifi class="size-6" />
						{:else if connectedWifiRssi > -70}
							<WifiHigh class="size-6" />
						{:else if connectedWifiRssi > -80}
							<WifiLow class="size-6" />
						{:else}
							<WifiZero class="size-6" />
						{/if}</Button
					>
				</Dialog.Trigger>
			</Dialog.Root>
			<Dialog.Root>
				<Dialog.Content class="flex flex-col">
					<Dialog.Header>
						<Dialog.Title>Power</Dialog.Title>
						<!-- <Dialog.Description class="px-8">
							
						</Dialog.Description> -->
					</Dialog.Header>
					<Button onclick={restart}>
						<RotateCw />
						Restart
					</Button>
					<Button onclick={restartEsp}><RotateCw />Restart ESP32</Button>
					<Button onclick={restartStm}><RotateCw />Restart STM32</Button>
				</Dialog.Content>
				<Dialog.Trigger>
					<Button variant="default" size="icon">
						<PowerIcon class="size-6" />
					</Button>
				</Dialog.Trigger>
			</Dialog.Root>
			<Button variant="default" size="icon">
				<BatteryFull class="size-6" />
			</Button>
			<Button variant="default" size="icon">
				<ThermometerIcon class="size-6" />
			</Button>
		</div>
	</div>
</header>

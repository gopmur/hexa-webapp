<script lang="ts">
	import ThermometerIcon from "@lucide/svelte/icons/thermometer";
	import PowerIcon from "@lucide/svelte/icons/power";
	import Wifi from "@lucide/svelte/icons/wifi";
	import WifiHigh from "@lucide/svelte/icons/wifi-high";
	import WifiLow from "@lucide/svelte/icons/wifi-low";
	import WifiZero from "@lucide/svelte/icons/wifi-zero";
	import WifiOff from "@lucide/svelte/icons/wifi-off";
	import RotateCw from "@lucide/svelte/icons/rotate-cw";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import EyeClosedIcon from "@lucide/svelte/icons/eye-closed";
	import BatteryFull from "@lucide/svelte/icons/battery-full";
	import { Button } from "$lib/components/ui/button";
	import { API_ADDRESS } from "$src/config";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { onMount } from "svelte";
	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { HouseIcon, LockIcon, SettingsIcon } from "lucide-svelte";
	import type { HTMLTdAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";
	import { settings } from "./context/settings";

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

	let wifis: WifiScanRecordType[] = $state([]);
	let pendingWifiScan = $state(false);
	let wifiStatusLoading = true;
	let wifiConnected = $state(false);
	let connectedWifiRssi = $state(0);
	let connectedWifiSsid = $state("");
	let connectedWifiBssid = "";
	let wifiPasswordInput = $state("");
	let wifiSsidToConnect = "";
	let wifiConnectionError = $state(false);
	let wifiConnectionPending = $state(false);
	let passwordHidden = $state(true);

	const restart = async () => {
		await fetch(`${API_ADDRESS}/api/system/restart`);
		window.location.reload();
	};
	const restartEsp = async () => {
		await fetch(`${API_ADDRESS}/api/system/restart`);
		window.location.reload();
	};
	const restartStm = async () => {
		await fetch(`${API_ADDRESS}/api/system/restart`);
		window.location.reload();
	};

	const scanWifi = async () => {
		if (pendingWifiScan) {
			return;
		}
		pendingWifiScan = true;
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
		wifiConnectionError = false;
		wifiPasswordInput = "";
		wifiSsidToConnect =
			wifis.find((wifi) => wifi.bssid == wifiBssid)?.ssid || "";
	};

	const connectToWifi = async () => {
		wifiConnectionPending = true;
		const response = await fetch(`${API_ADDRESS}/api/wifi/connect`, {
			method: "PUT",
			body: JSON.stringify({
				ssid: wifiSsidToConnect,
				password: wifiPasswordInput,
			}),
		});
		if (!response.ok) {
			wifiConnectionError = true;
		} else {
			wifiConnectionError = false;
			await getWifiStatus();
		}
		wifiConnectionPending = false;
	};

	const onPasswordVisiblityClick = () => {
		passwordHidden = !passwordHidden;
	};

	const onDisconnectWifiClick = async () => {
		await fetch(`${API_ADDRESS}/api/wifi/disconnect`);
		await getWifiStatus();
	};

	onMount(() => {
		getWifiStatus();
		const interval = setInterval(getWifiStatus, 5000);

		return () => clearInterval(interval);
	});

	// ! This is dumb
	let { class: classname }: HTMLTdAttributes = $props();
</script>

<header class={cn("bg-accent w-full p-4", classname)}>
	<div class="flex justify-between items-center">
		<div class="flex">
			<Button variant="outline" size="icon-lg" href="/">
				<HouseIcon />
			</Button>
		</div>
		<div class="flex gap-4">
			<Dialog.Root>
				<Dialog.Content class="min-h-2/3 max-h-2/3 flex flex-col p-0">
					<Dialog.Header class="mt-6 mx-6">
						<Dialog.Title class="text-center">WIFI</Dialog.Title>
						<Dialog.Description>
							<Button
								class="flex gap-2"
								onclick={scanWifi}
								variant="secondary"
								disabled={pendingWifiScan}
							>
								{#if pendingWifiScan}
									<Spinner />
								{:else}
									Scan
								{/if}
							</Button>
						</Dialog.Description>
					</Dialog.Header>
					{#if wifis.length > 0}
						<div
							class="flex flex-col items-center gap-2 mx-w-full mb-6 box-border overflow-scroll"
						>
							{#if wifiConnected}
								<div class="w-full px-6 flex flex-col gap-2">
									<p class="ml-2">Connected WiFis</p>
									<Accordion.Root type="single" class="w-full overflow-hidden">
										<Accordion.Item value={connectedWifiSsid}>
											<Accordion.Trigger enableIcon={false}
												><div class="flex gap-2">
													{#if connectedWifiRssi > -50}
														<Wifi />
													{:else if connectedWifiRssi > -70}
														<WifiHigh />
													{:else if connectedWifiRssi > -80}
														<WifiLow />
													{:else}
														<WifiZero />
													{/if}
													{connectedWifiSsid}
												</div>
											</Accordion.Trigger>
											<Accordion.Content class="flex flex-col gap-4 pt-1 px-1">
												<Button
													onclick={onDisconnectWifiClick}
													variant="destructive"
												>
													Disconnect
												</Button>
											</Accordion.Content>
										</Accordion.Item>
									</Accordion.Root>
								</div>
							{/if}
							<div class="w-full px-6 flex flex-col gap-2">
								<p class="ml-2">Scanned WiFis</p>
								<Accordion.Root
									type="single"
									class="w-full overflow-hidden"
									onValueChange={onSelectedWifiChange}
								>
									{#each wifis.filter((wifi) => !wifiConnected || wifi.bssid != connectedWifiBssid) as wifi (wifi)}
										<Accordion.Item value={wifi.bssid}>
											<Accordion.Trigger
												enableIcon={false}
												disabled={wifiConnectionPending}
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
														<LockIcon class="size-sm" />
													{/if}
												</div></Accordion.Trigger
											>
											<Accordion.Content class="flex flex-col gap-4 pt-1 px-1">
												<div>
													{#if wifiConnectionError}
														<p class="text-destructive">Failed to connect!</p>
													{/if}
												</div>
												<div class="flex flex-row gap-4">
													<Button
														onclick={onPasswordVisiblityClick}
														variant="ghost"
													>
														{#if passwordHidden}
															<EyeClosedIcon />
														{:else}
															<EyeIcon />
														{/if}
													</Button>
													<Input
														type={passwordHidden ? "password" : "text"}
														placeholder="Password"
														bind:value={wifiPasswordInput}
													/>
													<Button
														onclick={connectToWifi}
														disabled={wifiConnectionPending}
													>
														{#if wifiConnectionPending}
															<Spinner />
														{:else}
															Connect
														{/if}
													</Button>
												</div>
											</Accordion.Content>
										</Accordion.Item>
									{/each}
								</Accordion.Root>
							</div>
						</div>
					{/if}
				</Dialog.Content>
				<Dialog.Trigger onclick={scanWifi}>
					<Button variant="outline" size="icon-lg">
						{#if !wifiConnected}
							<WifiOff />
						{:else if connectedWifiRssi > -50}
							<Wifi />
						{:else if connectedWifiRssi > -70}
							<WifiHigh />
						{:else if connectedWifiRssi > -80}
							<WifiLow />
						{:else}
							<WifiZero />
						{/if}</Button
					>
				</Dialog.Trigger>
			</Dialog.Root>
			<Dialog.Root>
				<Dialog.Content class="flex flex-col">
					<Dialog.Header>
						<Dialog.Title>Power</Dialog.Title>
					</Dialog.Header>
					<Button variant="secondary" onclick={restart}>
						<RotateCw />
						Restart
					</Button>
					{#if $settings.advanced}
						<Button variant="secondary" onclick={restartEsp}
							><RotateCw />Restart ESP32</Button
						>
						<Button variant="secondary" onclick={restartStm}
							><RotateCw />Restart STM32</Button
						>
					{/if}
				</Dialog.Content>
				<Dialog.Trigger>
					<Button variant="outline" size="icon-lg">
						<PowerIcon />
					</Button>
				</Dialog.Trigger>
			</Dialog.Root>
			<Button variant="outline" size="icon-lg">
				<BatteryFull />
			</Button>
			<Button href="#/settings" variant="outline" size="icon-lg">
				<SettingsIcon />
			</Button>
		</div>
	</div>
</header>

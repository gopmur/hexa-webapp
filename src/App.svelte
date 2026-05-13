<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import HomePage from "./home-page.svelte";
	import Router from "svelte-spa-router";
	import SettingsPage from "./settings-page.svelte";
	import TopBar from "./top-bar.svelte";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import { API_ADDRESS, WS_API_ADDRESS } from "./config";
	import { setWebSocket } from "./context/ws";
	import { onMount } from "svelte";

	const routes = {
		"/": HomePage,
		"/settings": SettingsPage,
	};

	const ws = new WebSocket(`${WS_API_ADDRESS}/api/data`);
	
	onMount(() => {
		setWebSocket(ws);
		fetch(`${API_ADDRESS}/api/streams/stop/imu`);
		fetch(`${API_ADDRESS}/api/streams/stop/stm_cpu_usage`);
		fetch(`${API_ADDRESS}/api/streams/stop/esp_cpu_usage`);
		fetch(`${API_ADDRESS}/api/streams/stop/motor`);
	});
</script>

<main class="h-dvh w-full overflow-hidden">
	<Toaster position="top-center" richColors={true} closeButton={true} />
	<ModeWatcher />
	<div class="h-full w-screen flex flex-col overflow-hidden">
		<TopBar />
		<div class="flex flex-col flex-1 overflow-hidden">
			<Router {routes} />
		</div>
	</div>
</main>

<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import HomePage from "./home-page.svelte";
	import Router from "svelte-spa-router";
	import SettingsPage from "./settings-page.svelte";
	import TopBar from "./top-bar.svelte";
	import { Toaster } from "$lib/components/ui/sonner/index.js";

	const routes = {
		"/": HomePage,
		"/settings": SettingsPage,
	};
</script>

<main class="h-dvh w-full overflow-hidden">
	<Toaster position="top-center" richColors={true} closeButton={true}/>
	<ModeWatcher />
	<div class="h-full w-screen flex flex-col overflow-hidden">
		<TopBar />
		<div class="flex flex-col flex-1 overflow-hidden">
			<Router {routes} />
		</div>
	</div>
</main>

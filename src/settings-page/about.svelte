<script lang="ts">
	import { ArrowBigDownDashIcon } from "lucide-svelte";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import Button from "$lib/components/ui/button/button.svelte";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import { API_ADDRESS } from "../config";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { getWebSocket } from "../context/ws";

	let checkForUpdatesPending = $state(false);
	let apiUpdateAvailable = $state(false);
	let coreUpdateAvailable = $state(false);
	let updatesAvailable = $state(false);
	let updatePending = $state(false);
	let apiVersion = $state("");
	let coreVersion = $state("");
	let latestApiVersion: null | string = $state(null);
	let latestCoreVersion: null | string = $state(null);
	let otaProgress = $state(0);
	let otaProgressTotal = $state(Infinity);

	const getVersion = async () => {
		try {
			const response = await fetch(`${API_ADDRESS}/api/version`);
			if (!response.ok) {
				return;
			}
			const response_json: VersionResponseType = await response.json();
			apiVersion = response_json.api;
			coreVersion = response_json.core;
		} catch {
			apiVersion = "n/a";
			coreVersion = "n/a";
		}
	};

	const getUpdateStatus = async () => {
		try {
			const response = await fetch(`${API_ADDRESS}/api/update/status`);
			if (!response.ok) {
				return;
			}
			const response_json: UpdateStatusResponseType = await response.json();
			const busy = response_json.busy;
			updatePending = busy;
		} catch {
			updatePending = false;
		}
	};

	const onCheckForUpdatesClicked = async () => {
		try {
			checkForUpdatesPending = true;
			const response = await fetch(`${API_ADDRESS}/api/update/check`);
			if (!response.ok) {
				checkForUpdatesPending = false;
				return;
			}
			const response_json: LatestVersionResponseType = await response.json();
			latestApiVersion = response_json.api;
			latestCoreVersion = response_json.core;
			checkForUpdatesPending = false;
			apiUpdateAvailable = latestApiVersion > apiVersion;
			coreUpdateAvailable = latestCoreVersion > coreVersion;
			updatesAvailable = coreUpdateAvailable || apiUpdateAvailable;
		} catch {
			checkForUpdatesPending = false;
		}
	};

	const onUpdateClicked = async () => {
		try {
			updatePending = true;
			apiUpdateAvailable = false;
			coreUpdateAvailable = false;
			updatesAvailable = false;
			const response = await fetch(`${API_ADDRESS}/api/update`, {
				method: "PUT",
				body: JSON.stringify({
					api: latestApiVersion,
					core: latestCoreVersion,
				}),
			});
			if (!response.ok) {
				updatePending = false;
			}
		} catch {
			updatePending = false;
		}
	};

	const ws = getWebSocket();

	onMount(() => {
		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			otaProgressTotal = data?.ota_progress?.total ?? 1;
			otaProgress = data?.ota_progress?.progress ?? 0;
			if (data?.ota?.ok === true) {
				updatePending = false;
				toast.success("Update was successful. Restart to apply the update");
			} else if (data?.ota?.ok === false) {
				updatePending = false;
				toast.error("Update failed :(");
			}
		};
		getUpdateStatus();
		getVersion();
	});
</script>

<Card.Root class="bg-background">
	<Card.Content class="flex flex-col gap-2">
		<div class="flex gap-2 text-sm justify-between">
			<span> API version </span>
			<span>
				{apiVersion}
			</span>
		</div>
		<Separator />
		<div class="flex gap-2 text-sm justify-between">
			<span> Core version </span>
			<span>
				{coreVersion}
			</span>
		</div>
	</Card.Content>
</Card.Root>
<div class="flex flex-col gap-1">
	<div class="px-2 text-warning">
		{#if apiUpdateAvailable}
			<span>
				New update for API (v{latestApiVersion}) available.
			</span>
		{/if}
		{#if coreUpdateAvailable}
			<span>
				New update for core (v{latestCoreVersion}) available.
			</span>
		{/if}
		{#if updatePending}
			<div class="flex flex-col">
				<Progress min={0} max={otaProgressTotal} value={otaProgress} />
			</div>
		{/if}
	</div>

	<Button
		onclick={updatesAvailable ? onUpdateClicked : onCheckForUpdatesClicked}
		disabled={checkForUpdatesPending || updatePending}
	>
		{#if checkForUpdatesPending}
			Checking for updates
			<Spinner />
		{:else if updatesAvailable}
			Update<ArrowBigDownDashIcon />
		{:else if updatePending}
			Updating <Spinner />
		{:else}
			Check for updates
		{/if}
	</Button>
</div>

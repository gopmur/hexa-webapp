<script lang="ts">
	import { ArrowBigDownDashIcon } from "lucide-svelte";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import Button from "$lib/components/ui/button/button.svelte";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import { API_ADDRESS, WS_API_ADDRESS } from "../config";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";

	let checkForUpdatesPending = $state(false);
	let updatesAvailable = $state(false);
	let updatePending = $state(false);
	let currentVersion = $state("");
	let latestVersion: null | string = $state(null);
	let otaProgress = $state(0);
	let otaProgressTotal = $state(1);
	const compareVersions = (left: string, right: string) => {
		const leftParts = left.replace(/^v/i, "").split(".").map(Number);
		const rightParts = right.replace(/^v/i, "").split(".").map(Number);

		for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index++) {
			const leftPart = leftParts[index] ?? 0;
			const rightPart = rightParts[index] ?? 0;
			if (!Number.isFinite(leftPart) || !Number.isFinite(rightPart)) return 0;
			if (leftPart !== rightPart) return leftPart - rightPart;
		}
		return 0;
	};

	const getVersion = async () => {
		try {
			const response = await fetch(`${API_ADDRESS}/api/system/version`);
			if (!response.ok) {
				return;
			}
			const response_json: VersionResponseType = await response.json();
			currentVersion = response_json.version;
		} catch {
			currentVersion = "n/a";
		}
	};

	const getUpdateStatus = async () => {
		try {
			const response = await fetch(`${API_ADDRESS}/api/system/update/status`);
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
			const response = await fetch(`${API_ADDRESS}/api/system/update/check`);
			if (!response.ok) {
				checkForUpdatesPending = false;
				return;
			}
			const responseJson = await response.json()
			latestVersion = `v${(await responseJson.version).trim()}`;
			checkForUpdatesPending = false;
			console.log(compareVersions(latestVersion, currentVersion))
			console.log(latestVersion, currentVersion)
			updatesAvailable = compareVersions(latestVersion, currentVersion) > 0;
		} catch {
			checkForUpdatesPending = false;
		}
	};

	const onUpdateClicked = async () => {
		try {
			updatePending = true;
			updatesAvailable = false;
			const response = await fetch(`${API_ADDRESS}/api/system/update`, {
				method: "PUT",
				body: JSON.stringify({ version: latestVersion }),
			});
			if (!response.ok) {
				updatePending = false;
			}
		} catch {
			updatePending = false;
		}
	};

	onMount(() => {
		const ws = new WebSocket(`${WS_API_ADDRESS}/api/stream/ota`);
		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (
				typeof data?.total === "number" &&
				typeof data?.progress === "number" &&
				data.total > 0
			) {
				otaProgressTotal = data.total;
				otaProgress = Math.min(Math.max(data.progress, 0), data.total);
			}
			if (data?.ok === true) {
				updatePending = false;
				toast.success("Update was successful. Restart to apply the update");
			} else if (data?.ok === false) {
				updatePending = false;
				toast.error("Update failed :(");
			}
		};
		getUpdateStatus();
		getVersion();
		return () => ws.close();
	});
</script>

<Card.Root class="bg-background">
	<Card.Content class="flex flex-col gap-2">
		<div class="flex gap-2 text-sm justify-between">
			<span> Firmware version </span>
			<span>
				{currentVersion}
			</span>
		</div>
	</Card.Content>
</Card.Root>
<div class="flex flex-col gap-1">
	<div class="px-2 text-warning">
		{#if updatesAvailable}
			<span>
				New firmware update ({latestVersion}) available.
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

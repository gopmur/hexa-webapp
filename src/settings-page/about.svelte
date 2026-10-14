<script lang="ts">
	import { ArrowBigDownDashIcon } from "lucide-svelte";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import Button from "$lib/components/ui/button/button.svelte";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import { API_ADDRESS, WS_API_ADDRESS } from "../config";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";

	let checkForUpdatesPending = $state(false);
	let updatesAvailable = $state(false);
	let updatePending = $state(false);
	let versionInfo: VersionResponseType | null = $state(null);
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
			versionInfo = response_json;
		} catch {
			versionInfo = {
				version: "n/a",
				idfVersion: "n/a",
				buildDate: "n/a",
			};
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
				let message = `Update check failed (${response.status})`;
				const errorBody = (await response.text()).trim();
				if (errorBody) {
					try {
						const parsed: unknown = JSON.parse(errorBody);
						if (
							typeof parsed === "object" &&
							parsed !== null &&
							"message" in parsed &&
							typeof parsed.message === "string"
						) {
							message = parsed.message;
						} else {
							message = errorBody.slice(0, 180);
						}
					} catch {
						message = errorBody.slice(0, 180);
					}
				}
				toast.error(message);
				return;
			}
			const responseJson = await response.json();
			latestVersion = `v${responseJson.version.trim()}`;
			updatesAvailable =
				compareVersions(latestVersion, versionInfo?.version ?? "n/a") > 0;
		} catch {
			toast.error("Could not reach the update server. Check the connection and try again.");
		} finally {
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
				let message = `Update request failed (${response.status})`;
				try {
					const errorBody: unknown = await response.json();
					if (
						typeof errorBody === "object" &&
						errorBody !== null &&
						"message" in errorBody &&
						typeof errorBody.message === "string"
					) {
						message = errorBody.message;
					}
				} catch {
					// Keep the status-based message when the response isn't JSON.
				}
				toast.error(message);
			}
		} catch {
			updatePending = false;
			toast.error("Could not reach the device to start the update. Check the connection and try again.");
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
			}
		};
		getUpdateStatus();
		getVersion();
		return () => ws.close();
	});
</script>

	<dl class="grid grid-cols-1 divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
		<div class="py-3 sm:px-4 sm:first:pl-0">
			<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Firmware version
			</dt>
			<dd class="mt-1 wrap-break-word text-sm font-semibold">{versionInfo?.version ?? "Loading..."}</dd>
		</div>
		<div class="py-3 sm:px-4">
			<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				ESP-IDF version
			</dt>
			<dd class="mt-1 wrap-break-word text-sm font-semibold">{versionInfo?.idfVersion ?? "Loading..."}</dd>
		</div>
		<div class="py-3 sm:px-4 sm:last:pr-0">
			<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Build date
			</dt>
			<dd class="mt-1 wrap-break-word text-sm font-semibold">{versionInfo?.buildDate ?? "Loading..."}</dd>
		</div>
	</dl>

	<div class="space-y-3">
		<div class="space-y-2 text-sm text-warning">
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
			class="w-full sm:w-fit"
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

<script lang="ts">
	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import { ArrowBigDownDashIcon, InfoIcon, PaletteIcon } from "lucide-svelte";
	import { API_ADDRESS } from "./config";
	import { onMount } from "svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import Button from "$lib/components/ui/button/button.svelte";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import { toast } from "svelte-sonner";
	import * as Select from "$lib/components/ui/select/index.js";
	import { resetMode, setMode, mode } from "mode-watcher";

	let checkForUpdatesPending = $state(false);
	let apiUpdateAvailable = $state(false);
	let coreUpdateAvailable = $state(false);
	let updatesAvailable = $state(false);
	let updatePending = $state(false);
	let apiVersion = $state("");
	let coreVersion = $state("");
	let latestApiVersion: null | string = $state(null);
	let latestCoreVersion: null | string = $state(null);

	const themeList = [
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
		{ value: "system", label: "System" },
	];

	let theme = $state(mode.current);

	const onThemeChange = (theme: string) => {
		if (theme == "light" || theme == "dark") {
			setMode(theme);
		}
		else {
			resetMode();
		}
	}

	const triggerContent = $derived(
		themeList.find((th) => th.value === theme)?.label ?? "Theme",
	);

	const getVersion = async () => {
		const response = await fetch(`${API_ADDRESS}/api/version`);
		const response_json: VersionResponseType = await response.json();
		apiVersion = response_json.api;
		coreVersion = response_json.core;
	};

	const onCheckForUpdatesClicked = async () => {
		checkForUpdatesPending = true;
		const response = await fetch(`${API_ADDRESS}/api/update/check`);
		const response_json: LatestVersionResponseType = await response.json();
		latestApiVersion = response_json.api;
		latestCoreVersion = response_json.core;
		checkForUpdatesPending = false;
		apiUpdateAvailable = latestApiVersion > apiVersion;
		coreUpdateAvailable = latestCoreVersion > coreVersion;
		updatesAvailable = coreUpdateAvailable || apiUpdateAvailable;
	};

	const onUpdateClicked = async () => {
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
		if (response.ok) {
			toast.success("Update was successful. Restart to apply the update");
		} else {
			toast.error("Update failed :(");
		}
		updatePending = false;
	};

	onMount(() => {
		getVersion();
	});
</script>

<div>
	<Accordion.Root type="single" class="w-full rounded-none">
		<Accordion.Item value="about">
			<Accordion.Trigger class="flex items-center px-6">
				<InfoIcon />
				<span class="text-lg">About</span>
			</Accordion.Trigger>
			<Accordion.Content
				class="flex flex-col gap-4 text-balance pt-4 px-6 pb-6"
			>
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
					<div class="pl-2 text-warning">
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
					</div>
					<Button
						onclick={updatesAvailable
							? onUpdateClicked
							: onCheckForUpdatesClicked}
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
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="appearance">
			<Accordion.Trigger class="flex items-center px-6">
				<PaletteIcon />
				<span class="text-lg">Appearance</span>
			</Accordion.Trigger>
			<Accordion.Content
				class="flex flex-col gap-4 text-balance pt-4 px-6 pb-6"
			>
				<div class="flex flex-row gap-4 items-center">
					<span>
						Theme
					</span>
					<Select.Root type="single" name="theme" bind:value={theme} onValueChange={onThemeChange}>
						<Select.Trigger class="w-full">
							{triggerContent}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each themeList as themes (themes.value)}
									<Select.Item value={themes.value} label={themes.label}>
										{themes.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>

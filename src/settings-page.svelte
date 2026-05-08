<script lang="ts">
	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import { ArrowBigDownDashIcon, InfoIcon, PaletteIcon } from "lucide-svelte";
	import { API_ADDRESS } from "./config";
	import { onMount } from "svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import Button from "$lib/components/ui/button/button.svelte";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";

	let checkForUpdatesPending = $state(false);
	let apiUpdateAvailable = $state(false);
	let coreUpdateAvailable = $state(false);
	let updatesAvailable = $state(false);
	let apiVersion = $state("");
	let coreVersion = $state("");
	let latestApiVersion: null | string = $state(null);
	let latestCoreVersion: null | string = $state(null);

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

	onMount(() => {
		getVersion();
	});
</script>

<div>
	<Accordion.Root type="multiple" class="w-full rounded-none" value={["about"]}>
		<Accordion.Item value="about">
			<Accordion.Trigger class="flex items-center">
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
						onclick={onCheckForUpdatesClicked}
						disabled={checkForUpdatesPending}
					>
						{#if checkForUpdatesPending}
							Checking for updates
							<Spinner />
						{:else if updatesAvailable}
							<ArrowBigDownDashIcon/> Update
						{:else}
							Check for updates
						{/if}
					</Button>
				</div>
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="appearance">
			<Accordion.Trigger class="flex items-center">
				<PaletteIcon />
				<span class="text-lg">Appearance</span>
			</Accordion.Trigger>
			<Accordion.Content class="flex flex-col gap-4 text-balance">
				<p>
					We offer worldwide shipping through trusted courier partners. Standard
					delivery takes 3-5 business days, while express shipping ensures
					delivery within 1-2 business days.
				</p>
				<p>
					All orders are carefully packaged and fully insured. Track your
					shipment in real-time through our dedicated tracking portal.
				</p>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>

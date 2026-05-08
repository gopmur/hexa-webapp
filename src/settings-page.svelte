<script lang="ts">
	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import { ChevronRightIcon, InfoIcon, PaletteIcon } from "lucide-svelte";
	import { API_ADDRESS } from "./config";
	import { onMount } from "svelte";
	import * as Card from "$lib/components/ui/card/index.js";

	type ApiVersionResponseType = {
		version: string;
	};

	let apiVersion = "0.0.0";

	const getVersion = async () => {
		const response = await fetch(`${API_ADDRESS}/api/version`);
		const response_json: ApiVersionResponseType = await response.json();
		apiVersion = response_json.version;
	};

	onMount(() => {
		getVersion();
	});
</script>

<div class="p-6 flex flex-col gap-4">
	<Card.Root>
		<Card.Content class="flex justify-between">
			<div class="flex gap-2">
				<InfoIcon />
				<span class="text-lg">About</span>
			</div>
			<ChevronRightIcon />
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Content class="flex gap-2">
			<PaletteIcon />
			<span class="text-lg">Appearance</span>
		</Card.Content>
	</Card.Root>
</div>

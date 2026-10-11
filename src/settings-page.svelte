<script lang="ts">
	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import { InfoIcon, PaletteIcon } from "lucide-svelte";
	import About from "./settings-page/about.svelte";
	import Appearance from "./settings-page/appearance.svelte";
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
				<About />
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
				<Appearance />
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>

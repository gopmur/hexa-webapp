<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { Pause, Play } from "lucide-svelte";

	let {
		paused,
		chartName,
		onclick,
	}: {
		paused: boolean;
		chartName: string;
		onclick: () => void;
	} = $props();

	const actionLabel = $derived(`${paused ? "Resume" : "Pause"} ${chartName} plot`);
</script>

<Button
	variant="ghost"
	size="icon-sm"
	aria-label={actionLabel}
	aria-pressed={paused}
	title={actionLabel}
	{onclick}
>
	{#if paused}
		<Play />
	{:else}
		<Pause />
	{/if}
</Button>
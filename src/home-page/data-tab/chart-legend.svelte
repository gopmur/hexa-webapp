<script lang="ts">
	let { series, values }: ChartLegendProps = $props();
</script>

<div class="flex flex-col gap-1">
	{#each series as s}
		<div class="flex items-center gap-2">
			<div
				class="aspect-square w-3 rounded-sm"
				style="background-color: {s.color};"
			></div>
			{#if values}
				<span>{s.label} : {values[s.key]}</span>
			{:else}
				<span>{s.label}</span>
			{/if}
		</div>
	{/each}
</div>

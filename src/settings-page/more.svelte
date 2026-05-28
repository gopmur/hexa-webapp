<script lang="ts">
	import Switch from "$lib/components/ui/switch/switch.svelte";
	import { settings } from "$src/context/settings";

	const onAdvancedModeToggle = (val: boolean) => {
		settings.update((s) => ({
      ...s,
			advanced: val,
		}));
	};
</script>

<div class="flex flex-row gap-4 items-center">
	<span> Advance Mode </span>
	<Switch onCheckedChange={onAdvancedModeToggle} checked={$settings.advanced} />
</div>

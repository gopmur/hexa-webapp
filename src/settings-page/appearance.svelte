<script lang="ts">
	import * as Select from "$lib/components/ui/select/index.js";
	import { resetMode, setMode, mode } from "mode-watcher";
  

	const themeList = [
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
		{ value: "system", label: "System" },
	];

	let theme = $state(mode.current);

	const onThemeChange = (theme: string) => {
		if (theme == "light" || theme == "dark") {
			setMode(theme);
		} else {
			resetMode();
		}
	};

	const triggerContent = $derived(
		themeList.find((th) => th.value === theme)?.label ?? "Theme",
	);
</script>

<div class="flex flex-row gap-4 items-center">
	<span> Theme </span>
	<Select.Root
		type="single"
		name="theme"
		bind:value={theme}
		onValueChange={onThemeChange}
	>
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

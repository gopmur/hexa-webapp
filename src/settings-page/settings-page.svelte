<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { PowerIcon } from "lucide-svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import Slider from "$lib/components/ui/slider/slider.svelte";
	import { debounce } from "$lib/utils";

	let rightSliderValue = 50;
	let leftSliderValue = 50;
	let running = false;

	const getRunningFromApi = async () => {
		const response = await fetch("/api/running");
		const responseData = await response.json();
		console.log(responseData);
	};

	getRunningFromApi();

	const loadStates = async () => {};

	const onPowerClick = async () => {
		running = !running;
		if (running) await fetch("/api/start", { method: "PUT" });
		else await fetch("/api/stop", { method: "PUT" });
	};

	const onModeChange = async (value: string) => {
		await fetch(`/api/set-mode/${value}`, { method: "PUT" });
	};

	const onLeftSliderValueChange = async (value: number) => {
		await fetch("api/left_torque", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				torque: value,
			}),
		});
	};
	const onRightSliderValueChange = async (value: number) => {
		await fetch("api/right_torque", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				torque: value,
			}),
		});
	};
</script>

<div class="w-full h-full flex flex-col items-center">
	<Tabs.Root value="manual" class="w-full" onValueChange={onModeChange}>
		<Tabs.List class="w-full rounded-none h-20">
			<Tabs.Trigger class="flex flex-col" value="manual">Manual</Tabs.Trigger>
			<Tabs.Trigger class="flex flex-col" value="automatic"
				>Automatic</Tabs.Trigger
			>
			<Tabs.Trigger class="flex flex-col" value="semi-automatic">
				Sem-Automatic
			</Tabs.Trigger>
			<Tabs.Trigger class="flex flex-col" value="smart">Smart</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="manual">
			<div class="w-full flex justify-center">
				<div class="flex justify-between w-40 pt-5">
					<Slider
						type="single"
						bind:value={leftSliderValue}
						max={100}
						step={1}
						orientation="vertical"
						class="max-w-[70%]"
						onValueChange={debounce(onLeftSliderValueChange, 100)}
					/>
					<Slider
						type="single"
						bind:value={rightSliderValue}
						max={100}
						step={1}
						orientation="vertical"
						class="max-w-[70%]"
						onValueChange={debounce(onRightSliderValueChange, 100)}
					/>
				</div>
			</div>
		</Tabs.Content>
	</Tabs.Root>
	<div class="w-full h-full flex flex-col items-center justify-center">
		<Button
			onclick={onPowerClick}
			class={`rounded-full h-40 w-40 active:transition-all active:scale-[0.98] ${running ? "bg-green-400" : "bg-red-500"}`}
			><PowerIcon class="size-20" /></Button
		>
	</div>
</div>

<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { PowerIcon } from "lucide-svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import Slider from "$lib/components/ui/slider/slider.svelte";
	import { debounce, sleep } from "$lib/utils";
	import { API_ADDRESS, WS_API_ADDRESS } from "$src/config";

	let rightSliderValue = 50;
	let leftSliderValue = 50;
	let running = false;
	let loading = true;
	let mode: RunningMode = "manual";

	type RunningMode = "manual" | "automatic" | "semi-automatic" | "smart";

	type ManualStates = {
		running: boolean;
		rightTorque: number;
		leftTorque: number;
		mode: RunningMode;
	};

	const getStatesFromApi = async () => {
		const response = await fetch(`${API_ADDRESS}/api/states`);
		const responseData = await response.json();
		return responseData as ManualStates;
	};

	const setRtc = async () => {
		const date = new Date(Date.now());
		const req_body = {
			time: {
				hours: date.getHours(),
				minutes: date.getMinutes(),
				seconds: date.getSeconds(),
			},
			date: {
				year: date.getFullYear(),
				month: date.getMonth(),
				day: date.getDate(),
			},
		};
		await fetch(`${API_ADDRESS}/api/date-time`, {
			method: "PUT",
			body: JSON.stringify(req_body),
		});
	};

	let initialized = false;

	const loadStates = async () => {
		loading = true;
		while (true) {
			try {
				const states = await getStatesFromApi();
				running = states.running;
				rightSliderValue = states.rightTorque;
				leftSliderValue = states.leftTorque;
				mode = states.mode;
				break;
			} catch {
				await sleep(1000);
			}
		}
		setTimeout(() => {
			initialized = true;
		}, 200);
		loading = false;
	};

	loadStates();
	setRtc();

	const debouncedLeftUpdate = debounce((value: number) => {
		if (!initialized) return;
		onLeftSliderValueChange(value);
	}, 100);

	const debouncedRightUpdate = debounce((value: number) => {
		if (!initialized) return;
		onRightSliderValueChange(value);
	}, 100);

	const onPowerClick = async () => {
		running = !running;
		if (running) await fetch(`${API_ADDRESS}/api/start`, { method: "PUT" });
		else await fetch(`${API_ADDRESS}/api/stop`, { method: "PUT" });
	};

	const onModeChange = async (value: string) => {
		await fetch(`${API_ADDRESS}/api/set-mode/${value}`, { method: "PUT" });
	};

	const onLeftSliderValueChange = async (value: number) => {
		await fetch(`${API_ADDRESS}/api/left_torque`, {
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
		await fetch(`${API_ADDRESS}/api/right_torque`, {
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
	{#if !loading}
		<Tabs.Root value={mode} class="w-full" onValueChange={onModeChange}>
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
							onValueChange={debouncedLeftUpdate}
						/>
						<Slider
							type="single"
							bind:value={rightSliderValue}
							max={100}
							step={1}
							orientation="vertical"
							class="max-w-[70%]"
							onValueChange={debouncedRightUpdate}
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
	{/if}
</div>

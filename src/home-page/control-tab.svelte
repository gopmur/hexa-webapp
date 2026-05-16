<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { PowerIcon } from "lucide-svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import Slider from "$lib/components/ui/slider/slider.svelte";
	import { debounce, sleep } from "$lib/utils";
	import { API_ADDRESS, WS_API_ADDRESS } from "$src/config";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import { onMount } from "svelte";
	import { getWebSocket } from "$src/context/ws";
	import * as Card from "$lib/components/ui/card/index.js";

	let rightSliderValue = $state(50);
	let leftSliderValue = $state(50);
	let running = $state(false);
	let loading = $state(true);
	let mode: RunningMode = $state("manual");
	let left_automatic_timeout = $state(0);
	let right_automatic_timeout = $state(0);
	let left_automatic_torque = $state(0);
	let right_automatic_torque = $state(0);
	let left_automatic_velocity_threshold = $state(0);
	let right_automatic_velocity_threshold = $state(0);

	type RunningMode = "manual" | "automatic" | "semi-automatic" | "smart";

	type ManualStates = {
		running: boolean;
		rightTorque: number;
		leftTorque: number;
		mode: RunningMode;
	};

	const ws = getWebSocket();

	const getStatesFromApi = async () => {
		const response = await fetch(`${API_ADDRESS}/api/states`);
		if (!response.ok) {
			throw new Error();
		}
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

		loading = false;
	};

	const onPowerClick = async () => {
		running = !running;
		if (running) await fetch(`${API_ADDRESS}/api/start`, { method: "PUT" });
		else await fetch(`${API_ADDRESS}/api/stop`, { method: "PUT" });
	};

	const onModeChange = async (value: string) => {
		await fetch(`${API_ADDRESS}/api/set-mode/${value}`, { method: "PUT" });
	};

	const onLeftSliderValueChange = async (value: number) => {
		ws.send(
			JSON.stringify({
				leftTorque: value,
			}),
		);
	};
	const onRightSliderValueChange = async (value: number) => {
		ws.send(
			JSON.stringify({
				rightTorque: value,
			}),
		);
	};

	onMount(() => {
		loadStates();
		setRtc();
	});
</script>

<div class="w-full h-full flex-col items-center overflow-hidden">
	{#if !loading}
		<Tabs.Root
			value={mode}
			class="w-full h-full flex flex-col gap-0"
			onValueChange={onModeChange}
		>
			<Tabs.List class="w-full rounded-none min-h-20 max-h-20">
				<Tabs.Trigger class="flex flex-col" value="manual">Manual</Tabs.Trigger>
				<Tabs.Trigger class="flex flex-col" value="automatic">
					Automatic
				</Tabs.Trigger>
				<Tabs.Trigger class="flex flex-col" value="semi-automatic">
					Sem-Automatic
				</Tabs.Trigger>
				<Tabs.Trigger class="flex flex-col" value="smart">Smart</Tabs.Trigger>
			</Tabs.List>
			<div class="h-full w-full flex flex-col overflow-auto">
				<Tabs.Content value="automatic">
					<div class="w-full flex gap-4 p-4">
						<Card.Root class="w-full">
							<Card.Header>
								<Card.Title>Left Leg</Card.Title>
								<Card.Content>
									<div class="flex flex-col gap-4">
										<div class="flex flex-col gap-2">
											<div>
												Time: {left_automatic_timeout}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												bind:value={left_automatic_timeout}
											></Slider>
										</div>
										<div class="flex flex-col gap-2">
											<div>
												Torque: {left_automatic_torque}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												bind:value={left_automatic_torque}
											></Slider>
										</div>
										<div class="flex flex-col gap-2">
											<div>
												Velocity Threshold: {left_automatic_velocity_threshold}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												bind:value={left_automatic_velocity_threshold}
											></Slider>
										</div>
									</div>
								</Card.Content>
							</Card.Header>
						</Card.Root>
						<Card.Root class="w-full">
							<Card.Header>
								<Card.Title>Right Leg</Card.Title>
								<Card.Content>
									<div class="flex flex-col gap-4">
										<div class="flex flex-col gap-2">
											<div>
												Time: {right_automatic_timeout}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												bind:value={right_automatic_timeout}
											></Slider>
										</div>
										<div class="flex flex-col gap-2">
											<div>
												Torque: {right_automatic_torque}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												bind:value={right_automatic_torque}
											></Slider>
										</div>
										<div class="flex flex-col gap-2">
											<div>
												Velocity Threshold: {right_automatic_velocity_threshold}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												bind:value={right_automatic_velocity_threshold}
											></Slider>
										</div>
									</div>
								</Card.Content>
							</Card.Header>
						</Card.Root>
					</div>
				</Tabs.Content>
				<Tabs.Content value="manual">
					<div class="w-full flex justify-center">
						<div class="flex justify-between w-40 pt-5">
							<Slider
								type="single"
								bind:value={leftSliderValue}
								max={10}
								step={0.1}
								orientation="vertical"
								class="max-w-[70%]"
								onValueChange={onLeftSliderValueChange}
							/>
							<Slider
								type="single"
								bind:value={rightSliderValue}
								max={10}
								step={0.1}
								orientation="vertical"
								class="max-w-[70%]"
								onValueChange={onRightSliderValueChange}
							/>
						</div>
					</div>
				</Tabs.Content>
				<div class="w-full h-full flex flex-col items-center justify-center">
					<Button
						onclick={onPowerClick}
						variant="default"
						class={`rounded-full h-40 w-40 active:transition-all active:scale-[0.98] ${running ? "bg-success hover:bg-success" : "bg-destructive hover:bg-destructive"}`}
						><PowerIcon class="size-20" /></Button
					>
				</div>
			</div>
		</Tabs.Root>
	{:else}
		<div class="h-full w-full flex items-center justify-center">
			<div class="flex flex-col gap-4 items-center">
				<Spinner class="size-40" />
			</div>
		</div>
	{/if}
</div>

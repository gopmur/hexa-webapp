<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { LinkIcon, PauseIcon, PlayIcon, PowerIcon } from "lucide-svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import Slider from "$lib/components/ui/slider/slider.svelte";
	import { debounce, sleep } from "$lib/utils";
	import { API_ADDRESS, WS_API_ADDRESS } from "$src/config";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import { onMount } from "svelte";
	import { getWebSocket } from "$src/context/ws";
	import * as Card from "$lib/components/ui/card/index.js";

	let loading = $state(true);
	let leftAutomaticLinked = $state(false);
	let rightAutomaticLinked = $state(false);

	type RunningMode = "manual" | "automatic" | "semi-automatic" | "smart";

	type ManualControlParamsLeg = {
		torque: number;
	};

	type ManualControlParams = {
		left: ManualControlParamsLeg;
		right: ManualControlParamsLeg;
	};

	type AutomaticControlParamsLeg = {
		velocityThreshold: number;
		torque: number;
		timeout: number;
	};

	type AutomaticControlParams = {
		right: AutomaticControlParamsLeg;
		left: AutomaticControlParamsLeg;
	};

	type SemiautomaticControlParamsLeg = {
		torque: number;
		delay: number;
		timeout: number;
	};

	type SemiautomaticControlParams = {
		weakLeg: "left" | "right";
		startAssistAngle: number;
		stopAssistAngle: number;
		left: SemiautomaticControlParamsLeg;
		right: SemiautomaticControlParamsLeg;
	};

	type SmartControlParamsLeg = {
		torque: number;
	};

	type SmartControlParams = {
		left: SmartControlParamsLeg;
		right: SmartControlParamsLeg;
	};

	type ControlParams = {
		manual: ManualControlParams;
		automatic: AutomaticControlParams;
		semiautomatic: SemiautomaticControlParams;
		smart: SmartControlParams;
	};

	type ControlStates = {
		running: boolean;
		mode: RunningMode;
		controlParams: ControlParams;
	};

	let controlStates: ControlStates = $state({
		running: false,
		mode: "manual",
		controlParams: {
			manual: {
				right: {
					torque: 0,
				},
				left: {
					torque: 0,
				},
			},
			automatic: {
				right: {
					velocityThreshold: 0,
					torque: 0,
					timeout: 0,
				},
				left: {
					velocityThreshold: 0,
					torque: 0,
					timeout: 0,
				},
			},
			semiautomatic: {
				weakLeg: "left",
				startAssistAngle: 0,
				stopAssistAngle: 0,
				right: {
					torque: 0,
					delay: 0,
					timeout: 0,
				},
				left: {
					torque: 0,
					delay: 0,
					timeout: 0,
				},
			},
			smart: {
				right: {
					torque: 0,
				},
				left: {
					torque: 0,
				},
			},
		},
	});

	const ws = getWebSocket();

	const getStatesFromApi = async () => {
		const response = await fetch(`${API_ADDRESS}/api/states`);
		if (!response.ok) {
			throw new Error();
		}
		const responseData: ControlStates = await response.json();
		return responseData;
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
				controlStates = await getStatesFromApi();
				break;
			} catch {
				await sleep(1000);
			}
		}

		loading = false;
	};

	const onRunningToggle = async () => {
		controlStates.running = !controlStates.running;
		if (controlStates.running)
			await fetch(`${API_ADDRESS}/api/start`, { method: "PUT" });
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

	const onAutomaticLeftLinkClicked = () => {
		leftAutomaticLinked = !leftAutomaticLinked;
		if (leftAutomaticLinked && rightAutomaticLinked) {
			rightAutomaticLinked = false;
		}
		if (leftAutomaticLinked) {
			controlStates.controlParams.automatic.left.timeout =
				controlStates.controlParams.automatic.right.timeout;
			controlStates.controlParams.automatic.left.torque =
				controlStates.controlParams.automatic.right.torque;
			controlStates.controlParams.automatic.left.velocityThreshold =
				controlStates.controlParams.automatic.right.velocityThreshold;
		}
	};

	const onAutomaticRightLinkClicked = () => {
		rightAutomaticLinked = !rightAutomaticLinked;
		if (rightAutomaticLinked && leftAutomaticLinked) {
			leftAutomaticLinked = false;
		}
		if (rightAutomaticLinked) {
			controlStates.controlParams.automatic.right.timeout =
				controlStates.controlParams.automatic.left.timeout;
			controlStates.controlParams.automatic.right.torque =
				controlStates.controlParams.automatic.left.torque;
			controlStates.controlParams.automatic.right.velocityThreshold =
				controlStates.controlParams.automatic.left.velocityThreshold;
		}
	};

	const onAutomaticLeftTimeoutChanged = (val: number) => {
		controlStates.controlParams.automatic.left.timeout = val;
		if (rightAutomaticLinked) {
			controlStates.controlParams.automatic.right.timeout = val;
		}
	};
	const onAutomaticLeftTorqueChanged = (val: number) => {
		controlStates.controlParams.automatic.left.torque = val;
		if (rightAutomaticLinked) {
			controlStates.controlParams.automatic.right.torque = val;
		}
	};
	const onAutomaticLeftVelocityThresholdChanged = (val: number) => {
		controlStates.controlParams.automatic.left.velocityThreshold = val;
		if (rightAutomaticLinked) {
			controlStates.controlParams.automatic.right.velocityThreshold = val;
		}
	};
	const onAutomaticRightTimeoutChanged = (val: number) => {
		controlStates.controlParams.automatic.right.timeout = val;
		if (leftAutomaticLinked) {
			controlStates.controlParams.automatic.left.timeout = val;
		}
	};
	const onAutomaticRightTorqueChanged = (val: number) => {
		controlStates.controlParams.automatic.right.torque = val;
		if (leftAutomaticLinked) {
			controlStates.controlParams.automatic.left.torque = val;
		}
	};
	const onAutomaticRightVelocityThresholdChanged = (val: number) => {
		controlStates.controlParams.automatic.right.velocityThreshold = val;
		if (leftAutomaticLinked) {
			controlStates.controlParams.automatic.left.velocityThreshold = val;
		}
	};

	const onAutomaticParamCommit = async () => {
		await fetch(`${API_ADDRESS}/api/automatic/params`, {
			method: "PUT",
			body: JSON.stringify({
				left: {
					timeout: controlStates.controlParams.automatic.left.timeout,
					torque: controlStates.controlParams.automatic.left.torque,
					velocityThreshold:
						controlStates.controlParams.automatic.left.velocityThreshold,
				},
				right: {
					timeout: controlStates.controlParams.automatic.right.timeout,
					torque: controlStates.controlParams.automatic.right.torque,
					velocityThreshold:
						controlStates.controlParams.automatic.right.velocityThreshold,
				},
			}),
		});
	};

	onMount(() => {
		loadStates();
		setRtc();
	});
</script>

<div class="w-full h-full flex-col items-center overflow-hidden">
	{#if !loading}
		<Tabs.Root
			value={controlStates.mode}
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
								<Card.Title class="flex items-center gap-2">
									<Button
										variant={leftAutomaticLinked ? "default" : "outline"}
										size="icon"
										onclick={onAutomaticLeftLinkClicked}
									>
										<LinkIcon />
									</Button>
									<div>Left Leg</div>
								</Card.Title>
								<Card.Content class="px-0 pt-4">
									<div class="flex flex-col gap-4">
										<div class="flex flex-col gap-2">
											<div>
												Time: {controlStates.controlParams.automatic.left
													.timeout}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												value={controlStates.controlParams.automatic.left
													.timeout}
												onValueChange={onAutomaticLeftTimeoutChanged}
												onValueCommit={onAutomaticParamCommit}
												disabled={leftAutomaticLinked}
											></Slider>
										</div>
										<div class="flex flex-col gap-2">
											<div>
												Torque: {controlStates.controlParams.automatic.left
													.torque}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												value={controlStates.controlParams.automatic.left
													.torque}
												onValueChange={onAutomaticLeftTorqueChanged}
												onValueCommit={onAutomaticParamCommit}
												disabled={leftAutomaticLinked}
											></Slider>
										</div>
										<div class="flex flex-col gap-2">
											<div>
												Velocity: {controlStates.controlParams.automatic.left
													.velocityThreshold}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												value={controlStates.controlParams.automatic.left
													.velocityThreshold}
												onValueChange={onAutomaticLeftVelocityThresholdChanged}
												onValueCommit={onAutomaticParamCommit}
												disabled={leftAutomaticLinked}
											></Slider>
										</div>
									</div>
								</Card.Content>
							</Card.Header>
						</Card.Root>
						<Card.Root class="w-full">
							<Card.Header>
								<Card.Title class="flex items-center gap-2">
									<Button
										variant={rightAutomaticLinked ? "default" : "outline"}
										size="icon"
										onclick={onAutomaticRightLinkClicked}
									>
										<LinkIcon />
									</Button>
									<div>Left Leg</div>
								</Card.Title>
								<Card.Content class="px-0 pt-4">
									<div class="flex flex-col gap-4">
										<div class="flex flex-col gap-2">
											<div>
												Time: {controlStates.controlParams.automatic.right
													.timeout}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												value={controlStates.controlParams.automatic.right
													.timeout}
												onValueChange={onAutomaticRightTimeoutChanged}
												onValueCommit={onAutomaticParamCommit}
												disabled={rightAutomaticLinked}
											></Slider>
										</div>
										<div class="flex flex-col gap-2">
											<div>
												Torque: {controlStates.controlParams.automatic.right
													.torque}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												value={controlStates.controlParams.automatic.right
													.torque}
												onValueChange={onAutomaticRightTorqueChanged}
												onValueCommit={onAutomaticParamCommit}
												disabled={rightAutomaticLinked}
											></Slider>
										</div>
										<div class="flex flex-col gap-2">
											<div>
												Velocity: {controlStates.controlParams.automatic.right
													.velocityThreshold}%
											</div>
											<Slider
												type="single"
												min={0}
												max={100}
												step={1}
												value={controlStates.controlParams.automatic.right
													.velocityThreshold}
												onValueChange={onAutomaticRightVelocityThresholdChanged}
												onValueCommit={onAutomaticParamCommit}
												disabled={rightAutomaticLinked}
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
								bind:value={controlStates.controlParams.manual.left.torque}
								max={10}
								step={0.1}
								orientation="vertical"
								class="max-w-[70%]"
								onValueChange={onLeftSliderValueChange}
							/>

							<Slider
								type="single"
								bind:value={controlStates.controlParams.manual.right.torque}
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
						onclick={onRunningToggle}
						variant="default"
						class={`rounded-full h-40 w-40 active:transition-all active:scale-[0.98] ${controlStates.running ? "bg-success hover:bg-success" : "bg-destructive hover:bg-destructive"}`}
					>
						{#if controlStates.running}
							<PauseIcon class="size-20" />
						{:else}
							<PlayIcon class="size-20" />
						{/if}
					</Button>
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

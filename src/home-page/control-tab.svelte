<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { PauseIcon, PlayIcon } from "lucide-svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import { sleep } from "$lib/utils";
	import { API_ADDRESS } from "$src/config";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import { onMount } from "svelte";
	import ManualControlTab from "./control-tab/manual-control-tab.svelte";
	import type { ControlStates } from "./control-tab";
	import AutomaticControlTab from "./control-tab/automatic-control-tab.svelte";
	import SemiautomaticControlTab from "./control-tab/semiautomatic-control-tab.d.svelte";
	import SmartControlTab from "./control-tab/smart-control-tab.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { getWebSocket } from "$src/context/ws";

	let loading = $state(true);

	const initialParams: ControlStates = {
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
	};

	let controlStates: ControlStates = $state(initialParams);
	const ws = getWebSocket();

	const onResetParams = async () => {
		ws.send(
			JSON.stringify({
				leftTorque: 0,
				rightTorque: 0,
			}),
		);
		const requests: Promise<Response>[] = [];
		requests.push(
			fetch(`${API_ADDRESS}/api/automatic/params`, {
				method: "PUT",
				body: JSON.stringify(initialParams.controlParams.automatic),
			}),
		);
		requests.push(
			fetch(`${API_ADDRESS}/api/semiautomatic/params`, {
				method: "PUT",
				body: JSON.stringify(initialParams.controlParams.semiautomatic),
			}),
		);
		requests.push(
			fetch(`${API_ADDRESS}/api/smart/params`, {
				method: "PUT",
				body: JSON.stringify(initialParams.controlParams.smart),
			}),
		);
		const responses = await Promise.all(requests);
		const allOk = responses.every(r => r.ok);
		if (allOk) {
			loadStates();
		}
	};

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
					Semi-Automatic
				</Tabs.Trigger>
				<Tabs.Trigger class="flex flex-col" value="smart">Smart</Tabs.Trigger>
			</Tabs.List>
			<div class="h-[calc(100%-5rem)] overflow-auto">
				<div class="w-full px-4 pt-4">
					<Card.Root class="w-full">
						<Card.Content
							class="flex items-center h-full w-full justify-between gap-8"
						>
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
							<div class="h-40 w-full flex flex-col justify-between gap-4">
								<Button variant="outline" class="flex-1" onclick={onResetParams}
									>Reset Parameters</Button
								>
								<Button variant="outline" class="flex-1">Zero Pos</Button>
							</div>
						</Card.Content>
					</Card.Root>
				</div>
				<div class="w-full flex flex-col">
					<Tabs.Content value="manual">
						<ManualControlTab
							bind:controlParams={controlStates.controlParams.manual}
							bind:running={controlStates.running}
						/>
					</Tabs.Content>
					<Tabs.Content value="automatic">
						<AutomaticControlTab
							bind:controlParams={controlStates.controlParams.automatic}
						/>
					</Tabs.Content>
					<Tabs.Content value="semi-automatic" class="flex-0">
						<SemiautomaticControlTab
							bind:controlParams={controlStates.controlParams.semiautomatic}
						/>
					</Tabs.Content>
					<Tabs.Content value="smart">
						<SmartControlTab
							bind:controlParams={controlStates.controlParams.smart}
						/>
					</Tabs.Content>
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

<script lang="ts">
	import Slider from "$lib/components/ui/slider/slider.svelte";
	import { getWebSocket } from "$src/context/ws";
	import type { ManualControlTabProps } from "./manual-control-tab";
	import * as Card from "$lib/components/ui/card/index.js";
	import { API_ADDRESS } from "$src/config";
	let {
		controlParams = $bindable(),
		running = $bindable(),
	}: ManualControlTabProps = $props();
	const ws = getWebSocket();

	const stopMotors = async () => {
		await fetch(`${API_ADDRESS}/api/stop`, { method: "PUT" });
		running = false;
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
</script>

<div class="w-full flex gap-4 p-4">
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">Left Leg</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2">
			<dir>Torque: {controlParams.left.torque} N.m</dir>
			<Slider
				type="single"
				bind:value={controlParams.left.torque}
				max={16}
				min={0}
				step={0.1}
				onValueChange={onLeftSliderValueChange}
			/>
		</Card.Content>
	</Card.Root>
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">Right Leg</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2">
			<dir>Torque: {controlParams.right.torque} N.m</dir>
			<Slider
				type="single"
				bind:value={controlParams.right.torque}
				max={16}
				min={0}
				step={0.1}
				onValueChange={onRightSliderValueChange}
			/>
		</Card.Content>
	</Card.Root>
</div>

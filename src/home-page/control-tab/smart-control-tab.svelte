<script lang="ts">
	import type { SmartControlTabProps } from "./smart-control-tab";
	import Slider from "$lib/components/ui/slider/slider.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { API_ADDRESS } from "$src/config";
	let { controlParams = $bindable() }: SmartControlTabProps = $props();
	const onParamCommit = async () => {
		await fetch(`${API_ADDRESS}/api/smart/params`, {
			method: "PUT",
			body: JSON.stringify({
				left: {
					torque: controlParams.left.torque,
				},
				right: {
					torque: controlParams.right.torque,
				},
			}),
		});
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
				onValueCommit={onParamCommit}
				bind:value={controlParams.left.torque}
				max={10}
				step={0.1}
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
				onValueCommit={onParamCommit}
				bind:value={controlParams.right.torque}
				max={10}
				step={0.1}
			/>
		</Card.Content>
	</Card.Root>
</div>

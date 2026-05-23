<script lang="ts">
	import Slider from "$lib/components/ui/slider/slider.svelte";
	import { getWebSocket } from "$src/context/ws";
	import type { ManualControlTabProps } from "./manual-control-tab";
	let {
		controlParams = $bindable()
	}: ManualControlTabProps = $props();
	const ws = getWebSocket();

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

<div class="w-full flex justify-center">
	<div class="flex justify-between w-40 pt-5">
		<Slider
			type="single"
			bind:value={controlParams.left.torque}
			max={10}
			step={0.1}
			orientation="vertical"
			class="max-w-[70%]"
			onValueChange={onLeftSliderValueChange}
		/>

		<Slider
			type="single"
			bind:value={controlParams.right.torque}
			max={10}
			step={0.1}
			orientation="vertical"
			class="max-w-[70%]"
			onValueChange={onRightSliderValueChange}
		/>
	</div>
</div>

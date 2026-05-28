<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";

	import Slider from "$lib/components/ui/slider/slider.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { API_ADDRESS } from "$src/config";
	import { LinkIcon } from "lucide-svelte";
	import type { AutomaticControlTabProps } from "./automatic-control-tab";
	import { settings } from "$src/context/settings";

	let { controlParams = $bindable() }: AutomaticControlTabProps = $props();

	let leftLinked = $state(false);
	let rightLinked = $state(false);

	const onLeftLinkClicked = () => {
		leftLinked = !leftLinked;
		if (leftLinked && rightLinked) {
			rightLinked = false;
		}
		if (leftLinked) {
			controlParams.left.timeout = controlParams.right.timeout;
			controlParams.left.torque = controlParams.right.torque;
			controlParams.left.velocityThreshold =
				controlParams.right.velocityThreshold;
		}
		onParamCommit();
	};

	const onRightLinkClicked = () => {
		rightLinked = !rightLinked;
		if (rightLinked && leftLinked) {
			leftLinked = false;
		}
		if (rightLinked) {
			controlParams.right.timeout = controlParams.left.timeout;
			controlParams.right.torque = controlParams.left.torque;
			controlParams.right.velocityThreshold =
				controlParams.left.velocityThreshold;
		}
		onParamCommit();
	};

	const onLeftTimeoutChanged = (val: number) => {
		controlParams.left.timeout = val;
		if (rightLinked) {
			controlParams.right.timeout = val;
		}
	};
	const onLeftTorqueChanged = (val: number) => {
		controlParams.left.torque = val;
		if (rightLinked) {
			controlParams.right.torque = val;
		}
	};
	const onLeftVelocityThresholdChanged = (val: number) => {
		controlParams.left.velocityThreshold = val;
		if (rightLinked) {
			controlParams.right.velocityThreshold = val;
		}
	};
	const onRightTimeoutChanged = (val: number) => {
		controlParams.right.timeout = val;
		if (leftLinked) {
			controlParams.left.timeout = val;
		}
	};
	const onRightTorqueChanged = (val: number) => {
		controlParams.right.torque = val;
		if (leftLinked) {
			controlParams.left.torque = val;
		}
	};

	const onRightVelocityThresholdChanged = (val: number) => {
		controlParams.right.velocityThreshold = val;
		if (leftLinked) {
			controlParams.left.velocityThreshold = val;
		}
	};

	const onParamCommit = async () => {
		await fetch(`${API_ADDRESS}/api/automatic/params`, {
			method: "PUT",
			body: JSON.stringify({
				left: {
					timeout: controlParams.left.timeout,
					torque: controlParams.left.torque,
					velocityThreshold: controlParams.left.velocityThreshold,
				},
				right: {
					timeout: controlParams.right.timeout,
					torque: controlParams.right.torque,
					velocityThreshold: controlParams.right.velocityThreshold,
				},
			}),
		});
	};
</script>

<div class="w-full flex gap-4 p-4">
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title class="flex flex-col gap-2">
				<div class="pl-1">Right Leg</div>
				<Button
					variant={leftLinked ? "default" : "outline"}
					size="icon"
					onclick={onLeftLinkClicked}
				>
					<LinkIcon />
				</Button>
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<div>
						Time: {controlParams.left.timeout} ms
					</div>
					<Slider
						type="single"
						min={10}
						max={2000}
						step={10}
						value={controlParams.left.timeout}
						onValueChange={onLeftTimeoutChanged}
						onValueCommit={onParamCommit}
						disabled={leftLinked}
					></Slider>
				</div>
				<div class="flex flex-col gap-2">
					<div>
						Torque: {controlParams.left.torque} N.m
					</div>
					<Slider
						type="single"
						min={0}
						max={16}
						step={0.1}
						value={controlParams.left.torque}
						onValueChange={onLeftTorqueChanged}
						onValueCommit={onParamCommit}
						disabled={leftLinked}
					></Slider>
				</div>
				{#if $settings.advanced}
					<div class="flex flex-col gap-2">
						<div>
							Vel TH: {controlParams.left.velocityThreshold} deg/s
						</div>
						<Slider
							type="single"
							min={0.001}
							max={0.05}
							step={0.001}
							value={controlParams.left.velocityThreshold}
							onValueChange={onLeftVelocityThresholdChanged}
							onValueCommit={onParamCommit}
							disabled={leftLinked}
						></Slider>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title class="flex flex-col gap-2">
				<div class="pl-1">Right Leg</div>
				<Button
					variant={rightLinked ? "default" : "outline"}
					size="icon"
					onclick={onRightLinkClicked}
				>
					<LinkIcon />
				</Button>
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<div>
						Time: {controlParams.right.timeout} ms
					</div>
					<Slider
						type="single"
						min={10}
						max={2000}
						step={10}
						value={controlParams.right.timeout}
						onValueChange={onRightTimeoutChanged}
						onValueCommit={onParamCommit}
						disabled={rightLinked}
					></Slider>
				</div>
				<div class="flex flex-col gap-2">
					<div>
						Torque: {controlParams.right.torque} N.m
					</div>
					<Slider
						type="single"
						min={0}
						max={16}
						step={0.1}
						value={controlParams.right.torque}
						onValueChange={onRightTorqueChanged}
						onValueCommit={onParamCommit}
						disabled={rightLinked}
					></Slider>
				</div>
				{#if $settings.advanced}
					<div class="flex flex-col gap-2">
						<div>
							Vel TH: {controlParams.right.velocityThreshold} deg/s
						</div>
						<Slider
							type="single"
							min={0.001}
							max={0.05}
							step={0.001}
							value={controlParams.right.velocityThreshold}
							onValueChange={onRightVelocityThresholdChanged}
							onValueCommit={onParamCommit}
							disabled={rightLinked}
						></Slider>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
</div>

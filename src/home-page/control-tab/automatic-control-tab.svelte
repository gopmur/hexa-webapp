<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";

	import Slider from "$lib/components/ui/slider/slider.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { API_ADDRESS } from "$src/config";
	import { LinkIcon } from "lucide-svelte";
	import type { AutomaticControlTabProps } from "./automatic-control-tab";

	let { controlParams = $bindable() }: AutomaticControlTabProps = $props();

	let leftLinked = $state(false);
	let rightLinked = $state(false);

	const onAutomaticLeftLinkClicked = () => {
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
	};

	const onAutomaticRightLinkClicked = () => {
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
	};

	const onAutomaticLeftTimeoutChanged = (val: number) => {
		controlParams.left.timeout = val;
		if (rightLinked) {
			controlParams.right.timeout = val;
		}
	};
	const onAutomaticLeftTorqueChanged = (val: number) => {
		controlParams.left.torque = val;
		if (rightLinked) {
			controlParams.right.torque = val;
		}
	};
	const onAutomaticLeftVelocityThresholdChanged = (val: number) => {
		controlParams.left.velocityThreshold = val;
		if (rightLinked) {
			controlParams.right.velocityThreshold = val;
		}
	};
	const onAutomaticRightTimeoutChanged = (val: number) => {
		controlParams.right.timeout = val;
		if (leftLinked) {
			controlParams.left.timeout = val;
		}
	};
	const onAutomaticRightTorqueChanged = (val: number) => {
		controlParams.right.torque = val;
		if (leftLinked) {
			controlParams.left.torque = val;
		}
	};
	const onAutomaticRightVelocityThresholdChanged = (val: number) => {
		controlParams.right.velocityThreshold = val;
		if (leftLinked) {
			controlParams.left.velocityThreshold = val;
		}
	};

	const onAutomaticParamCommit = async () => {
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
			<Card.Title class="flex items-center gap-2">
				<Button
					variant={leftLinked ? "default" : "outline"}
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
							Time: {controlParams.left.timeout}%
						</div>
						<Slider
							type="single"
							min={0}
							max={100}
							step={1}
							value={controlParams.left.timeout}
							onValueChange={onAutomaticLeftTimeoutChanged}
							onValueCommit={onAutomaticParamCommit}
							disabled={leftLinked}
						></Slider>
					</div>
					<div class="flex flex-col gap-2">
						<div>
							Torque: {controlParams.left.torque}%
						</div>
						<Slider
							type="single"
							min={0}
							max={100}
							step={1}
							value={controlParams.left.torque}
							onValueChange={onAutomaticLeftTorqueChanged}
							onValueCommit={onAutomaticParamCommit}
							disabled={leftLinked}
						></Slider>
					</div>
					<div class="flex flex-col gap-2">
						<div>
							Velocity: {controlParams.left.velocityThreshold}%
						</div>
						<Slider
							type="single"
							min={0}
							max={100}
							step={1}
							value={controlParams.left.velocityThreshold}
							onValueChange={onAutomaticLeftVelocityThresholdChanged}
							onValueCommit={onAutomaticParamCommit}
							disabled={leftLinked}
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
					variant={rightLinked ? "default" : "outline"}
					size="icon"
					onclick={onAutomaticRightLinkClicked}
				>
					<LinkIcon />
				</Button>
				<div>Right Leg</div>
			</Card.Title>
			<Card.Content class="px-0 pt-4">
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<div>
							Time: {controlParams.right.timeout}%
						</div>
						<Slider
							type="single"
							min={0}
							max={100}
							step={1}
							value={controlParams.right.timeout}
							onValueChange={onAutomaticRightTimeoutChanged}
							onValueCommit={onAutomaticParamCommit}
							disabled={rightLinked}
						></Slider>
					</div>
					<div class="flex flex-col gap-2">
						<div>
							Torque: {controlParams.right.torque}%
						</div>
						<Slider
							type="single"
							min={0}
							max={100}
							step={1}
							value={controlParams.right.torque}
							onValueChange={onAutomaticRightTorqueChanged}
							onValueCommit={onAutomaticParamCommit}
							disabled={rightLinked}
						></Slider>
					</div>
					<div class="flex flex-col gap-2">
						<div>
							Velocity: {controlParams.right.velocityThreshold}%
						</div>
						<Slider
							type="single"
							min={0}
							max={100}
							step={1}
							value={controlParams.right.velocityThreshold}
							onValueChange={onAutomaticRightVelocityThresholdChanged}
							onValueCommit={onAutomaticParamCommit}
							disabled={rightLinked}
						></Slider>
					</div>
				</div>
			</Card.Content>
		</Card.Header>
	</Card.Root>
</div>

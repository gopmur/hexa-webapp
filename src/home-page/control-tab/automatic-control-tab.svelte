<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";

	import Slider from "$lib/components/ui/slider/slider.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { API_ADDRESS } from "$src/config";
	import { LinkIcon } from "lucide-svelte";
	import type { AutomaticControlTabProps } from "./automatic-control-tab";
	import { degToRad } from "$lib/utils";

	let {
		controlParams = $bindable(),
		controlConfigs = $bindable(),
	}: AutomaticControlTabProps = $props();

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
		controlConfigs.left.velocityThreshold = val;
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
		controlConfigs.right.velocityThreshold = val;
	};

	const onParamCommit = async () => {
		await fetch(`${API_ADDRESS}/api/control/automatic/params`, {
			method: "PUT",
			body: JSON.stringify({
				left: {
					timeout: controlParams.left.timeout,
					torque: controlParams.left.torque,
				},
				right: {
					timeout: controlParams.right.timeout,
					torque: controlParams.right.torque,
				},
			}),
		});
	};

	const onConfigCommit = async () => {
		await fetch(`${API_ADDRESS}/api/control/automatic/configs`, {
			method: "PUT",
			body: JSON.stringify({
				left: { velocityThreshold: degToRad(controlConfigs.left.velocityThreshold) },
				right: { velocityThreshold: degToRad(controlConfigs.right.velocityThreshold) },
				angleThreshold: degToRad(controlConfigs.angleThreshold),
			}),
		});
	};
</script>

<div class="w-full flex flex-col gap-4 p-4">
	<Card.Root class="w-full">
		<Card.Header><Card.Title>Configs</Card.Title></Card.Header>
		<Card.Content class="grid gap-4 md:grid-cols-2">
			<div class="flex flex-col gap-2">
				<div>Left velocity threshold: {controlConfigs.left.velocityThreshold} deg/s</div>
				<Slider type="single" min={10} max={100} step={1} value={controlConfigs.left.velocityThreshold} onValueChange={onLeftVelocityThresholdChanged} onValueCommit={onConfigCommit} />
			</div>
			<div class="flex flex-col gap-2">
				<div>Right velocity threshold: {controlConfigs.right.velocityThreshold} deg/s</div>
				<Slider type="single" min={10} max={100} step={1} value={controlConfigs.right.velocityThreshold} onValueChange={onRightVelocityThresholdChanged} onValueCommit={onConfigCommit} />
			</div>
			<div class="flex flex-col gap-2">
				<div>Angle threshold: {controlConfigs.angleThreshold} deg</div>
				<Slider type="single" min={0} max={180} step={1} bind:value={controlConfigs.angleThreshold} onValueCommit={onConfigCommit} />
			</div>
		</Card.Content>
	</Card.Root>
	<h3 class="text-sm font-semibold">Params</h3>
	<div class="w-full flex gap-4">
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title class="flex flex-col gap-2">
				<div class="pl-1">Left Leg</div>
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
			</div>
		</Card.Content>
	</Card.Root>
	</div>
</div>

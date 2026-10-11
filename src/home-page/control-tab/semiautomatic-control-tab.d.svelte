<script lang="ts">
	import { API_ADDRESS } from "$src/config";
	import type { SemiautomaticControlTabProps } from "./semiautomatic-control-tab";
	import Button from "$lib/components/ui/button/button.svelte";
	import Slider from "$lib/components/ui/slider/slider.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { LinkIcon } from "lucide-svelte";
	import Switch from "$lib/components/ui/switch/switch.svelte";
	import { degToRad } from "$lib/utils";

	let {
		controlParams = $bindable(),
		controlConfigs = $bindable(),
	}: SemiautomaticControlTabProps = $props();

	let leftLinked = $state(false);
	let rightLinked = $state(false);

	const onLeftLegSwitchClicked = (val: boolean) => {
		if (val) {
			controlParams.weakLeg = "left";
		}
		onParamCommit();
	};

	const onRightLegSwitchClicked = (val: boolean) => {
		if (val) {
			controlParams.weakLeg = "right";
		}
		onParamCommit();
	};

	const onLeftLinkClicked = () => {
		leftLinked = !leftLinked;
		if (leftLinked && rightLinked) {
			rightLinked = false;
		}
		if (leftLinked) {
			controlParams.left.timeout = controlParams.right.timeout;
			controlParams.left.torque = controlParams.right.torque;
			controlParams.left.delay = controlParams.right.delay;
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
			controlParams.right.delay = controlParams.left.delay;
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
	const onLeftDelayChanged = (val: number) => {
		controlParams.left.delay = val;
		if (rightLinked) {
			controlParams.right.delay = val;
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
	const onRightDelayChanged = (val: number) => {
		controlParams.right.delay = val;
		if (leftLinked) {
			controlParams.left.delay = val;
		}
	};

	const onAssistAngleChange = ([a, b]: number[]) => {
		controlConfigs.startAssistAngle = Math.min(a, b);
		controlConfigs.stopAssistAngle = Math.max(a, b);
	};

	const onParamCommit = async () => {
		await fetch(`${API_ADDRESS}/api/control/semiautomatic/params`, {
			method: "PUT",
			body: JSON.stringify({
				weakLeg: controlParams.weakLeg,
				left: {
					timeout: controlParams.left.timeout,
					torque: controlParams.left.torque,
					delay: controlParams.left.delay,
				},
				right: {
					timeout: controlParams.right.timeout,
					torque: controlParams.right.torque,
					delay: controlParams.right.delay,
				},
			}),
		});
	};

	const onConfigCommit = async () => {
		await fetch(`${API_ADDRESS}/api/control/semiautomatic/configs`, {
			method: "PUT",
			body: JSON.stringify({
				startAssistAngle: degToRad(controlConfigs.startAssistAngle),
				stopAssistAngle: degToRad(controlConfigs.stopAssistAngle),
				epsilon: degToRad(controlConfigs.epsilon),
			}),
		});
	};
</script>

<div class="w-full flex flex-col p-4 gap-4">
	<Card.Root class="w-full">
		<Card.Header><Card.Title>Configs</Card.Title></Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div>Assist angles: {controlConfigs.startAssistAngle} deg to {controlConfigs.stopAssistAngle} deg</div>
			<Slider min={0} max={190} step={1} type="multiple" onValueChange={onAssistAngleChange} onValueCommit={onConfigCommit} value={[controlConfigs.startAssistAngle, controlConfigs.stopAssistAngle]} />
			<div class="flex flex-col gap-2">
				<div>Epsilon: {controlConfigs.epsilon} deg</div>
				<Slider type="single" min={0} max={30} step={0.1} bind:value={controlConfigs.epsilon} onValueCommit={onConfigCommit} />
			</div>
		</Card.Content>
	</Card.Root>
	<h3 class="text-sm font-semibold">Params</h3>
	<div class="w-full flex gap-4">
		<Card.Root class="w-full">
			<Card.Header>
				<Card.Title class="flex flex-col gap-2">
					<div class="pl-1">Left Leg</div>
					<div class="flex items-center gap-2">
						<Button
							variant={leftLinked ? "default" : "outline"}
							size="icon"
							onclick={onLeftLinkClicked}
						>
							<LinkIcon />
						</Button>
						<Switch
							checked={controlParams.weakLeg == "left"}
							onCheckedChange={onLeftLegSwitchClicked}
						/>
					</div>
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
					<div class="flex flex-col gap-2">
						<div>
							Delay: {controlParams.left.delay} ms
						</div>
						<Slider
							type="single"
							min={10}
							max={2000}
							step={10}
							value={controlParams.left.delay}
							onValueChange={onLeftDelayChanged}
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
					<div class="flex items-center gap-2">
						<Button
							variant={rightLinked ? "default" : "outline"}
							size="icon"
							onclick={onRightLinkClicked}
						>
							<LinkIcon />
						</Button>
						<Switch
							checked={controlParams.weakLeg == "right"}
							onCheckedChange={onRightLegSwitchClicked}
						/>
					</div></Card.Title
				>
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
					<div class="flex flex-col gap-2">
						<div>
							Delay: {controlParams.right.delay} ms
						</div>
						<Slider
							type="single"
							min={10}
							max={2000}
							step={10}
							value={controlParams.right.delay}
							onValueChange={onRightDelayChanged}
							onValueCommit={onParamCommit}
							disabled={rightLinked}
						></Slider>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>

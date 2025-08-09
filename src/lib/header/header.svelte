<script>
	import ThermometerIcon from "@lucide/svelte/icons/thermometer";
	import PowerIcon from "@lucide/svelte/icons/power";
	import Wifi from "@lucide/svelte/icons/wifi";
	import BatteryFull from "@lucide/svelte/icons/battery-full";
	import UserRoundIcon from "@lucide/svelte/icons/user-round";
	import { Button } from "$lib/components/ui/button";
</script>

<header class="bg-accent w-full p-4">
	<div class="flex justify-between items-center">
		<div
			class="w-fit h-fit rounded-full border-2 border-black flex justify-center items-center aspect-square"
		>
			<UserRoundIcon class="size-6" />
		</div>
		<div class="flex gap-4">
			<Button variant="default" size="icon"><Wifi class="size-6" /></Button>
			<Button variant="default" size="icon"><PowerIcon class="size-6" /></Button>
			<Button variant="default" size="icon"><BatteryFull class="size-6" /></Button>
			<Button variant="default" size="icon"
				><ThermometerIcon class="size-6" /></Button
			>
		</div>
	</div>
</header>

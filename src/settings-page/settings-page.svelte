<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";

	const onStartClick = () => {
    console.log("start")
    fetch("/api/start")
  };
</script>

<main class="h-dvh w-screen flex flex-col">
	<Button onclick={onStartClick}>Start</Button>
</main>

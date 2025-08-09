<script lang="ts">
	let count = 0;

	let onClick = () => {
		count++;
	};
</script>

<main>
	<button onclick={onClick}>{count}</button>
</main>

<style>
</style>

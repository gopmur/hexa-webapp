<script lang="ts">
	import About from "./settings-page/about.svelte";
	import Appearance from "./settings-page/appearance.svelte";
</script>

<main class="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6">
	<header class="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
		<div>
			<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
				Device
			</p>
			<h1 class="mt-1 text-2xl font-semibold">Settings</h1>
		</div>
		<p class="text-sm text-muted-foreground">System information and preferences</p>
	</header>

	<div class="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)]">
		<section class="min-w-0 space-y-5" aria-labelledby="system-heading">
			<div class="border-b pb-3">
				<h2 id="system-heading" class="text-base font-semibold">System</h2>
				<p class="mt-1 text-sm text-muted-foreground">Firmware and runtime details</p>
			</div>
			<About />
		</section>

		<section
			class="space-y-5 border-t pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"
			aria-labelledby="appearance-heading"
		>
			<div class="border-b pb-3">
				<h2 id="appearance-heading" class="text-base font-semibold">Appearance</h2>
				<p class="mt-1 text-sm text-muted-foreground">Display preferences</p>
			</div>
			<Appearance />
		</section>
	</div>
</main>

<script lang="ts">
	import '../app.css'
	import favicon from '$lib/assets/favicon.png'
	import { AppBar } from '@skeletonlabs/skeleton-svelte'
	import DarkMode from '$lib/components/DarkMode.svelte'

	let { children } = $props()
</script>

<AppBar class="bg-white dark:bg-gray-800">
	<AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
		<AppBar.Lead>
			<img src={favicon} alt="utabako" class="size-12" />
		</AppBar.Lead>
		<AppBar.Headline>
			<span class="font-bold text-2xl">UTABAKO</span>
		</AppBar.Headline>
		<AppBar.Trail>
			<DarkMode />
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>
<div class="flex justify-center">
	<div class="mx-atuo my-8 p-4 w-4xl">
		{@render children?.()}
	</div>
</div>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

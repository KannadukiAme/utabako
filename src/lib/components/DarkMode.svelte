<script lang="ts">
	import { SunIcon, MoonIcon } from '@lucide/svelte'

	let isDarkMode = $state(null) as boolean | null

	$effect(() => {
		isDarkMode = localStorage.getItem('darkMode') === 'true'
	})

	$effect(() => {
		if (isDarkMode) {
			document.documentElement.setAttribute('data-mode', 'dark')
		} else {
			document.documentElement.setAttribute('data-mode', 'light')
		}
		localStorage.setItem('darkMode', String(isDarkMode))
	})
</script>

<svelte:head>
	<script>
		if (localStorage.getItem('darkMode') === 'true') {
			document.documentElement.setAttribute('data-mode', 'dark')
		} else {
			document.documentElement.setAttribute('data-mode', 'light')
		}
	</script>
</svelte:head>
<button
	type="button"
	class="btn-icon hover:preset-tonal"
	onclick={() => (isDarkMode = !isDarkMode)}
	title={isDarkMode ? '日间模式' : '夜间模式'}
>
	{#if isDarkMode === true}
		<SunIcon class="size-6" />
	{:else if isDarkMode === false}
		<MoonIcon class="size-6" />
	{/if}
</button>

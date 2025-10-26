<script lang="ts">
	import type { PageProps } from './$types'
	import { page } from '$app/state'
	import { SquareArrowOutUpRightIcon } from '@lucide/svelte'
	import { Switch } from '@skeletonlabs/skeleton-svelte'

	let { data }: PageProps = $props()
	let isCustomedTemplate = $state(false)
	let url: string = $state('')
	let templateUrl: string = $state('')
	const subTypeOptions = [
		{ label: 'SingBox订阅(json格式)', value: 0, userAgent: 'sing-box' }
		// { label: '通用订阅(base64编码)', value: 1, userAgent: '' },
		// { label: 'Clash订阅(yaml格式)', value: 2, userAgent: 'clash' }
	]
	const templateOptions = data.templates.map((template, index) => {
		return { label: template.des, value: index }
	})
	let selectedSubType = $state(subTypeOptions[0].value)
	let selectedTemplate = $state(templateOptions[0].value)

	let convertApiUrl = $derived(
		`${page.url.origin}/api/config?t=${
			isCustomedTemplate ? encodeURIComponent(templateUrl) : templateOptions[selectedTemplate].value
		}&ua=${subTypeOptions[selectedSubType].userAgent}&url=${encodeURIComponent(url)}`
	)

	function handlePreview() {
		window.open(convertApiUrl, '_blank')
	}
</script>

<svelte:head>
	<title>UTABAKO 订阅转换服务</title>
</svelte:head>

<div>
	<div
		class="card p-4 w-full space-y-4 preset-outlined-surface-100-900 bg-white dark:bg-gray-800 shadow"
	>
		<label class="label">
			<span class="label-text">订阅地址</span>
			<input class="input" type="text" placeholder="https://" bind:value={url} />
		</label>
		<label class="label">
			<span class="label-text">订阅类型</span>
			<select class="select" bind:value={selectedSubType}>
				{#each subTypeOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>
		<label class="label">
			<span class="label-text">配置模板</span>
			<div>
				<Switch
					checked={isCustomedTemplate}
					onCheckedChange={(e) => (isCustomedTemplate = e.checked)}
				>
					<Switch.Label>自定义模板</Switch.Label>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.HiddenInput />
				</Switch>
			</div>
			{#if isCustomedTemplate === false}
				<select class="select" bind:value={selectedTemplate}>
					{#each templateOptions as option}
						<option class="hover:bg-amber-400" value={option.value}>{option.label}</option>
					{/each}
				</select>
			{:else if isCustomedTemplate === true}
				<input class="input" type="text" placeholder="https://" bind:value={templateUrl} />
			{/if}
		</label>
		<div class="flex space-x-2 justify-end">
			<button
				type="button"
				class="btn preset-outlined-surface-500 hover:preset-filled-surface-500"
				onclick={handlePreview}
			>
				<SquareArrowOutUpRightIcon size={18} />
				<span>转换订阅</span>
			</button>
		</div>
	</div>
</div>

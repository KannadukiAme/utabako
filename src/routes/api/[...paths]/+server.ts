import type { RequestHandler } from '@sveltejs/kit'
import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { logger } from 'hono/logger'
import { proxy } from 'hono/proxy'
import packageJson from '../../../../package.json'
import { templates } from '$lib/templates/templates'

import { readdir, readFile } from 'node:fs/promises'

const app = new Hono().basePath('/api')

app.use(compress())
app.use(logger())

app.get('/version', (c) => {
	return c.json({ version: packageJson.version })
})

// 代理远程sing-box配置
app.get('/proxy', async (c) => {
	const url = c.req.query('url')
	const userAgent = c.req.query('userAgent')
	if (url == null) {
		return c.text('url 参数缺失', 400)
	}
	return proxy(url, {
		headers: {
			...c.req.header(),
			'X-Forwarded-For': '127.0.0.1',
			'X-Forwarded-Host': c.req.header('host'),
			'User-Agent': userAgent,
			Authorization: undefined
		}
	})
})

/**
 * 获取 sing-box 配置
 * 参数 url 必须 机场订阅地址
 * 参数 t template 必须 模板索引或自定义模板地址
 * 参数 ua userAgent 可选，默认 sing-box ，用于伪装请求头
 */
app.get('/config', async (c) => {
	const url = c.req.query('url')
	const template = c.req.query('t')
	const userAgent = c.req.query('ua') || 'sing-box'

	if (url === undefined || url === '') {
		console.error('url 参数缺失')
		return c.text('url 参数缺失', 400)
	}
	if (URL.canParse(url) === false) {
		console.error('url 参数非法')
		return c.text('url 参数非法', 400)
	}
	if (template === undefined || template === '') {
		console.error('t 参数缺失')
		return c.text('t 参数缺失', 400)
	}
	if (URL.canParse(template) === false && isNaN(Number(template))) {
		console.error('t 参数非法')
		return c.text('t 参数非法', 400)
	}

	// 代理订阅请求
	let singBoxConfig = null as Object | null
	try {
		const proxyRes = await proxy(url, {
			headers: {
				...c.req.header(),
				'X-Forwarded-For': '127.0.0.1',
				'X-Forwarded-Host': c.req.header('host'),
				'User-Agent': userAgent,
				Authorization: undefined
			}
		})
		singBoxConfig = await proxyRes.json()
	} catch (e) {
		console.error('url 参数错误', e)
		return c.text('url 参数错误', 400)
	}

	if (singBoxConfig === null) {
		console.error('代理订阅请求失败')
		return c.text('代理订阅请求失败', 500)
	}

	// 获取模板配置
	let singBoxTemplateConfig = null as Object | null

	if (URL.canParse(template)) {
		let templateURL = template
		console.log('使用自定义模板地址', templateURL)
		try {
			const templateRes = await proxy(templateURL)
			singBoxTemplateConfig = await templateRes.json()
		} catch (e) {
			console.error('t 参数错误', e)
			return c.text('t 参数错误', 400)
		}
	} else {
		let templateIndex = Number(template)
		console.log('使用模板索引', templateIndex)
		singBoxTemplateConfig = JSON.parse(
			await readFile(`src/lib/templates/${templates[templateIndex].name}`, {
				encoding: 'utf-8'
			})
		)
	}

	if (singBoxTemplateConfig === null) {
		console.error('获取模板配置失败')
		return c.text('获取模板配置失败', 500)
	}

	// 转换配置
	const nodes = singBoxConfig.outbounds.filter(
		(outbound) =>
			outbound.type !== 'direct' &&
			outbound.type !== 'block' &&
			outbound.type !== 'selector' &&
			outbound.type !== 'urltest'
	)

	// 替换模板
	singBoxTemplateConfig.outbounds.forEach((outbound) => {
		// 执行{filter}操作
		let filterNodes = [...nodes]

		if (outbound.filter && outbound.filter.length > 0) {
			outbound.filter.forEach((filterRule) => {
				if (filterRule.action === 'include') {
					filterNodes = filterNodes.filter((node) =>
						new RegExp(filterRule.keywords[0]).test(node.tag)
					)
				} else if (filterRule.action === 'exclude') {
					filterNodes = filterNodes.filter(
						(node) => !new RegExp(filterRule.keywords[0]).test(node.tag)
					)
				}
				console.log('过滤规则:', filterRule.action, filterRule.keywords[0])
			})
			outbound.filter = undefined
		}
		console.log('过滤后节点数量:', filterNodes.length)

		// 替换{all}节点
		if (outbound.type === 'selector' || outbound.type === 'urltest') {
			const index = outbound.outbounds?.findIndex((item) => item === '{all}')
			console.log('找到替换位置:', index)
			if (index !== -1 && index !== undefined) {
				outbound.outbounds?.splice(index, 1, ...filterNodes.map((node) => node.tag))
			}
		}
	})

	const outputConfig = {
		...singBoxTemplateConfig,
		outbounds: [...singBoxTemplateConfig.outbounds, ...nodes]
	}

	return c.json(outputConfig)
})

export const GET: RequestHandler = ({ request }) => app.fetch(request)

// Host half of the balance-card surface plugin.
// Registers a same-origin JSON route that reads the DeepSeek API key from the
// credential service, queries the official balance endpoint through curl, and
// returns a normalized payload. The key never leaves this process.
//
// 可靠性设计：
// - inject 硬依赖三个服务，服务就绪后才 apply，加载顺序不再影响；
// - 路由注册 try/catch：热重载/重复 apply 导致的重复注册被忽略；
// - 若首次注册失败，在根就绪事件(ready)后再补注册一次（自愈）。
export const inject = ['webServer', 'credentials', 'subprocess']

export function apply(ctx) {
	const json = (res, status, payload) => {
		res.writeHead(status, {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
		})
		res.end(JSON.stringify(payload))
	}

	const route = {
		kind: 'exact',
		path: '/api/balance-card',
		handler: async (req, res) => {
			if (req.method !== 'GET') {
				json(res, 405, { ok: false, error: 'method not allowed' })
				return
			}
			try {
				const resolved = await ctx.credentials.resolve('DEEPSEEK_API_KEY')
				const key = resolved && resolved.value
				if (!key) {
					json(res, 200, { ok: false, error: '\u672A\u914D\u7F6E DEEPSEEK_API_KEY' })
					return
				}
				const curl = await ctx.subprocess.resolveExecutable('curl.exe')
				const handle = ctx.subprocess.spawn({
					argv: [curl, '-s', '-m', '15', '-H', 'Authorization: Bearer ' + key, 'https://api.deepseek.com/user/balance'],
					cwd: 'C:\\',
					stdio: { stdin: 'ignore', stdout: { maxBytes: 65536 }, stderr: { maxBytes: 8192 } },
					graceMs: 5000,
				})
				const outcome = await handle.done
				const text = handle.collected.stdout ? handle.collected.stdout.readFrom(0).text : ''
				if (outcome.exitCode !== 0) {
					const err = handle.collected.stderr ? handle.collected.stderr.readFrom(0).text : ''
					json(res, 200, { ok: false, error: '\u8BF7\u6C42\u5931\u8D25(exit ' + outcome.exitCode + '): ' + String(err || text).slice(0, 200) })
					return
				}
				let data
				try { data = JSON.parse(text) } catch (e) {
					json(res, 200, { ok: false, error: '\u4F59\u989D\u63A5\u53E3\u54CD\u5E94\u65E0\u6CD5\u89E3\u6790: ' + String(text).slice(0, 200) })
					return
				}
				if (data && data.error) {
					json(res, 200, { ok: false, error: 'DeepSeek API \u9519\u8BEF: ' + JSON.stringify(data.error).slice(0, 200) })
					return
				}
				const info = data && Array.isArray(data.balance_infos) ? data.balance_infos[0] : null
				json(res, 200, {
					ok: true,
					at: Date.now(),
					data: {
						available: !!(data && data.is_available),
						currency: info && info.currency ? info.currency : 'CNY',
						total: info && info.total_balance != null ? info.total_balance : null,
						granted: info && info.granted_balance != null ? info.granted_balance : null,
						toppedUp: info && info.topped_up_balance != null ? info.topped_up_balance : null,
					},
				})
			} catch (e) {
				json(res, 200, { ok: false, error: '\u8BF7\u6C42\u5F02\u5E38: ' + String(e && e.message ? e.message : e).slice(0, 300) })
			}
		},
	}

	function registerRoute() {
		try {
			const dispose = ctx.webServer.register(route)
			ctx.effect(() => dispose, 'balance-card: route /api/balance-card')
			return true
		} catch (err) {
			console.error('[balance-card] \u8DEF\u7531\u6CE8\u518C\u5931\u8D25(\u53EF\u80FD\u5DF2\u5B58\u5728,\u5FFD\u7565): ' + String(err && err.message ? err.message : err))
			return false
		}
	}

	if (!registerRoute()) {
		ctx.on('ready', () => { registerRoute() })
	}
}

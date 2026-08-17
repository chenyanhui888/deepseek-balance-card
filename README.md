# deepseek-balance-card

DeepSeek Harness 桌面端页面插件：在 Web GUI 右上角显示一个悬浮玻璃卡片，实时显示 DeepSeek 账户剩余余额。

## 效果

- 卡片内容：`DeepSeek 余额` 标题 + 刷新按钮 + 剩余金额（¥/$）
- 拖动卡片可移动位置，双击复位到右上角
- 每 60 秒自动刷新，也可点 `↻` 手动刷新
- 数据来自官方接口 `https://api.deepseek.com/user/balance`

## 文件结构

| 文件 | 作用 |
| --- | --- |
| `index.js` | Host 半区：注册 `/api/balance-card` 路由，从凭据服务读取 `DEEPSEEK_API_KEY`，用 curl 查询官方余额接口并返回规范化 JSON |
| `client.js` | Client 半区：`shell.overlay` 悬浮卡片 UI，读取 `/api/balance-card` 并渲染 |
| `package.json` | 包声明（`dsh.client.platform: web`） |

## 安装

1. 把本目录复制到 `%USERPROFILE%\.dsh\plugins\balance-card\`
2. 把本目录安装到 web profile：`%USERPROFILE%\.dsh\profiles\web\node_modules\balance-card\`
3. 在 `%USERPROFILE%\.dsh\profiles\web\cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: balance-card
      name: balance-card
```

4. 在 harness 的凭据配置中设置 `DEEPSEEK_API_KEY`
5. 重启 DeepSeek Harness（或刷新 Web GUI 页面）

> 说明：`/plugins/balance-card/client.js` 由 harness 按文件实时读取（无缓存校验器），改动 client 代码后刷新页面即可生效。

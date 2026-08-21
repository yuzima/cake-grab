# AGENTS.md

Cake Grab（原 Rhythm Cake Snatch）—— 网页端多人抢蛋糕派对游戏。无框架、无构建步骤，Node.js + 原生 HTML/CSS/JS。

## 1. 技术栈

- **服务端**：Node.js（CommonJS），唯一依赖 `ws@^8.18.0`。单文件 `server.js` 同时承担静态文件服务与 WebSocket 游戏逻辑。
- **客户端**：原生 HTML/CSS/JS，单页应用（所有视图都在 `index.html` 中，通过 `.view.active` 切换）。
- **视觉**：Neo-Brutalism（4px 黑描边、硬阴影、Quicksand 字体、黄/粉/青三色）。
- **i18n**：英文为默认，中文走 `/zh` 路径。客户端 `I18N` 字典 + `data-i18n*` 属性，服务端按 `locale` 生成默认名与错误消息。

## 2. 目录结构

```
cake-grab/
├── server.js                  # 服务端（静态服务 + WebSocket 游戏逻辑）
├── package.json               # name: cake-grab; scripts.start = node server.js
├── package-lock.json
├── .gitignore                 # node_modules/, adjusted.webp, cake_hand_transparent.png, input.webp
├── cake_wait_bg.m4a           # 背景音乐源文件（跟踪；public/assets 下还有一份服务用副本）
└── public/
    ├── index.html             # 单页 UI：topbar / home / lobby / game / leaderboard / share modal / toast
    ├── style.css              # Neo-Brutalism 样式
    ├── game.js                # 客户端逻辑（IIFE）：WebSocket、渲染、i18n、音频、竞技场布局
    └── assets/
        ├── avatars/01.png..20.png   # 20 个玩家头像（RGBA 512px）
        ├── hero-cake.png            # 首页蛋糕图（581×482 透明底）
        ├── favicon.webp             # 站点图标
        └── cake_wait_bg.m4a         # 每轮背景音乐（11s AAC）
```

根目录的 `adjusted.webp`、`cake_hand_transparent.png`、`input.webp` 是图片处理的临时源文件，已 gitignore，不提交。

## 3. 架构

### 3.1 服务端（server.js）

- `Room` 类持有房间状态机：`lobby → ready → snatch → reveal → winner → leaderboard`。
- 房间用 `Map<code, Room>` 管理，4 位数字码（1000–9999）。
- 阶段推进用 `Room.schedule(fn, delayMs)` 定时器；`beginSnatch()` 启动一轮，`resolveSnatch()` 结算。
- 每个连接对应一个 `player`（`id / ws / name / avatar / isHost / cakes / pressed / diff / locale`）。
- 静态服务 `serveStatic`：`/`、`/zh`、`/zh/` 都返回 `index.html`；MIME 表含 `.m4a`、`.webp`。

### 3.2 WebSocket 协议

**客户端 → 服务端：**

| type | 载荷 | 说明 |
|---|---|---|
| `create` | `locale` | 创建房间，成为房主 |
| `join` | `code`, `locale` | 加入房间 |
| `ping` | `t0` | 时钟同步（服务端回 `pong`） |
| `update` | `name`, `avatar` | 改名字/头像（仅 lobby） |
| `start` | — | 房主开始游戏 |
| `configure` | `countdownSeconds` | 房主设置倒计时（仅 lobby，值须在选项内） |
| `back_to_lobby` | — | 房主从结算页回到大厅 |
| `snatch` | `pressServerMs` | 抢蛋糕（按服务器时间戳，便于精确计时） |

**服务端 → 客户端：**

| type | 载荷 |
|---|---|
| `welcome` | `selfId`, `roomCode`, `state` |
| `state` | 完整序列化状态 |
| `pong` | `t0`, `serverNow` |
| `error` | `message`（已本地化） |

### 3.3 状态结构（`Room.serialize()`）

```
phase, roomCode, round, maxRounds
countdownSeconds, maxPlayers, minPlayers
hiddenWindow, countdownStart, hiddenAt, zeroAt, lateUntil
holderId, winnerId
results: [{ id, name, avatar, diff, seq }]
players: [{ id, name, avatar, isHost, cakes, pressed, diff }]
```

### 3.4 客户端（game.js）

- IIFE，`el` 集中 DOM 引用；`state` 为最新服务端状态，`selfId` 区分自己。
- `applyState → render → renderLobby/renderGame/renderLeaderboard`，`detectTransitions` 处理音效。
- `updateClock` 在 `requestAnimationFrame` 循环里按 `state.zeroAt/hiddenAt` 渲染倒计时。
- 时钟同步：`ping/pong` 计算 offset（指数平滑），`serverNow() = Date.now() + offset`。
- 音频：Web Audio 合成音效（`AudioFX`）+ HTML5 `<audio>` 背景音乐（`bgMusic`）。

## 4. 游戏规则

- **人数**：2–18 人（`MIN_PLAYERS=2`，`MAX_PLAYERS=18`），房主也参与。
- **轮数**：固定 9 轮（`MAX_ROUNDS=9`），每轮每人只能抢 1 次。
- **倒计时时长**：房主在大厅可选 10 / 15 / 20 / 25 / 30 秒（`COUNTDOWN_OPTIONS`），默认 10。
- **每轮流程**：
  1. `ready` 5 秒（`READY_MS`，倒计时面板隐藏，背景音乐 1 秒后响起）。
  2. `snatch` 倒计时（所选秒数）+ 0 之后 2 秒宽限（`LATE_WINDOW_MS`）。
  3. `reveal` 3 秒（`REVEAL_MS`，显示时差排行）。
  4. `winner` 2 秒（`WINNER_MS`，显示本轮抢到者）。
- **计分**：`diff = 按下时刻 - zeroAt`（毫秒），负=抢早、正=抢晚。本轮胜者 = `min |diff|`；并列取更早按下（`seq` 小者）。胜者 +1 块蛋糕。
- **时差显示**：`fmtDiff` 用 `-`/`+` 前缀 + 秒（如 `-0.60s`），仅在 reveal/winner 阶段显示。
- **倒计时隐藏**：`hiddenWindow = round + (countdownSeconds - 10)`，`hiddenAt = zeroAt - hiddenWindow*1000`。
  - 10s：第 N 轮隐藏最后 N 秒。
  - 15s：第 1 轮隐藏 6 秒（1+5），第 2 轮 7 秒，以此类推。
  - 30s：第 9 轮隐藏 29 秒（只显示「30」1 秒）。
  - 0 及之后完全隐藏。
- **结算**：9 轮后按蛋糕数降序出排行榜，房主可「回到大厅」。
- **操作**：抓取按钮点击或按空格键（`Space`）抢；输入框聚焦时空格不触发；按钮禁用（ready/reveal/已抢）时不触发。

## 5. 关键常量

| 常量 | 值 | 位置 |
|---|---|---|
| `MAX_PLAYERS` / `MIN_PLAYERS` | 18 / 2 | server.js |
| `MAX_ROUNDS` | 9 | server.js |
| `COUNTDOWN_OPTIONS` | [10,15,20,25,30] | server.js |
| `READY_MS` | 5000 | server.js |
| `REVEAL_MS` / `WINNER_MS` | 3000 / 2000 | server.js |
| `LATE_WINDOW_MS` | 2000 | server.js |
| `NAME_MAX` | 16 | server.js |
| `AVATAR_COUNT` | 20 | game.js |

## 6. 运行与部署

```bash
npm install
npm start        # 等价 node server.js，监听 PORT（默认 3000）
```

- 访问 `/` 英文版，`/zh` 中文版。
- Render 部署：Build `npm install`，Start `node server.js`，`PORT` 由平台注入。

## 7. 测试方案

仓库**没有**提交的自动化测试套件；验证以按需、一次性脚本为主（脚本放在 `/tmp`，不入库）。改动后按下面的方式验证，而不是跑全量测试。

### 7.1 语法检查

```bash
node --check server.js
node --check public/game.js
```

### 7.2 服务端逻辑（Node WebSocket 脚本）

用 `ws` 直连游戏服务器，驱动 `create / join / start / configure / snatch`，断言 `state` 里的字段。脚本在 `/tmp` 下，运行时需指定 `ws` 解析路径：

```bash
NODE_PATH=/Users/yuzi/workspace/cake-grab/node_modules node /tmp/xxx-test.js
```

典型断言点：房间号、人数上限、`countdownSeconds`、`hiddenWindow`、`zeroAt - countdownStart`、`hiddenAt`、按下的 `diff`/`pressed`、错误消息本地化。

### 7.3 UI / 渲染（无头 Chrome CDP）

1. `spawn` 本机 Chrome：`--headless=new --remote-debugging-port=<PORT> --user-data-dir=/tmp/...`。
2. `fetch http://127.0.0.1:<PORT>/json` 取页面 `webSocketDebuggerUrl`。
3. 用 `ws` 连接，`Page.navigate` + `Runtime.evaluate` 读取/驱动 DOM（`getComputedStyle`、`textContent`、`classList`、`.click()`、派发 `KeyboardEvent` 等）。
4. 需要真实多玩家时：一个 `ws` 连接当房主 + 浏览器 `?room=<code>` 自动加入当第二人。

常用验证模式：`data-i18n` 文案、倒计时面板隐藏/显示、按钮禁用态、竞技场头像坐标、胜利弹层、空格抢蛋糕、bouncing/动画等。

### 7.4 约定

- 改客户端静态资源记得 bump 缓存号（`index.html` 里的 `style.css?v=`、`game.js?v=`），服务端静态响应已 `Cache-Control: no-cache`，但浏览器仍会缓存。
- 改 `server.js` 后需重启服务（hub 进程 `cakegrab`，`restart`）。
- 声音效果无法在无头环境断言音色，只能靠 `node --check` + 代码走查 + 真机试听。

## 8. 开发约定

- 逻辑集中在 `server.js` / `game.js`；不引入新框架或构建步骤。
- i18n 文案统一走 `I18N` 字典（en/zh）+ `t(key, vars)`，静态 HTML 用 `data-i18n`；不在渲染代码里硬编码中英文字符串。
- 品牌性口号（`CAKE GRAB`、`CAKE GRABBED!`、`GAME OVER!`）两种语言都保持英文。
- 数值/时序规则改在 `server.js` 顶部常量，客户端只消费 `state` 里服务端算好的 `zeroAt/hiddenAt` 等时间点。

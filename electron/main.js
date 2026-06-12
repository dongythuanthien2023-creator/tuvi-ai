// electron/main.js — Tiến trình chính của app desktop Tử Vi
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')

// Nơi lưu cài đặt (API key) — trong thư mục userData của máy, an toàn, không lộ
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json')

function readSettings() {
  try { return JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) }
  catch { return {} }
}

function writeSettings(obj) {
  try { fs.writeFileSync(settingsPath(), JSON.stringify(obj, null, 2)); return true }
  catch { return false }
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0d0d1f',
    title: 'Tử Vi by Thôi',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Bỏ thanh menu mặc định cho gọn
  Menu.setApplicationMenu(null)

  // Khi đóng gói: nạp file build sẵn. Khi dev: nạp localhost.
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL('http://localhost:5173')
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: lưu/đọc API key ────────────────────────────────────────────────────
ipcMain.handle('get-settings', () => readSettings())

ipcMain.handle('save-settings', (_e, obj) => {
  const cur = readSettings()
  return writeSettings({ ...cur, ...obj })
})

// ── Hàm gọi Anthropic bằng module https của Node (ổn định trong Electron) ───
function postAnthropic(apiKey, bodyStr) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
      timeout: 120000,
    }

    console.log('[HTTPS] Bắt đầu gửi request...')
    const req = https.request(options, (res) => {
      console.log('[HTTPS] Đã nhận status:', res.statusCode)
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        console.log('[HTTPS] Đã nhận đủ dữ liệu, độ dài:', data.length)
        try {
          const json = JSON.parse(data)
          if (res.statusCode >= 400) {
            resolve({ error: { message: `HTTP ${res.statusCode}: ${data}` } })
          } else {
            resolve(json)
          }
        } catch (e) {
          resolve({ error: { message: `Lỗi parse response: ${e.message}` } })
        }
      })
    })

    req.on('error', (err) => {
      console.error('[HTTPS] Lỗi request:', err.message)
      resolve({ error: { message: `Lỗi kết nối: ${err.message}` } })
    })

    req.on('timeout', () => {
      console.error('[HTTPS] Timeout sau 120 giây')
      req.destroy()
      resolve({ error: { message: 'Request timeout sau 120 giây' } })
    })

    req.write(bodyStr)
    req.end()
  })
}

// ── IPC: gọi Anthropic API ──────────────────────────────────────────────────
ipcMain.handle('call-claude', async (_e, { messages, maxTokens }) => {
  const settings = readSettings()
  const apiKey = settings.apiKey
  if (!apiKey) return { error: { message: 'Chưa cấu hình API key. Vào Cài đặt để nhập.' } }

  const bodyStr = JSON.stringify({
    model: settings.model || 'claude-sonnet-4-6',
    max_tokens: maxTokens || 8000,
    messages,
  })

  // Thử tối đa 3 lần
  let last = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[CALL] Lần thử ${attempt}`)
    last = await postAnthropic(apiKey, bodyStr)
    if (!last.error) return last
    console.error(`[CALL] Lần ${attempt} lỗi:`, last.error.message)
    await new Promise(r => setTimeout(r, 2000))
  }
  return last
})

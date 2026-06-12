// electron/main.js — Tiến trình chính của app desktop Tử Vi
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

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

// ── IPC: gọi thẳng Anthropic API (có Structured Outputs + retry) ────────────
ipcMain.handle('call-claude', async (_e, { messages, maxTokens }) => {
  const settings = readSettings()
  const apiKey = settings.apiKey
  if (!apiKey) return { error: { message: 'Chưa cấu hình API key. Vào Cài đặt để nhập.' } }

  // Schema ép model trả JSON đúng cấu trúc — không bao giờ vỡ cú pháp
  const mucSchema = {
    type: 'object',
    properties: {
      so: { type: 'integer' },
      ten: { type: 'string' },
      diem: { type: 'integer' },
      tags: { type: 'array', items: { type: 'string' } },
      noidung: { type: 'string' },
      loiKhuyen: { type: 'string' },
      canhBao: { type: 'string' },
    },
    required: ['so', 'ten', 'diem', 'tags', 'noidung', 'loiKhuyen', 'canhBao'],
    additionalProperties: false,
  }
  const tongQuanSchema = {
    type: 'object',
    properties: {
      sucNghiep: { type: 'integer' }, taiLoc: { type: 'integer' },
      tinhDuyen: { type: 'integer' }, giaDao: { type: 'integer' },
      sucKhoe: { type: 'integer' },
      giaiDoanVang: { type: 'string' }, diemManhNhat: { type: 'string' },
      diemYeuNhat: { type: 'string' }, tomluat: { type: 'string' },
      thongDiepNam: { type: 'string' },
    },
    required: ['sucNghiep','taiLoc','tinhDuyen','giaDao','sucKhoe','giaiDoanVang','diemManhNhat','diemYeuNhat','tomluat','thongDiepNam'],
    additionalProperties: false,
  }
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      muc: { type: 'array', items: mucSchema },
      tongQuan: tongQuanSchema,
    },
    required: ['title', 'muc'],
    additionalProperties: false,
  }

  const body = JSON.stringify({
    model: settings.model || 'claude-sonnet-4-6',
    max_tokens: maxTokens || 8000,
    messages,
  })

  // Thử tối đa 3 lần, mỗi lần timeout 120 giây
  let lastErr = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 120000)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      if (!res.ok) {
        return { error: { message: `HTTP ${res.status}: ${JSON.stringify(data)}` } }
      }
      return data
    } catch (err) {
      clearTimeout(timer)
      lastErr = err
      console.error(`Lần gọi ${attempt} thất bại:`, err.message)
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  return { error: { message: `Gọi API thất bại sau 3 lần: ${lastErr?.message || 'unknown'}` } }
})

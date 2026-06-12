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

// ── IPC: gọi thẳng Anthropic API (không qua proxy) ──────────────────────────
ipcMain.handle('call-claude', async (_e, { messages, maxTokens }) => {
  const settings = readSettings()
  const apiKey = settings.apiKey
  if (!apiKey) return { error: { message: 'Chưa cấu hình API key. Vào Cài đặt để nhập.' } }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: settings.model || 'claude-sonnet-4-6',
        max_tokens: maxTokens || 8000,
        messages,
      }),
    })
    const data = await res.json()
    return data
  } catch (err) {
    return { error: { message: err.message } }
  }
})

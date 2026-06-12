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

// ── Gọi Anthropic bằng STREAMING (ổn định cho output dài) ───────────────────
function postAnthropicStream(apiKey, bodyStr) {
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
      timeout: 180000, // 3 phút - dư cho output dài
    }

    console.log('[STREAM] Bắt đầu gửi request...')
    const req = https.request(options, (res) => {
      console.log('[STREAM] Status:', res.statusCode)

      // Nếu lỗi HTTP, gom toàn bộ body để báo lỗi
      if (res.statusCode >= 400) {
        let errData = ''
        res.on('data', (c) => { errData += c })
        res.on('end', () => resolve({ error: { message: `HTTP ${res.statusCode}: ${errData}` } }))
        return
      }

      let fullText = ''
      let buffer = ''

      res.on('data', (chunk) => {
        buffer += chunk.toString()
        // SSE: mỗi event cách nhau bằng "\n\n", mỗi dòng data bắt đầu bằng "data: "
        const lines = buffer.split('\n')
        buffer = lines.pop() // giữ lại dòng chưa hoàn chỉnh

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]') continue
          try {
            const evt = JSON.parse(payload)
            // Gom text từ các event content_block_delta
            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
              fullText += evt.delta.text
            }
            // Bắt lỗi giữa stream
            if (evt.type === 'error') {
              console.error('[STREAM] Lỗi trong stream:', evt.error?.message)
            }
          } catch {
            // bỏ qua dòng không parse được (vd: event ping)
          }
        }
      })

      res.on('end', () => {
        console.log('[STREAM] Hoàn tất, độ dài text:', fullText.length)
        if (!fullText) {
          resolve({ error: { message: 'Stream kết thúc nhưng không có nội dung' } })
        } else {
          // Trả về cùng cấu trúc như non-streaming để api.js xử lý không đổi
          resolve({ content: [{ type: 'text', text: fullText }] })
        }
      })
    })

    req.on('error', (err) => {
      console.error('[STREAM] Lỗi request:', err.message)
      resolve({ error: { message: `Lỗi kết nối: ${err.message}` } })
    })

    req.on('timeout', () => {
      console.error('[STREAM] Timeout sau 180 giây')
      req.destroy()
      resolve({ error: { message: 'Request timeout sau 180 giây' } })
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

  // Schema ép JSON đúng cấu trúc
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

  const bodyStr = JSON.stringify({
    model: settings.model || 'claude-sonnet-4-6',
    max_tokens: maxTokens || 8000,
    messages,
    stream: true,
    output_config: {
      format: {
        type: 'json_schema',
        schema,
      },
    },
  })

  // Thử tối đa 3 lần
  let last = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[CALL] Lần thử ${attempt}`)
    last = await postAnthropicStream(apiKey, bodyStr)
    if (!last.error) return last
    console.error(`[CALL] Lần ${attempt} lỗi:`, last.error.message)
    await new Promise(r => setTimeout(r, 2000))
  }
  return last
})

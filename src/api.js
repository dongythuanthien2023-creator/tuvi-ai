// api.js — Gọi Claude API. Tự nhận biết đang chạy desktop hay web.
const WORKER_URL = 'https://tuvi-proxy-v2.dongythuanthien2023.workers.dev'
const isDesktop = typeof window !== 'undefined' && window.tuviAPI?.isDesktop

export async function callClaude(messages, maxTokens = 8000) {
  // ── Chế độ DESKTOP: gọi thẳng Anthropic (không timeout, không proxy) ──
  if (isDesktop) {
    const data = await window.tuviAPI.callClaude(messages, maxTokens)
    if (data.error) throw new Error(data.error.message)
    return data.content?.find(b => b.type === 'text')?.text || ''
  }

  // ── Chế độ WEB: qua Cloudflare Worker (giữ để test trên trình duyệt) ──
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      messages,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content?.find(b => b.type === 'text')?.text || ''
}

export function parseJSON(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return JSON.parse(text.slice(start, end + 1))
}

// Tiện ích cho phần Cài đặt (chỉ dùng ở desktop)
export const settings = {
  isDesktop,
  get: () => isDesktop ? window.tuviAPI.getSettings() : Promise.resolve({}),
  save: (obj) => isDesktop ? window.tuviAPI.saveSettings(obj) : Promise.resolve(false),
}

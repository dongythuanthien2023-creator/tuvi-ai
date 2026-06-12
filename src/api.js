// api.js — Gọi Claude API. Tự nhận biết đang chạy desktop hay web.
const WORKER_URL = 'https://tuvi-proxy-v2.dongythuanthien2023.workers.dev'
const isDesktop = typeof window !== 'undefined' && window.tuviAPI?.isDesktop

export async function callClaude(messages, maxTokens = 8000) {
  // ── Chế độ DESKTOP: gọi thẳng Anthropic (không timeout, không proxy) ──
  if (isDesktop) {
    const data = await window.tuviAPI.callClaude(messages, maxTokens)
    console.log('RESPONSE THÔ TỪ API:', data)
    if (data.error) throw new Error(data.error.message)
    return data.content?.find(b => b.type === 'text')?.text || ''
  }

  // ── Chế độ WEB: qua Cloudflare Worker (giữ để test trên trình duyệt) ──
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
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
  let raw = text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '')
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) {
    console.error('PARSE FAIL - không tìm thấy JSON. Response thô:', text)
    throw new Error('No JSON found')
  }
  let slice = raw.slice(start, end + 1)
  try {
    return JSON.parse(slice)
  } catch (err) {
    try {
      const fixed = slice.replace(/,(\s*[}\]])/g, '$1').replace(/\r/g, '')
      return JSON.parse(fixed)
    } catch (err2) {
      console.error('PARSE FAIL sau khi sửa:', err2.message)
      console.error('Nội dung:', slice)
      throw err2
    }
  }
}

// Tiện ích cho phần Cài đặt (chỉ dùng ở desktop)
export const settings = {
  isDesktop,
  get: () => isDesktop ? window.tuviAPI.getSettings() : Promise.resolve({}),
  save: (obj) => isDesktop ? window.tuviAPI.saveSettings(obj) : Promise.resolve(false),
}

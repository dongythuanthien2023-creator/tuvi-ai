const WORKER_URL = 'https://tuvi-proxy.dongythuanthien2023.workers.dev'

export async function callClaude(messages, maxTokens = 4000) {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
model: 'claude-haiku-4-5-20251001',      max_tokens: maxTokens,
      messages,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content?.find(b => b.type === 'text')?.text || ''
}

export function parseJSON(text) {
  // Tìm JSON object đầu tiên trong response
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return JSON.parse(text.slice(start, end + 1))
}

// electron/preload.js — Cầu nối an toàn giữa giao diện (React) và tiến trình chính
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tuviAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (obj) => ipcRenderer.invoke('save-settings', obj),
  callClaude: (messages, maxTokens) => ipcRenderer.invoke('call-claude', { messages, maxTokens }),
  isDesktop: true,
})

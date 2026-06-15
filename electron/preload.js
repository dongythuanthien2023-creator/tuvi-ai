// electron/preload.js — Cầu nối an toàn giữa giao diện (React) và tiến trình chính
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tuviAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (obj) => ipcRenderer.invoke('save-settings', obj),
  callClaude: (messages, maxTokens) => ipcRenderer.invoke('call-claude', { messages, maxTokens }),
  printToPDF: (suggestedName) => ipcRenderer.invoke('print-to-pdf', suggestedName),
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveHistory: (record) => ipcRenderer.invoke('save-history', record),
  deleteHistory: (savedAt) => ipcRenderer.invoke('delete-history', savedAt),
  isDesktop: true,
})
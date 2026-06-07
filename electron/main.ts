import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'

process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

let win: BrowserWindow | null
const preload = path.join(__dirname, 'preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(process.env.DIST, 'index.html')

function createWindow(): void {
  win = new BrowserWindow({
    title: '播客剪辑工作台',
    icon: path.join(process.env.PUBLIC, 'favicon.ico'),
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    frame: true,
    backgroundColor: '#0f141f',
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url)
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  win.on('closed', () => {
    win = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

ipcMain.handle('dialog:openAudioFiles', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '音频文件', extensions: ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'] },
    ],
  })
  return result.filePaths
})

ipcMain.handle('dialog:saveFile', async (_event, options: { defaultPath: string; filters: any[] }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: options.defaultPath,
    filters: options.filters,
  })
  return result.filePath
})

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  return result.filePaths[0]
})

ipcMain.on('window:minimize', () => {
  win?.minimize()
})

ipcMain.on('window:maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window:close', () => {
  win?.close()
})

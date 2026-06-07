import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openAudioFiles: () => ipcRenderer.invoke('dialog:openAudioFiles'),
  saveFile: (options: { defaultPath: string; filters: any[] }) => 
    ipcRenderer.invoke('dialog:saveFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
})

export {}

export {}

declare global {
  interface Window {
    electronAPI?: {
      openAudioFiles: () => Promise<string[]>
      saveFile: (options: { defaultPath: string; filters: any[] }) => Promise<string | undefined>
      openDirectory: () => Promise<string | undefined>
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}

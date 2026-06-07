import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type PanelLayout = 'two-column' | 'three-column' | 'focus'

interface UIState {
  activePanel: string
  panelLayout: PanelLayout
  showImportPanel: boolean
  showTimelinePanel: boolean
  showTextPanel: boolean
  showClipsPanel: boolean
  showExportPanel: boolean
  zoomLevel: number
  theme: 'dark' | 'light'
}

const initialState: UIState = {
  activePanel: 'import',
  panelLayout: 'three-column',
  showImportPanel: true,
  showTimelinePanel: true,
  showTextPanel: true,
  showClipsPanel: true,
  showExportPanel: false,
  zoomLevel: 1,
  theme: 'dark',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActivePanel: (state, action: PayloadAction<string>) => {
      state.activePanel = action.payload
    },
    setPanelLayout: (state, action: PayloadAction<PanelLayout>) => {
      state.panelLayout = action.payload
    },
    togglePanel: (
      state,
      action: PayloadAction<'import' | 'timeline' | 'text' | 'clips' | 'export'>
    ) => {
      const key = `show${action.payload.charAt(0).toUpperCase() + action.payload.slice(1)}Panel` as keyof UIState
      ;(state[key] as boolean) = !state[key]
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = Math.max(0.5, Math.min(3, action.payload))
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
  },
})

export const { setActivePanel, setPanelLayout, togglePanel, setZoomLevel, toggleTheme } =
  uiSlice.actions

export default uiSlice.reducer

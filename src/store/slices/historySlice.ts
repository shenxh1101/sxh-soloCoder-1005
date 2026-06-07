import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'
import type { ProjectVersion, ProjectState } from '@/types'

const STORAGE_KEY = 'podcast-editor-history'

interface HistoryState {
  versions: ProjectVersion[]
  currentVersionId: string | null
  maxVersions: number
  isLoaded: boolean
}

function loadHistoryFromStorage(): ProjectVersion[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('加载历史版本失败:', e)
  }
  return []
}

function saveHistoryToStorage(versions: ProjectVersion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions))
  } catch (e) {
    console.error('保存历史版本失败:', e)
  }
}

const initialState: HistoryState = {
  versions: [],
  currentVersionId: null,
  maxVersions: 50,
  isLoaded: false,
}

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    saveVersion: (
      state,
      action: PayloadAction<{
        name: string
        description: string
        snapshot: ProjectState
      }>
    ) => {
      const newVersion: ProjectVersion = {
        id: uuidv4(),
        name: action.payload.name,
        description: action.payload.description,
        createdAt: new Date().toISOString(),
        snapshot: action.payload.snapshot,
      }
      state.versions.unshift(newVersion)
      state.currentVersionId = newVersion.id
      
      if (state.versions.length > state.maxVersions) {
        state.versions = state.versions.slice(0, state.maxVersions)
      }
      
      saveHistoryToStorage(state.versions)
    },
    
    restoreVersion: (state, action: PayloadAction<string>) => {
      state.currentVersionId = action.payload
    },
    
    deleteVersion: (state, action: PayloadAction<string>) => {
      state.versions = state.versions.filter((v) => v.id !== action.payload)
      if (state.currentVersionId === action.payload) {
        state.currentVersionId = state.versions[0]?.id || null
      }
      
      saveHistoryToStorage(state.versions)
    },
    
    clearHistory: (state) => {
      state.versions = []
      state.currentVersionId = null
      saveHistoryToStorage([])
    },
    
    loadHistoryFromStorageAction: (state) => {
      if (!state.isLoaded) {
        const storedVersions = loadHistoryFromStorage()
        state.versions = storedVersions
        state.currentVersionId = storedVersions[0]?.id || null
        state.isLoaded = true
      }
    },
  },
})

export const { saveVersion, restoreVersion, deleteVersion, clearHistory, loadHistoryFromStorageAction } = historySlice.actions

export default historySlice.reducer

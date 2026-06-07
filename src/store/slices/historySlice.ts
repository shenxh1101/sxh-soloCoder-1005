import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'
import type { ProjectVersion, ProjectState } from '@/types'

interface HistoryState {
  versions: ProjectVersion[]
  currentVersionId: string | null
  maxVersions: number
}

const initialState: HistoryState = {
  versions: [],
  currentVersionId: null,
  maxVersions: 50,
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
    },
    
    restoreVersion: (state, action: PayloadAction<string>) => {
      state.currentVersionId = action.payload
    },
    
    deleteVersion: (state, action: PayloadAction<string>) => {
      state.versions = state.versions.filter((v) => v.id !== action.payload)
      if (state.currentVersionId === action.payload) {
        state.currentVersionId = state.versions[0]?.id || null
      }
    },
    
    clearHistory: (state) => {
      state.versions = []
      state.currentVersionId = null
    },
  },
})

export const { saveVersion, restoreVersion, deleteVersion, clearHistory } = historySlice.actions

export default historySlice.reducer

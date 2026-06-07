import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import projectReducer from './slices/projectSlice'
import playbackReducer from './slices/playbackSlice'
import uiReducer from './slices/uiSlice'
import historyReducer from './slices/historySlice'

export const store = configureStore({
  reducer: {
    project: projectReducer,
    playback: playbackReducer,
    ui: uiReducer,
    history: historyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

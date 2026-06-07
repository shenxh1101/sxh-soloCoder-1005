import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PlaybackState } from '@/types'

const initialState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  volume: 0.8,
  isMuted: false,
}

const playbackSlice = createSlice({
  name: 'playback',
  initialState,
  reducers: {
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload
    },
    setPlaybackRate: (state, action: PayloadAction<number>) => {
      state.playbackRate = action.payload
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload
      if (action.payload > 0) {
        state.isMuted = false
      }
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted
    },
    resetPlayback: (state) => {
      state.isPlaying = false
      state.currentTime = 0
      state.duration = 0
    },
  },
})

export const {
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setPlaybackRate,
  setVolume,
  toggleMute,
  resetPlayback,
} = playbackSlice.actions

export default playbackSlice.reducer

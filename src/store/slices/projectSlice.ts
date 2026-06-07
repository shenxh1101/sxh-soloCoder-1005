import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'
import type { AudioFile, TranscriptSegment, Marker, Clip, Speaker } from '@/types'
import { generateMockTranscript } from '@/utils/mockData'

interface ProjectState {
  audioFiles: AudioFile[]
  segments: TranscriptSegment[]
  markers: Marker[]
  clips: Clip[]
  speakers: Speaker[]
  currentAudioFileId: string | null
  searchQuery: string
  isGeneratingTranscript: boolean
}

const initialState: ProjectState = {
  audioFiles: [],
  segments: [],
  markers: [],
  clips: [],
  speakers: [
    { id: 'spk_0', name: '说话人 1', color: '#3b82f6' },
    { id: 'spk_1', name: '说话人 2', color: '#10b981' },
    { id: 'spk_2', name: '说话人 3', color: '#f59e0b' },
  ],
  currentAudioFileId: null,
  searchQuery: '',
  isGeneratingTranscript: false,
}

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    addAudioFiles: (state, action: PayloadAction<{ paths: string[] }>) => {
      const newFiles: AudioFile[] = action.payload.paths.map((path) => {
        const name = path.split('\\').pop() || path.split('/').pop() || '未知文件'
        const duration = Math.random() * 3600 + 600
        return {
          id: uuidv4(),
          name,
          path,
          duration,
          sampleRate: 44100,
          size: Math.floor(Math.random() * 100000000 + 10000000),
          importedAt: new Date().toISOString(),
        }
      })
      state.audioFiles.push(...newFiles)
      if (!state.currentAudioFileId && newFiles.length > 0) {
        state.currentAudioFileId = newFiles[0].id
      }
    },

    removeAudioFile: (state, action: PayloadAction<string>) => {
      const fileId = action.payload
      state.audioFiles = state.audioFiles.filter((f) => f.id !== fileId)
      state.segments = state.segments.filter((s) => s.audioFileId !== fileId)
      state.markers = state.markers.filter((m) => m.audioFileId !== fileId)
      state.clips = state.clips.filter((c) => c.audioFileId !== fileId)
      if (state.currentAudioFileId === fileId) {
        state.currentAudioFileId = state.audioFiles[0]?.id || null
      }
    },

    setCurrentAudioFile: (state, action: PayloadAction<string | null>) => {
      state.currentAudioFileId = action.payload
    },

    generateTranscript: (state, action: PayloadAction<string>) => {
      const audioFileId = action.payload
      const audioFile = state.audioFiles.find((f) => f.id === audioFileId)
      if (audioFile) {
        state.isGeneratingTranscript = true
        const segments = generateMockTranscript(audioFileId, audioFile.duration, state.speakers)
        state.segments = [...state.segments.filter((s) => s.audioFileId !== audioFileId), ...segments]
        state.isGeneratingTranscript = false
      }
    },

    updateSegmentText: (state, action: PayloadAction<{ id: string; text: string }>) => {
      const segment = state.segments.find((s) => s.id === action.payload.id)
      if (segment) {
        segment.text = action.payload.text
      }
    },

    updateSegmentSpeaker: (state, action: PayloadAction<{ id: string; speaker: string }>) => {
      const segment = state.segments.find((s) => s.id === action.payload.id)
      if (segment) {
        segment.speaker = action.payload.speaker
      }
    },

    mergeSegments: (state, action: PayloadAction<string[]>) => {
      const ids = action.payload
      if (ids.length < 2) return

      const segmentsToMerge = state.segments
        .filter((s) => ids.includes(s.id))
        .sort((a, b) => a.startTime - b.startTime)

      if (segmentsToMerge.length < 2) return

      const mergedSegment: TranscriptSegment = {
        id: uuidv4(),
        audioFileId: segmentsToMerge[0].audioFileId,
        startTime: segmentsToMerge[0].startTime,
        endTime: segmentsToMerge[segmentsToMerge.length - 1].endTime,
        text: segmentsToMerge.map((s) => s.text).join(' '),
        speaker: segmentsToMerge[0].speaker,
        confidence: segmentsToMerge.reduce((acc, s) => acc + s.confidence, 0) / segmentsToMerge.length,
        annotations: segmentsToMerge.flatMap((s) => s.annotations),
        isDeleted: segmentsToMerge.some((s) => s.isDeleted),
        isHighlight: segmentsToMerge.some((s) => s.isHighlight),
        isAd: segmentsToMerge.some((s) => s.isAd),
      }

      state.segments = [
        ...state.segments.filter((s) => !ids.includes(s.id)),
        mergedSegment,
      ].sort((a, b) => a.startTime - b.startTime)
    },

    splitSegment: (state, action: PayloadAction<{ id: string; splitTime: number }>) => {
      const segment = state.segments.find((s) => s.id === action.payload.id)
      if (!segment) return

      const midTextIndex = Math.floor(segment.text.length / 2)
      const text1 = segment.text.slice(0, midTextIndex).trim()
      const text2 = segment.text.slice(midTextIndex).trim()

      const segment1: TranscriptSegment = {
        ...segment,
        id: uuidv4(),
        endTime: action.payload.splitTime,
        text: text1,
      }

      const segment2: TranscriptSegment = {
        ...segment,
        id: uuidv4(),
        startTime: action.payload.splitTime,
        text: text2,
      }

      state.segments = [
        ...state.segments.filter((s) => s.id !== action.payload.id),
        segment1,
        segment2,
      ].sort((a, b) => a.startTime - b.startTime)
    },

    toggleSegmentHighlight: (state, action: PayloadAction<string>) => {
      const segment = state.segments.find((s) => s.id === action.payload)
      if (segment) {
        segment.isHighlight = !segment.isHighlight
      }
    },

    toggleSegmentDeleted: (state, action: PayloadAction<string>) => {
      const segment = state.segments.find((s) => s.id === action.payload)
      if (segment) {
        segment.isDeleted = !segment.isDeleted
      }
    },

    toggleSegmentAd: (state, action: PayloadAction<string>) => {
      const segment = state.segments.find((s) => s.id === action.payload)
      if (segment) {
        segment.isAd = !segment.isAd
      }
    },

    addAnnotation: (
      state,
      action: PayloadAction<{
        segmentId: string
        type: 'comment' | 'noise' | 'important' | 'todo'
        content: string
      }>
    ) => {
      const segment = state.segments.find((s) => s.id === action.payload.segmentId)
      if (segment) {
        segment.annotations.push({
          id: uuidv4(),
          type: action.payload.type,
          content: action.payload.content,
          createdAt: new Date().toISOString(),
          createdBy: '用户',
        })
      }
    },

    removeAnnotation: (state, action: PayloadAction<{ segmentId: string; annotationId: string }>) => {
      const segment = state.segments.find((s) => s.id === action.payload.segmentId)
      if (segment) {
        segment.annotations = segment.annotations.filter((a) => a.id !== action.payload.annotationId)
      }
    },

    addMarker: (
      state,
      action: PayloadAction<{
        audioFileId: string
        time: number
        type: 'important' | 'noise' | 'ad' | 'bookmark'
        label: string
      }>
    ) => {
      const colors = {
        important: '#ef4444',
        noise: '#f59e0b',
        ad: '#8b5cf6',
        bookmark: '#3b82f6',
      }
      state.markers.push({
        id: uuidv4(),
        audioFileId: action.payload.audioFileId,
        time: action.payload.time,
        type: action.payload.type,
        label: action.payload.label,
        color: colors[action.payload.type],
      })
    },

    removeMarker: (state, action: PayloadAction<string>) => {
      state.markers = state.markers.filter((m) => m.id !== action.payload)
    },

    addClip: (
      state,
      action: PayloadAction<{
        segmentIds: string[]
        category: 'golden' | 'to-delete' | 'ad' | 'custom'
        title: string
        description: string
      }>
    ) => {
      const segments = state.segments.filter((s) => action.payload.segmentIds.includes(s.id))
      if (segments.length === 0) return

      const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime)
      const clip: Clip = {
        id: uuidv4(),
        segmentIds: action.payload.segmentIds,
        audioFileId: sortedSegments[0].audioFileId,
        startTime: sortedSegments[0].startTime,
        endTime: sortedSegments[sortedSegments.length - 1].endTime,
        title: action.payload.title,
        description: action.payload.description,
        category: action.payload.category,
        createdAt: new Date().toISOString(),
        tags: [],
      }
      state.clips.push(clip)
    },

    removeClip: (state, action: PayloadAction<string>) => {
      state.clips = state.clips.filter((c) => c.id !== action.payload)
    },

    updateClip: (
      state,
      action: PayloadAction<{
        id: string
        title?: string
        description?: string
        category?: 'golden' | 'to-delete' | 'ad' | 'custom'
      }>
    ) => {
      const clip = state.clips.find((c) => c.id === action.payload.id)
      if (clip) {
        if (action.payload.title) clip.title = action.payload.title
        if (action.payload.description) clip.description = action.payload.description
        if (action.payload.category) clip.category = action.payload.category
      }
    },

    updateSpeaker: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const speaker = state.speakers.find((s) => s.id === action.payload.id)
      if (speaker) {
        speaker.name = action.payload.name
      }
    },

    addSpeaker: (state, action: PayloadAction<{ name: string }>) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
      state.speakers.push({
        id: `spk_${state.speakers.length}`,
        name: action.payload.name,
        color: colors[state.speakers.length % colors.length],
      })
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    loadProjectState: (
      state,
      action: PayloadAction<{
        audioFiles: AudioFile[]
        segments: TranscriptSegment[]
        markers: Marker[]
        clips: Clip[]
        speakers: Speaker[]
      }>
    ) => {
      state.audioFiles = action.payload.audioFiles
      state.segments = action.payload.segments
      state.markers = action.payload.markers
      state.clips = action.payload.clips
      state.speakers = action.payload.speakers
    },
  },
})

export const {
  addAudioFiles,
  removeAudioFile,
  setCurrentAudioFile,
  generateTranscript,
  updateSegmentText,
  updateSegmentSpeaker,
  mergeSegments,
  splitSegment,
  toggleSegmentHighlight,
  toggleSegmentDeleted,
  toggleSegmentAd,
  addAnnotation,
  removeAnnotation,
  addMarker,
  removeMarker,
  addClip,
  removeClip,
  updateClip,
  updateSpeaker,
  addSpeaker,
  setSearchQuery,
  loadProjectState,
} = projectSlice.actions

export default projectSlice.reducer

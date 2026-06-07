export interface AudioFile {
  id: string
  name: string
  path: string
  duration: number
  sampleRate: number
  size: number
  importedAt: string
}

export interface TranscriptSegment {
  id: string
  audioFileId: string
  startTime: number
  endTime: number
  text: string
  speaker: string
  confidence: number
  annotations: Annotation[]
  isDeleted: boolean
  isHighlight: boolean
  isAd: boolean
}

export interface Annotation {
  id: string
  type: 'comment' | 'noise' | 'important' | 'todo'
  content: string
  createdAt: string
  createdBy: string
}

export interface Marker {
  id: string
  audioFileId: string
  time: number
  type: 'important' | 'noise' | 'ad' | 'bookmark'
  label: string
  color: string
}

export interface Clip {
  id: string
  segmentIds: string[]
  audioFileId: string
  startTime: number
  endTime: number
  title: string
  description: string
  category: 'golden' | 'to-delete' | 'ad' | 'custom'
  createdAt: string
  tags: string[]
  collectionId: string | null
}

export interface ClipCollection {
  id: string
  title: string
  description: string
  clipIds: string[]
  createdAt: string
  color: string
}

export interface ExportOptions {
  exportTranscript: boolean
  exportClips: boolean
  exportSubtitles: boolean
  exportEditSuggestions: boolean
  transcriptFormat: 'txt' | 'docx' | 'srt' | 'vtt'
  includeTimecodes: boolean
  includeSpeakerNames: boolean
  includeAnnotations: boolean
  includeDeletedSegments: boolean
  includeHeader: boolean
  clipGroupBy: 'category' | 'tag' | 'collection'
}

export interface ProjectVersion {
  id: string
  name: string
  description: string
  createdAt: string
  snapshot: ProjectState
}

export interface ProjectState {
  audioFiles: AudioFile[]
  segments: TranscriptSegment[]
  markers: Marker[]
  clips: Clip[]
  collections: ClipCollection[]
  speakers: Speaker[]
  currentAudioFileId: string | null
  searchQuery: string
  isGeneratingTranscript: boolean
  selectedSegmentIds: string[]
  filterSpeakerId: string | null
  playbackState: PlaybackState
}

export interface Speaker {
  id: string
  name: string
  color: string
  avatar?: string
}

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  isMuted: boolean
}

export interface SearchResult {
  segment: TranscriptSegment
  matchIndices: number[]
  matchText: string
}

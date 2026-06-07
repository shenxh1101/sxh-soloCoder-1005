import { useEffect, useRef, useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Gauge,
  Flag,
  AlertTriangle,
  Megaphone,
  Bookmark,
} from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setPlaybackRate,
  setVolume,
  toggleMute,
} from '@/store/slices/playbackSlice'
import { addMarker } from '@/store/slices/projectSlice'
import { formatTime } from '@/utils/time'

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

export default function TimelinePanel() {
  const dispatch = useAppDispatch()
  const project = useAppSelector((state) => state.project)
  const playback = useAppSelector((state) => state.playback)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [showRateMenu, setShowRateMenu] = useState(false)

  const currentAudioFile = project.audioFiles.find(
    (f) => f.id === project.currentAudioFileId
  )
  const currentMarkers = project.markers.filter(
    (m) => m.audioFileId === project.currentAudioFileId
  )
  const currentSegments = project.segments.filter(
    (s) => s.audioFileId === project.currentAudioFileId
  )

  useEffect(() => {
    if (!waveformRef.current) return

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#475569',
      progressColor: '#0ea5e9',
      cursorColor: '#38bdf8',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 120,
      normalize: true,
    })

    wavesurferRef.current.on('ready', () => {
      const duration = wavesurferRef.current?.getDuration() || 0
      dispatch(setDuration(duration))
    })

    wavesurferRef.current.on('timeupdate', (time) => {
      dispatch(setCurrentTime(time))
    })

    wavesurferRef.current.on('play', () => {
      dispatch(setIsPlaying(true))
    })

    wavesurferRef.current.on('pause', () => {
      dispatch(setIsPlaying(false))
    })

    return () => {
      wavesurferRef.current?.destroy()
    }
  }, [dispatch])

  useEffect(() => {
    if (wavesurferRef.current && currentAudioFile) {
      wavesurferRef.current.load(currentAudioFile.path)
    }
  }, [currentAudioFile])

  const togglePlay = () => {
    wavesurferRef.current?.playPause()
  }

  const skipBackward = () => {
    wavesurferRef.current?.skip(-5)
  }

  const skipForward = () => {
    wavesurferRef.current?.skip(5)
  }

  const handleAddMarker = (type: 'important' | 'noise' | 'ad' | 'bookmark') => {
    if (!project.currentAudioFileId) return

    const labels = {
      important: '重点标记',
      noise: '噪音',
      ad: '广告',
      bookmark: '书签',
    }

    dispatch(
      addMarker({
        audioFileId: project.currentAudioFileId,
        time: playback.currentTime,
        type,
        label: labels[type],
      })
    )
  }

  const currentSegment = currentSegments.find(
    (s) =>
      playback.currentTime >= s.startTime && playback.currentTime < s.endTime
  )

  const speaker = project.speakers.find((s) => s.id === currentSegment?.speaker)

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title">
          <Gauge className="w-4 h-4 text-primary-400" />
          时间轴
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">
            {formatTime(playback.currentTime)} / {formatTime(playback.duration)}
          </span>
          {currentSegment && speaker && (
            <span
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: speaker.color + '30', color: speaker.color }}
            >
              {speaker.name}
            </span>
          )}
        </div>
      </div>

      <div className="panel-content flex-1 flex flex-col">
        <div
          ref={waveformRef}
          className="w-full flex-1 bg-dark-200 rounded-lg relative overflow-hidden"
        >
          {currentMarkers.map((marker) => (
            <div
              key={marker.id}
              className="absolute top-0 bottom-0 w-1 cursor-pointer group"
              style={{
                left: `${(marker.time / playback.duration) * 100}%`,
                backgroundColor: marker.color,
              }}
              title={`${marker.label} - ${formatTime(marker.time)}`}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                {marker.label} - {formatTime(marker.time)}
              </div>
            </div>
          ))}

          {currentSegments.map((segment) => {
            const segmentSpeaker = project.speakers.find((s) => s.id === segment.speaker)
            return (
              <div
                key={segment.id}
                className="absolute bottom-0 h-2 opacity-30"
                style={{
                  left: `${(segment.startTime / playback.duration) * 100}%`,
                  width: `${((segment.endTime - segment.startTime) / playback.duration) * 100}%`,
                  backgroundColor: segmentSpeaker?.color || '#666',
                }}
              />
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost p-2"
              onClick={skipBackward}
              title="后退5秒"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              className="btn btn-primary w-12 h-12 rounded-full p-0"
              onClick={togglePlay}
            >
              {playback.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>
            <button
              className="btn btn-ghost p-2"
              onClick={skipForward}
              title="前进5秒"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="relative ml-4">
              <button
                className="btn btn-secondary text-xs py-1.5 px-3"
                onClick={() => setShowRateMenu(!showRateMenu)}
              >
                {playback.playbackRate}x
              </button>
              {showRateMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-dark-200 border border-gray-700 rounded-lg overflow-hidden z-10">
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      className={`block w-full px-4 py-2 text-xs text-left hover:bg-dark-100 ${
                        playback.playbackRate === rate
                          ? 'text-primary-400 bg-primary-400/10'
                          : 'text-gray-300'
                      }`}
                      onClick={() => {
                        dispatch(setPlaybackRate(rate))
                        wavesurferRef.current?.setPlaybackRate(rate)
                        setShowRateMenu(false)
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-dark-200 rounded-lg px-3 py-1.5">
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  const newMutedState = !playback.isMuted
                  dispatch(toggleMute())
                  wavesurferRef.current?.setMuted(newMutedState)
                }}
              >
                {playback.isMuted || playback.volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playback.isMuted ? 0 : playback.volume}
                onChange={(e) => {
                  const volume = parseFloat(e.target.value)
                  dispatch(setVolume(volume))
                  wavesurferRef.current?.setVolume(volume)
                }}
                className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            <div className="h-6 w-px bg-gray-700 mx-1" />

            <button
              className="btn btn-ghost p-2"
              onClick={() => handleAddMarker('important')}
              title="标记重点"
            >
              <Flag className="w-4 h-4 text-red-400" />
            </button>
            <button
              className="btn btn-ghost p-2"
              onClick={() => handleAddMarker('noise')}
              title="标记噪音"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </button>
            <button
              className="btn btn-ghost p-2"
              onClick={() => handleAddMarker('ad')}
              title="标记广告"
            >
              <Megaphone className="w-4 h-4 text-purple-400" />
            </button>
            <button
              className="btn btn-ghost p-2"
              onClick={() => handleAddMarker('bookmark')}
              title="添加书签"
            >
              <Bookmark className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>

        {currentMarkers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentMarkers.map((marker) => (
              <div
                key={marker.id}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80"
                style={{ backgroundColor: marker.color + '20', color: marker.color }}
                onClick={() => {
                  wavesurferRef.current?.seekTo(marker.time / playback.duration)
                }}
              >
                {marker.type === 'important' && <Flag className="w-3 h-3" />}
                {marker.type === 'noise' && <AlertTriangle className="w-3 h-3" />}
                {marker.type === 'ad' && <Megaphone className="w-3 h-3" />}
                {marker.type === 'bookmark' && <Bookmark className="w-3 h-3" />}
                <span>{formatTime(marker.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

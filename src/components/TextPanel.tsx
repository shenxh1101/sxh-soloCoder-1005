import { useState, useRef, useEffect } from 'react'
import {
  Search,
  Merge,
  Scissors,
  Star,
  Trash2,
  Megaphone,
  MessageSquare,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  updateSegmentText,
  updateSegmentSpeaker,
  mergeSegments,
  splitSegment,
  toggleSegmentHighlight,
  toggleSegmentDeleted,
  toggleSegmentAd,
  addAnnotation,
  setSearchQuery,
} from '@/store/slices/projectSlice'
import { setCurrentTime } from '@/store/slices/playbackSlice'
import { formatTime } from '@/utils/time'
import clsx from 'clsx'

export default function TextPanel() {
  const dispatch = useAppDispatch()
  const project = useAppSelector((state) => state.project)
  const playback = useAppSelector((state) => state.playback)
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set())
  const [editingSegment, setEditingSegment] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showSpeakerMenu, setShowSpeakerMenu] = useState<string | null>(null)
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(
    new Set()
  )
  const [newAnnotation, setNewAnnotation] = useState<{
    segmentId: string
    type: 'comment' | 'noise' | 'important' | 'todo'
    content: string
  } | null>(null)

  const textContainerRef = useRef<HTMLDivElement>(null)

  const currentSegments = project.segments
    .filter((s) => s.audioFileId === project.currentAudioFileId)
    .sort((a, b) => a.startTime - b.startTime)

  const filteredSegments = currentSegments.filter((segment) => {
    if (!project.searchQuery) return true
    const query = project.searchQuery.toLowerCase()
    return (
      segment.text.toLowerCase().includes(query) ||
      project.speakers
        .find((s) => s.id === segment.speaker)
        ?.name.toLowerCase()
        .includes(query)
    )
  })

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleSegmentClick = (segmentId: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      const newSelected = new Set(selectedSegments)
      if (newSelected.has(segmentId)) {
        newSelected.delete(segmentId)
      } else {
        newSelected.add(segmentId)
      }
      setSelectedSegments(newSelected)
    } else {
      const segment = currentSegments.find((s) => s.id === segmentId)
      if (segment) {
        dispatch(setCurrentTime(segment.startTime))
      }
      setSelectedSegments(new Set([segmentId]))
    }
  }

  const handleMerge = () => {
    if (selectedSegments.size < 2) {
      alert('请选择至少2个段落进行合并')
      return
    }
    dispatch(mergeSegments(Array.from(selectedSegments)))
    setSelectedSegments(new Set())
  }

  const handleSplit = (segmentId: string) => {
    const segment = currentSegments.find((s) => s.id === segmentId)
    if (!segment) return
    const splitTime = (segment.startTime + segment.endTime) / 2
    dispatch(splitSegment({ id: segmentId, splitTime }))
  }

  const handleAddAnnotation = () => {
    if (!newAnnotation || !newAnnotation.content.trim()) return
    dispatch(
      addAnnotation({
        segmentId: newAnnotation.segmentId,
        type: newAnnotation.type,
        content: newAnnotation.content,
      })
    )
    setNewAnnotation(null)
  }

  const toggleAnnotationExpanded = (segmentId: string) => {
    const newExpanded = new Set(expandedAnnotations)
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId)
    } else {
      newExpanded.add(segmentId)
    }
    setExpandedAnnotations(newExpanded)
  }

  const startEditing = (segment: typeof currentSegments[0]) => {
    setEditingSegment(segment.id)
    setEditText(segment.text)
  }

  const finishEditing = () => {
    if (editingSegment && editText.trim()) {
      dispatch(updateSegmentText({ id: editingSegment, text: editText.trim() }))
    }
    setEditingSegment(null)
    setEditText('')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingSegment) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          finishEditing()
        } else if (e.key === 'Escape') {
          setEditingSegment(null)
          setEditText('')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingSegment, editText])

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title">
          <MessageSquare className="w-4 h-4 text-primary-400" />
          文本校对
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="搜索关键词..."
              value={project.searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="pl-8 py-1.5 text-sm w-56 bg-dark-100"
            />
            {project.searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                onClick={() => dispatch(setSearchQuery(''))}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {selectedSegments.size >= 2 && (
            <button className="btn btn-secondary text-xs py-1.5" onClick={handleMerge}>
              <Merge className="w-3.5 h-3.5" />
              合并选中 ({selectedSegments.size})
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-2 bg-dark-200 border-b border-gray-700 text-xs text-gray-400">
        <span>{filteredSegments.length} 段</span>
        <span>·</span>
        <span>按住 Shift 多选可合并</span>
        <span>·</span>
        <span>点击段落跳转到对应时间</span>
      </div>

      <div
        ref={textContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {filteredSegments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无文稿内容</p>
            <p className="text-xs mt-1">请先导入音频并生成文稿</p>
          </div>
        ) : (
          filteredSegments.map((segment) => {
            const speaker = project.speakers.find((s) => s.id === segment.speaker)
            const isActive =
              playback.currentTime >= segment.startTime &&
              playback.currentTime < segment.endTime
            const isSelected = selectedSegments.has(segment.id)
            const isEditing = editingSegment === segment.id

            return (
              <div
                key={segment.id}
                className={clsx(
                  'p-3 rounded-lg border transition-all cursor-pointer group',
                  isActive && 'border-primary-500 bg-primary-500/10',
                  isSelected && 'border-blue-500 bg-blue-500/10',
                  !isActive && !isSelected && 'border-gray-700 bg-dark-200 hover:border-gray-600',
                  segment.isDeleted && 'opacity-50 line-through',
                  segment.isHighlight && 'border-l-4 border-l-yellow-500',
                  segment.isAd && 'border-l-4 border-l-purple-500'
                )}
                onClick={(e) => handleSegmentClick(segment.id, e)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: speaker?.color || '#666' }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative">
                        <button
                          className="flex items-center gap-1 text-xs font-medium hover:text-white"
                          style={{ color: speaker?.color }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowSpeakerMenu(
                              showSpeakerMenu === segment.id ? null : segment.id
                            )
                          }}
                        >
                          <User className="w-3 h-3" />
                          {speaker?.name || '未知说话人'}
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {showSpeakerMenu === segment.id && (
                          <div className="absolute left-0 top-full mt-1 bg-dark-100 border border-gray-700 rounded-lg overflow-hidden z-20 min-w-[120px]">
                            {project.speakers.map((spk) => (
                              <button
                                key={spk.id}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-dark-300"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dispatch(
                                    updateSegmentSpeaker({
                                      id: segment.id,
                                      speaker: spk.id,
                                    })
                                  )
                                  setShowSpeakerMenu(null)
                                }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: spk.color }}
                                />
                                {spk.name}
                                {spk.id === segment.speaker && (
                                  <Check className="w-3 h-3 ml-auto text-primary-400" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-gray-500">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </span>

                      <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 hover:bg-dark-100 rounded"
                          title={segment.isHighlight ? '取消高亮' : '标记为金句'}
                          onClick={(e) => {
                            e.stopPropagation()
                            dispatch(toggleSegmentHighlight(segment.id))
                          }}
                        >
                          <Star
                            className={clsx(
                              'w-3.5 h-3.5',
                              segment.isHighlight
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-400'
                            )}
                          />
                        </button>
                        <button
                          className="p-1 hover:bg-dark-100 rounded"
                          title={segment.isDeleted ? '取消删除' : '标记删除'}
                          onClick={(e) => {
                            e.stopPropagation()
                            dispatch(toggleSegmentDeleted(segment.id))
                          }}
                        >
                          <Trash2
                            className={clsx(
                              'w-3.5 h-3.5',
                              segment.isDeleted ? 'text-red-400' : 'text-gray-400'
                            )}
                          />
                        </button>
                        <button
                          className="p-1 hover:bg-dark-100 rounded"
                          title={segment.isAd ? '取消广告' : '标记广告'}
                          onClick={(e) => {
                            e.stopPropagation()
                            dispatch(toggleSegmentAd(segment.id))
                          }}
                        >
                          <Megaphone
                            className={clsx(
                              'w-3.5 h-3.5',
                              segment.isAd ? 'text-purple-400' : 'text-gray-400'
                            )}
                          />
                        </button>
                        <button
                          className="p-1 hover:bg-dark-100 rounded"
                          title="拆分段落"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSplit(segment.id)
                          }}
                        >
                          <Scissors className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={finishEditing}
                        autoFocus
                        className="w-full p-2 text-sm bg-dark-100 border border-primary-500 rounded resize-none"
                        onClick={(e) => e.stopPropagation()}
                        rows={3}
                      />
                    ) : (
                      <p
                        className="text-sm text-gray-200 leading-relaxed"
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          startEditing(segment)
                        }}
                      >
                        {highlightText(segment.text, project.searchQuery)}
                      </p>
                    )}

                    {segment.annotations.length > 0 && (
                      <div className="mt-2">
                        <button
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleAnnotationExpanded(segment.id)
                          }}
                        >
                          {expandedAnnotations.has(segment.id) ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          {segment.annotations.length} 个注释
                        </button>

                        {expandedAnnotations.has(segment.id) && (
                          <div className="mt-2 space-y-1">
                            {segment.annotations.map((annotation) => (
                              <div
                                key={annotation.id}
                                className="p-2 bg-dark-100 rounded text-xs border-l-2"
                                style={{
                                  borderLeftColor:
                                    annotation.type === 'comment'
                                      ? '#3b82f6'
                                      : annotation.type === 'noise'
                                      ? '#f59e0b'
                                      : annotation.type === 'important'
                                      ? '#ef4444'
                                      : '#10b981',
                                }}
                              >
                                <span className="text-gray-400 uppercase text-[10px] mr-2">
                                  {annotation.type}
                                </span>
                                {annotation.content}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {newAnnotation?.segmentId === segment.id ? (
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 mb-1">
                          {(['comment', 'noise', 'important', 'todo'] as const).map(
                            (type) => (
                              <button
                                key={type}
                                className={clsx(
                                  'px-2 py-0.5 rounded text-[10px]',
                                  newAnnotation.type === type
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-dark-100 text-gray-400 hover:text-white'
                                )}
                                onClick={() =>
                                  setNewAnnotation({ ...newAnnotation, type })
                                }
                              >
                                {type}
                              </button>
                            )
                          )}
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="输入注释内容..."
                            value={newAnnotation.content}
                            onChange={(e) =>
                              setNewAnnotation({
                                ...newAnnotation,
                                content: e.target.value,
                              })
                            }
                            className="flex-1 text-xs py-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddAnnotation()
                              } else if (e.key === 'Escape') {
                                setNewAnnotation(null)
                              }
                            }}
                          />
                          <button
                            className="btn btn-primary text-xs py-1 px-2"
                            onClick={handleAddAnnotation}
                          >
                            添加
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="mt-2 text-xs text-gray-500 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          setNewAnnotation({
                            segmentId: segment.id,
                            type: 'comment',
                            content: '',
                          })
                        }}
                      >
                        + 添加注释
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

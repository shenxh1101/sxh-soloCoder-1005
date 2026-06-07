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
  Plus,
  Edit2,
  Users,
  Filter,
  BarChart3,
  ArrowRight,
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
  setSelectedSegments,
  clearSelectedSegments,
  updateSpeaker,
  addSpeaker,
  mergeSpeakers,
  setFilterSpeaker,
} from '@/store/slices/projectSlice'
import { setCurrentTime } from '@/store/slices/playbackSlice'
import { formatTime } from '@/utils/time'
import clsx from 'clsx'

export default function TextPanel() {
  const dispatch = useAppDispatch()
  const project = useAppSelector((state) => state.project)
  const playback = useAppSelector((state) => state.playback)
  const selectedSegments = new Set(project.selectedSegmentIds)
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
  const [editingSpeakerMode, setEditingSpeakerMode] = useState<{
    type: 'rename' | 'new' | 'merge'
    currentSegmentId: string
    currentSpeakerId: string
  } | null>(null)
  const [editingSpeakerName, setEditingSpeakerName] = useState('')
  const [mergeTargetSpeakerId, setMergeTargetSpeakerId] = useState<string | null>(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedSpeakerForView, setSelectedSpeakerForView] = useState<string | null>(null)

  const textContainerRef = useRef<HTMLDivElement>(null)

  interface SpeakerStats {
    speakerId: string
    speakerName: string
    speakerColor: string
    totalSegments: number
    totalDuration: number
    segments: typeof currentSegments
    highlightCount: number
    deleteCount: number
    adCount: number
  }

  const getSpeakerStats = (speakerId: string): SpeakerStats | null => {
    const speaker = project.speakers.find((s) => s.id === speakerId)
    if (!speaker) return null

    const segments = currentSegments.filter((s) => s.speaker === speakerId)
    const totalDuration = segments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0)
    const highlightCount = segments.filter((s) => s.isHighlight).length
    const deleteCount = segments.filter((s) => s.isDeleted).length
    const adCount = segments.filter((s) => s.isAd).length

    return {
      speakerId,
      speakerName: speaker.name,
      speakerColor: speaker.color,
      totalSegments: segments.length,
      totalDuration,
      segments,
      highlightCount,
      deleteCount,
      adCount,
    }
  }

  const jumpToSegment = (segmentId: string) => {
    const segment = currentSegments.find((s) => s.id === segmentId)
    if (segment) {
      dispatch(setCurrentTime(segment.startTime))
      setSelectedSpeakerForView(null)
      setTimeout(() => {
        const element = document.getElementById(`segment-${segmentId}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }

  const currentSegments = project.segments
    .filter((s) => s.audioFileId === project.currentAudioFileId)
    .sort((a, b) => a.startTime - b.startTime)

  const filteredSegments = currentSegments.filter((segment) => {
    if (project.filterSpeakerId && segment.speaker !== project.filterSpeakerId) {
      return false
    }
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

  const getSpeakerSegmentCount = (speakerId: string) => {
    return currentSegments.filter((s) => s.speaker === speakerId).length
  }

  const handleRenameSpeaker = (speakerId: string, newName: string) => {
    if (!newName.trim()) return
    dispatch(updateSpeaker({ id: speakerId, name: newName.trim() }))
    setEditingSpeakerMode(null)
    setEditingSpeakerName('')
  }

  const handleAddAndSwitchSpeaker = (name: string, segmentId: string) => {
    if (!name.trim()) return
    
    const newSpeakerId = `spk_${project.speakers.length}`
    
    dispatch(addSpeaker({ name: name.trim() }))
    dispatch(updateSegmentSpeaker({ id: segmentId, speaker: newSpeakerId }))
    
    setEditingSpeakerMode(null)
    setEditingSpeakerName('')
    setShowSpeakerMenu(null)
  }

  const handleMergeSpeakers = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return
    
    const sourceName = project.speakers.find((s) => s.id === sourceId)?.name
    const targetName = project.speakers.find((s) => s.id === targetId)?.name
    const affectedCount = getSpeakerSegmentCount(sourceId)
    
    const confirmed = window.confirm(
      `确定要将 "${sourceName}" 合并到 "${targetName}" 吗？\n\n` +
      `这将影响 ${affectedCount} 段文稿，合并后 "${sourceName}" 将被删除，` +
      `所有相关段落都将标记为 "${targetName}"。\n\n此操作不可撤销。`
    )
    
    if (confirmed) {
      dispatch(mergeSpeakers({ sourceSpeakerId: sourceId, targetSpeakerId: targetId }))
    }
    
    setEditingSpeakerMode(null)
    setMergeTargetSpeakerId(null)
    setShowSpeakerMenu(null)
  }

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
      dispatch(setSelectedSegments(Array.from(newSelected)))
    } else {
      const segment = currentSegments.find((s) => s.id === segmentId)
      if (segment) {
        dispatch(setCurrentTime(segment.startTime))
      }
      dispatch(setSelectedSegments([segmentId]))
    }
  }

  const handleMerge = () => {
    if (selectedSegments.size < 2) {
      alert('请选择至少2个段落进行合并')
      return
    }
    dispatch(mergeSegments(Array.from(selectedSegments)))
    dispatch(clearSelectedSegments())
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
              className="pl-8 py-1.5 text-sm w-48 bg-dark-100"
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

          <div className="relative">
            <button
              className={clsx(
                'btn text-xs py-1.5',
                project.filterSpeakerId ? 'btn-primary' : 'btn-secondary'
              )}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter className="w-3.5 h-3.5" />
              {project.filterSpeakerId
                ? project.speakers.find((s) => s.id === project.filterSpeakerId)?.name || '筛选'
                : '按说话人筛选'}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-dark-100 border border-gray-700 rounded-lg overflow-hidden z-30 min-w-[160px]">
                <button
                  className={clsx(
                    'flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-dark-300',
                    !project.filterSpeakerId && 'text-primary-400 bg-primary-400/10'
                  )}
                  onClick={() => {
                    dispatch(setFilterSpeaker(null))
                    setShowFilterMenu(false)
                  }}
                >
                  <Users className="w-3.5 h-3.5" />
                  全部说话人
                </button>
                <div className="border-t border-gray-700" />
                {project.speakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-dark-300"
                  >
                    <button
                      className={clsx(
                        'flex items-center gap-2 flex-1 text-xs text-left py-1',
                        project.filterSpeakerId === speaker.id &&
                          'text-primary-400'
                      )}
                      onClick={() => {
                        dispatch(
                          setFilterSpeaker(
                            project.filterSpeakerId === speaker.id ? null : speaker.id
                          )
                        )
                        setShowFilterMenu(false)
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: speaker.color }}
                      />
                      {speaker.name}
                      <span className="ml-auto text-gray-500">
                        {getSpeakerSegmentCount(speaker.id)}
                      </span>
                    </button>
                    <button
                      className="p-1 hover:bg-dark-100 rounded text-gray-400 hover:text-primary-400"
                      title="查看说话人统计"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSpeakerForView(speaker.id)
                        setShowFilterMenu(false)
                      }}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
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
                id={`segment-${segment.id}`}
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
                          <div className="absolute left-0 top-full mt-1 bg-dark-100 border border-gray-700 rounded-lg overflow-hidden z-20 min-w-[180px]">
                            {editingSpeakerMode?.currentSegmentId === segment.id ? (
                              <div className="p-2 space-y-2">
                                {editingSpeakerMode.type === 'rename' && (
                                  <>
                                    <p className="text-[10px] text-gray-400 px-1">
                                      重命名 "{speaker?.name}"
                                    </p>
                                    <input
                                      type="text"
                                      value={editingSpeakerName}
                                      onChange={(e) => setEditingSpeakerName(e.target.value)}
                                      className="w-full text-xs py-1.5"
                                      placeholder="输入新名称"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleRenameSpeaker(
                                            editingSpeakerMode.currentSpeakerId,
                                            editingSpeakerName
                                          )
                                        } else if (e.key === 'Escape') {
                                          setEditingSpeakerMode(null)
                                          setEditingSpeakerName('')
                                        }
                                      }}
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        className="btn btn-primary text-xs py-1 px-2 flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRenameSpeaker(
                                            editingSpeakerMode.currentSpeakerId,
                                            editingSpeakerName
                                          )
                                        }}
                                      >
                                        保存
                                      </button>
                                      <button
                                        className="btn btn-secondary text-xs py-1 px-2 flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingSpeakerMode(null)
                                          setEditingSpeakerName('')
                                        }}
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </>
                                )}

                                {editingSpeakerMode.type === 'new' && (
                                  <>
                                    <p className="text-[10px] text-gray-400 px-1">
                                      新建说话人
                                    </p>
                                    <input
                                      type="text"
                                      value={editingSpeakerName}
                                      onChange={(e) => setEditingSpeakerName(e.target.value)}
                                      className="w-full text-xs py-1.5"
                                      placeholder="输入真实姓名"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleAddAndSwitchSpeaker(
                                            editingSpeakerName,
                                            segment.id
                                          )
                                        } else if (e.key === 'Escape') {
                                          setEditingSpeakerMode(null)
                                          setEditingSpeakerName('')
                                        }
                                      }}
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        className="btn btn-primary text-xs py-1 px-2 flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleAddAndSwitchSpeaker(
                                            editingSpeakerName,
                                            segment.id
                                          )
                                        }}
                                      >
                                        创建并应用
                                      </button>
                                      <button
                                        className="btn btn-secondary text-xs py-1 px-2 flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingSpeakerMode(null)
                                          setEditingSpeakerName('')
                                        }}
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </>
                                )}

                                {editingSpeakerMode.type === 'merge' && (
                                  <>
                                    <p className="text-[10px] text-gray-400 px-1">
                                      将 "{speaker?.name}" 合并到：
                                    </p>
                                    <p className="text-[10px] text-yellow-400 px-1">
                                      影响 {getSpeakerSegmentCount(editingSpeakerMode.currentSpeakerId)} 段
                                    </p>
                                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                                      {project.speakers
                                        .filter((s) => s.id !== editingSpeakerMode.currentSpeakerId)
                                        .map((spk) => (
                                          <button
                                            key={spk.id}
                                            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-left hover:bg-dark-300 rounded"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setMergeTargetSpeakerId(spk.id)
                                            }}
                                          >
                                            <div
                                              className="w-2 h-2 rounded-full"
                                              style={{ backgroundColor: spk.color }}
                                            />
                                            {spk.name}
                                            {mergeTargetSpeakerId === spk.id && (
                                              <Check className="w-3 h-3 ml-auto text-primary-400" />
                                            )}
                                          </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1 mt-2">
                                      <button
                                        className="btn btn-primary text-xs py-1 px-2 flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (mergeTargetSpeakerId) {
                                            handleMergeSpeakers(
                                              editingSpeakerMode.currentSpeakerId,
                                              mergeTargetSpeakerId
                                            )
                                          }
                                        }}
                                        disabled={!mergeTargetSpeakerId}
                                      >
                                        确认合并
                                      </button>
                                      <button
                                        className="btn btn-secondary text-xs py-1 px-2 flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingSpeakerMode(null)
                                          setMergeTargetSpeakerId(null)
                                        }}
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <>
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
                                <div className="border-t border-gray-700" />
                                <button
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-dark-300 text-primary-400"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingSpeakerMode({
                                      type: 'rename',
                                      currentSegmentId: segment.id,
                                      currentSpeakerId: segment.speaker,
                                    })
                                    setEditingSpeakerName(speaker?.name || '')
                                  }}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  重命名此说话人
                                </button>
                                <button
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-dark-300 text-green-400"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingSpeakerMode({
                                      type: 'new',
                                      currentSegmentId: segment.id,
                                      currentSpeakerId: segment.speaker,
                                    })
                                    setEditingSpeakerName('')
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  新建真实姓名
                                </button>
                                <button
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-dark-300 text-orange-400"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingSpeakerMode({
                                      type: 'merge',
                                      currentSegmentId: segment.id,
                                      currentSpeakerId: segment.speaker,
                                    })
                                    setMergeTargetSpeakerId(null)
                                  }}
                                >
                                  <Merge className="w-3.5 h-3.5" />
                                  合并到其他说话人
                                </button>
                              </>
                            )}
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

      {selectedSpeakerForView && (() => {
        const stats = getSpeakerStats(selectedSpeakerForView)
        if (!stats) return null

        const maxTime = currentSegments.length > 0
          ? Math.max(...currentSegments.map((s) => s.endTime))
          : 1

        return (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-300 border border-gray-700 rounded-xl w-[560px] max-h-[85vh] flex flex-col animate-fade-in overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stats.speakerColor}20` }}
                  >
                    <User className="w-5 h-5" style={{ color: stats.speakerColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{stats.speakerName}</h3>
                    <p className="text-xs text-gray-400">说话人统计视图</p>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-dark-200 rounded text-gray-400 hover:text-white"
                  onClick={() => setSelectedSpeakerForView(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-dark-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{stats.totalSegments}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">总段落</p>
                  </div>
                  <div className="bg-dark-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{formatTime(stats.totalDuration)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">总时长</p>
                  </div>
                  <div className="bg-dark-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{stats.highlightCount}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">金句</p>
                  </div>
                  <div className="bg-dark-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-400">{stats.deleteCount}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">待删</p>
                  </div>
                </div>

                {stats.adCount > 0 && (
                  <div className="bg-purple-400/10 border border-purple-400/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-300">
                        包含 {stats.adCount} 段广告口播
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-400">时间分布</h4>
                    <span className="text-[10px] text-gray-500">
                      占比 {((stats.totalDuration / maxTime) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-8 bg-dark-200 rounded-lg overflow-hidden">
                    {stats.segments.map((seg) => (
                      <div
                        key={seg.id}
                        className="absolute top-0 bottom-0 rounded"
                        style={{
                          left: `${(seg.startTime / maxTime) * 100}%`,
                          width: `${Math.max(2, ((seg.endTime - seg.startTime) / maxTime) * 100)}%`,
                          backgroundColor: `${stats.speakerColor}${seg.isHighlight ? 'FF' : '80'}`,
                        }}
                        title={`${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}`}
                      />
                    ))}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                      style={{ left: `${(playback.currentTime / maxTime) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                    <span>0:00</span>
                    <span>{formatTime(maxTime)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-400">段落列表</h4>
                    <span className="text-[10px] text-gray-500">
                      共 {stats.segments.length} 段
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {stats.segments.map((seg, index) => (
                      <div
                        key={seg.id}
                        className="flex items-start gap-2 p-2 bg-dark-200 rounded-lg hover:bg-dark-100 cursor-pointer transition-colors group"
                        onClick={() => jumpToSegment(seg.id)}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: stats.speakerColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">
                              #{index + 1}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                            </span>
                            {seg.isHighlight && (
                              <Star className="w-3 h-3 text-yellow-400" />
                            )}
                            {seg.isDeleted && (
                              <Trash2 className="w-3 h-3 text-red-400" />
                            )}
                            {seg.isAd && (
                              <Megaphone className="w-3 h-3 text-purple-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5">
                            {seg.text}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-primary-400 flex-shrink-0 mt-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 gap-3">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => {
                    dispatch(setFilterSpeaker(selectedSpeakerForView))
                    setSelectedSpeakerForView(null)
                  }}
                >
                  <Filter className="w-3.5 h-3.5" />
                  只看此人
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => setSelectedSpeakerForView(null)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

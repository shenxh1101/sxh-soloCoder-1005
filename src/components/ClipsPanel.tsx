import { useState, useEffect, useMemo } from 'react'
import {
  Star,
  Trash2,
  Megaphone,
  FolderOpen,
  Plus,
  X,
  Edit2,
  Clock,
  Play,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  CheckSquare,
  Square,
  Tag,
  Layers,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  addClip,
  removeClip,
  updateClip,
  batchUpdateClips,
  addCollection,
  removeCollection,
} from '@/store/slices/projectSlice'
import { setCurrentTime } from '@/store/slices/playbackSlice'
import { formatTime } from '@/utils/time'
import clsx from 'clsx'

const categories = [
  { key: 'golden', label: '金句收藏', icon: Star, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  { key: 'to-delete', label: '待删片段', icon: Trash2, color: 'text-red-400', bgColor: 'bg-red-400/10' },
  { key: 'ad', label: '广告口播', icon: Megaphone, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  { key: 'custom', label: '自定义', icon: FolderOpen, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
]

export default function ClipsPanel() {
  const dispatch = useAppDispatch()
  const project = useAppSelector((state) => state.project)
  const playback = useAppSelector((state) => state.playback)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [editingClip, setEditingClip] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newClip, setNewClip] = useState({
    category: 'golden' as const,
    title: '',
    description: '',
  })
  const [manualStartTime, setManualStartTime] = useState(0)
  const [manualEndTime, setManualEndTime] = useState(0)
  const [manualSegmentIds, setManualSegmentIds] = useState<string[]>([])
  const [hasTranscript, setHasTranscript] = useState(true)
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)
  const [showBatchMenu, setShowBatchMenu] = useState(false)
  const [batchAction, setBatchAction] = useState<string | null>(null)
  const [batchTagInput, setBatchTagInput] = useState('')
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)
  const [newCollectionTitle, setNewCollectionTitle] = useState('')
  const [editingTagsForClip, setEditingTagsForClip] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'collection'>('list')

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    project.clips.forEach((clip) => {
      clip.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [project.clips])

  const clipsToDisplay = useMemo(() => {
    let clips = project.clips

    if (viewMode === 'collection' && activeCollectionId) {
      const collection = project.collections.find((c) => c.id === activeCollectionId)
      if (collection) {
        clips = clips.filter((c) => collection.clipIds.includes(c.id))
      }
    } else if (activeCategory !== 'all') {
      clips = clips.filter((c) => c.category === activeCategory)
    }

    return clips.sort((a, b) => a.startTime - b.startTime)
  }, [project.clips, project.collections, activeCategory, activeCollectionId, viewMode])

  const clipsWithoutCollection = useMemo(() => {
    return project.clips.filter((c) => !c.collectionId)
  }, [project.clips])

  const currentAudioSegments = project.segments
    .filter((s) => s.audioFileId === project.currentAudioFileId)
    .sort((a, b) => a.startTime - b.startTime)

  useEffect(() => {
    if (showAddModal) {
      const hasSegments = currentAudioSegments.length > 0
      setHasTranscript(hasSegments)

      if (hasSegments) {
        const targetIds = getTargetSegments()
        setManualSegmentIds(targetIds)

        const segments = project.segments.filter((s) => targetIds.includes(s.id))
        if (segments.length > 0) {
          const startTime = Math.min(...segments.map((s) => s.startTime))
          const endTime = Math.max(...segments.map((s) => s.endTime))
          setManualStartTime(startTime)
          setManualEndTime(endTime)
        }
      }
    }
  }, [showAddModal])

  const getTargetSegments = () => {
    if (project.selectedSegmentIds.length > 0) {
      return project.selectedSegmentIds
    }

    if (currentAudioSegments.length === 0) {
      return []
    }

    const currentTime = playback.currentTime
    let nearestSegment = currentAudioSegments.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    )

    if (!nearestSegment) {
      nearestSegment = currentAudioSegments.reduce((prev, curr) =>
        Math.abs(curr.startTime - currentTime) < Math.abs(prev.startTime - currentTime)
          ? curr
          : prev
      )
    }

    const nearestIndex = currentAudioSegments.findIndex((s) => s.id === nearestSegment.id)
    const startIndex = Math.max(0, nearestIndex - 1)
    const endIndex = Math.min(currentAudioSegments.length, nearestIndex + 2)

    return currentAudioSegments.slice(startIndex, endIndex).map((s) => s.id)
  }

  const toggleSegmentInClip = (segmentId: string) => {
    setManualSegmentIds((prev) => {
      if (prev.includes(segmentId)) {
        const newIds = prev.filter((id) => id !== segmentId)
        updateTimeRangeFromSegments(newIds)
        return newIds
      } else {
        const newIds = [...prev, segmentId].sort((a, b) => {
          const segA = currentAudioSegments.find((s) => s.id === a)
          const segB = currentAudioSegments.find((s) => s.id === b)
          return (segA?.startTime || 0) - (segB?.startTime || 0)
        })
        updateTimeRangeFromSegments(newIds)
        return newIds
      }
    })
  }

  const updateTimeRangeFromSegments = (segmentIds: string[]) => {
    const segments = project.segments.filter((s) => segmentIds.includes(s.id))
    if (segments.length > 0) {
      const startTime = Math.min(...segments.map((s) => s.startTime))
      const endTime = Math.max(...segments.map((s) => s.endTime))
      setManualStartTime(startTime)
      setManualEndTime(endTime)
    }
  }

  const adjustTime = (field: 'start' | 'end', delta: number) => {
    if (field === 'start') {
      setManualStartTime((prev) => Math.max(0, Math.min(prev + delta, manualEndTime - 0.1)))
    } else {
      setManualEndTime((prev) => Math.max(manualStartTime + 0.1, prev + delta))
    }
  }

  const handleAddClip = () => {
    if (!newClip.title.trim()) {
      alert('请输入片段标题')
      return
    }

    if (!project.currentAudioFileId) {
      alert('请先选择一个音频文件')
      return
    }

    if (currentAudioSegments.length === 0) {
      alert('当前音频还没有文稿，请先生成文稿后再创建片段')
      return
    }

    if (manualSegmentIds.length === 0) {
      alert('请至少选择一个段落')
      return
    }

    dispatch(
      addClip({
        segmentIds: manualSegmentIds,
        category: newClip.category,
        title: newClip.title,
        description: newClip.description,
        startTime: manualStartTime,
        endTime: manualEndTime,
      } as any)
    )

    setShowAddModal(false)
    setNewClip({ category: 'golden', title: '', description: '' })
    setManualSegmentIds([])
    setManualStartTime(0)
    setManualEndTime(0)
  }

  const toggleClipSelection = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedClipIds)
    if (newSelected.has(clipId)) {
      newSelected.delete(clipId)
    } else {
      newSelected.add(clipId)
    }
    setSelectedClipIds(newSelected)
  }

  const selectAllClips = () => {
    if (selectedClipIds.size === clipsToDisplay.length) {
      setSelectedClipIds(new Set())
    } else {
      setSelectedClipIds(new Set(clipsToDisplay.map((c) => c.id)))
    }
  }

  const handleBatchChangeCategory = (category: 'golden' | 'to-delete' | 'ad' | 'custom') => {
    if (selectedClipIds.size === 0) return
    dispatch(batchUpdateClips({
      clipIds: Array.from(selectedClipIds),
      category,
    }))
    setShowBatchMenu(false)
    setBatchAction(null)
    setSelectedClipIds(new Set())
    setIsMultiSelectMode(false)
  }

  const handleBatchAddTags = () => {
    if (selectedClipIds.size === 0 || !batchTagInput.trim()) return
    const tags = batchTagInput.split(',').map((t) => t.trim()).filter(Boolean)
    dispatch(batchUpdateClips({
      clipIds: Array.from(selectedClipIds),
      addTags: tags,
    }))
    setBatchTagInput('')
    setShowBatchMenu(false)
    setBatchAction(null)
    setSelectedClipIds(new Set())
    setIsMultiSelectMode(false)
  }

  const handleMergeToCollection = () => {
    if (selectedClipIds.size === 0) return
    setShowNewCollectionModal(true)
  }

  const confirmCreateCollection = () => {
    if (!newCollectionTitle.trim()) return
    dispatch(addCollection({
      title: newCollectionTitle.trim(),
      description: '',
      clipIds: Array.from(selectedClipIds),
    }))
    setNewCollectionTitle('')
    setShowNewCollectionModal(false)
    setShowBatchMenu(false)
    setBatchAction(null)
    setSelectedClipIds(new Set())
    setIsMultiSelectMode(false)
  }

  const handleAddTagToClip = (clipId: string, tag: string) => {
    const clip = project.clips.find((c) => c.id === clipId)
    if (!clip) return
    const newTags = [...new Set([...clip.tags, tag.trim()])]
    dispatch(updateClip({ id: clipId, tags: newTags }))
    setTagInput('')
    setEditingTagsForClip(null)
  }

  const handleRemoveTagFromClip = (clipId: string, tag: string) => {
    const clip = project.clips.find((c) => c.id === clipId)
    if (!clip) return
    const newTags = clip.tags.filter((t) => t !== tag)
    dispatch(updateClip({ id: clipId, tags: newTags }))
  }

  const handlePlayClip = (clip: typeof project.clips[0]) => {
    dispatch(setCurrentTime(clip.startTime))
  }

  const startEditing = (clip: typeof project.clips[0]) => {
    setEditingClip(clip.id)
    setEditTitle(clip.title)
    setEditDescription(clip.description)
  }

  const finishEditing = (clipId: string) => {
    dispatch(
      updateClip({
        id: clipId,
        title: editTitle,
        description: editDescription,
      })
    )
    setEditingClip(null)
  }

  const categoryStats = categories.map((cat) => ({
    ...cat,
    count: project.clips.filter((c) => c.category === cat.key).length,
  }))

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title">
          <FolderOpen className="w-4 h-4 text-primary-400" />
          片段库
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-dark-200 rounded-lg p-0.5">
            <button
              className={clsx(
                'px-2 py-1 rounded text-xs transition-colors',
                viewMode === 'list'
                  ? 'bg-dark-100 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
              onClick={() => {
                setViewMode('list')
                setActiveCollectionId(null)
              }}
            >
              列表
            </button>
            <button
              className={clsx(
                'px-2 py-1 rounded text-xs transition-colors',
                viewMode === 'collection'
                  ? 'bg-dark-100 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
              onClick={() => setViewMode('collection')}
            >
              <Layers className="w-3 h-3 inline mr-1" />
              合集
            </button>
          </div>
          <button
            className={clsx(
            'btn text-xs py-1.5',
            isMultiSelectMode ? 'btn-primary' : 'btn-secondary'
          )}
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode)
              if (isMultiSelectMode) {
                setSelectedClipIds(new Set())
              }
            }}
          >
            {isMultiSelectMode ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            {isMultiSelectMode ? '取消多选' : '多选'}
          </button>
          <button
            className="btn btn-primary text-xs py-1.5"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            新建
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-700">
          {categoryStats.map((cat) => (
            <button
              key={cat.key}
              className={clsx(
                'flex items-center gap-2 p-2 rounded-lg border transition-all text-left',
                activeCategory === cat.key
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 bg-dark-200 hover:border-gray-600'
              )}
              onClick={() =>
                setActiveCategory(activeCategory === cat.key ? 'all' : cat.key)
              }
            >
              <cat.icon className={clsx('w-4 h-4', cat.color)} />
              <div>
                <p className="text-xs font-medium text-gray-200">{cat.label}</p>
                <p className="text-[10px] text-gray-500">{cat.count} 个</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {viewMode === 'collection' && (
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-400">合集</h4>
        <button
          className="text-xs text-primary-400 hover:text-primary-300"
          onClick={() => {
            setShowNewCollectionModal(true)
            setNewCollectionTitle('')
          }}
        >
          <Plus className="w-3 h-3 inline mr-1" />
          新建合集
        </button>
          </div>
          <div className="space-y-2">
            <button
              className={clsx(
                'w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left',
                activeCollectionId === null
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 bg-dark-200 hover:border-gray-600'
              )}
              onClick={() => setActiveCollectionId(null)}
            >
              <Layers className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-200">未分类</p>
                <p className="text-[10px] text-gray-500">{clipsWithoutCollection.length} 个片段</p>
              </div>
            </button>
            {project.collections.map((collection) => (
              <button
                key={collection.id}
                className={clsx(
                  'w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left',
                  activeCollectionId === collection.id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-700 bg-dark-200 hover:border-gray-600'
                )}
                onClick={() => setActiveCollectionId(
                  activeCollectionId === collection.id ? null : collection.id
                )}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: collection.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{collection.title}</p>
                  <p className="text-[10px] text-gray-500">{collection.clipIds.length} 个片段</p>
                </div>
                <button
                  className="p-1 hover:bg-dark-100 rounded text-gray-400 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`确定要删除合集"${collection.title}"吗？`)) {
                      dispatch(removeCollection(collection.id))
                    }
                  }}
                  title="删除合集"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {isMultiSelectMode && (
        <div className="flex items-center justify-between px-3 py-2 bg-primary-500/10 border-b border-gray-700 gap-2">
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-gray-400 hover:text-white"
              onClick={selectAllClips}
            >
              {selectedClipIds.size === clipsToDisplay.length ? '取消全选' : '全选'}
            </button>
            <span className="text-xs text-gray-500">
              已选 {selectedClipIds.size} 个
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className={clsx(
                'btn text-xs py-1 px-2',
                selectedClipIds.size > 0 ? 'btn-secondary' : 'btn-ghost opacity-50 cursor-not-allowed'
              )}
              onClick={() => {
                if (selectedClipIds.size === 0) return
                setShowBatchMenu(!showBatchMenu)
                setBatchAction('category')
              }}
              disabled={selectedClipIds.size === 0}
            >
              改分类
            </button>
            <button
              className={clsx(
                'btn text-xs py-1 px-2',
                selectedClipIds.size > 0 ? 'btn-secondary' : 'btn-ghost opacity-50 cursor-not-allowed'
              )}
              onClick={() => {
                if (selectedClipIds.size === 0) return
                setShowBatchMenu(!showBatchMenu)
                setBatchAction('tag')
              }}
              disabled={selectedClipIds.size === 0}
            >
              <Tag className="w-3 h-3 mr-1" />
              加标签
            </button>
            <button
              className={clsx(
                'btn text-xs py-1 px-2',
                selectedClipIds.size > 0 ? 'btn-secondary' : 'btn-ghost opacity-50 cursor-not-allowed'
              )}
              onClick={() => {
                if (selectedClipIds.size === 0) return
                handleMergeToCollection()
              }}
              disabled={selectedClipIds.size === 0}
            >
              <Layers className="w-3 h-3 mr-1" />
              合并合集
            </button>
          </div>
        </div>
        )}

      {showBatchMenu && batchAction === 'category' && (
        <div className="px-3 py-2 bg-dark-200 border-b border-gray-700">
          <p className="text-[10px] text-gray-500 mb-2">选择目标分类：</p>
          <div className="flex gap-1 flex-wrap">
            {categories.map((cat) => (
            <button
              key={cat.key}
              className="btn btn-secondary text-[10px] !py-1 !px-2"
              onClick={() => handleBatchChangeCategory(cat.key as any)}
            >
              <cat.icon className={clsx('w-3 h-3 mr-1', cat.color)} />
              {cat.label}
            </button>
          ))}
          </div>
        </div>
      )}

      {showBatchMenu && batchAction === 'tag' && (
        <div className="px-3 py-2 bg-dark-200 border-b border-gray-700">
          <p className="text-[10px] text-gray-500 mb-2">添加标签（多个用逗号分隔）：</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={batchTagInput}
              onChange={(e) => setBatchTagInput(e.target.value)}
              placeholder="例如：搞笑,干货"
              className="flex-1 text-xs py-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBatchAddTags()
                }
              }}
            />
            <button
              className="btn btn-primary text-xs !py-1 !px-2"
              onClick={handleBatchAddTags}
            >
              添加
            </button>
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              <span className="text-[10px] text-gray-500">常用：</span>
              {allTags.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  className="px-2 py-0.5 bg-dark-100 rounded text-[10px] text-gray-400 hover:text-white cursor-pointer"
                  onClick={() => setBatchTagInput(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {clipsToDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FolderOpen className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无片段</p>
            <p className="text-xs mt-1">点击上方按钮创建片段</p>
          </div>
        ) : (
          clipsToDisplay.map((clip) => {
            const catInfo = categories.find((c) => c.key === clip.category)
            const clipSegments = project.segments.filter((s) =>
              clip.segmentIds.includes(s.id)
            )
            const clipText = clipSegments
              .map((s) => s.text)
              .join(' ')
              .slice(0, 100)
            const isEditing = editingClip === clip.id

            return (
              <div
                key={clip.id}
                className={clsx(
                  'p-3 rounded-lg border transition-all group',
                  catInfo?.bgColor,
                  selectedClipIds.has(clip.id)
                    ? 'border-primary-500 ring-1 ring-primary-500'
                    : 'border-gray-700 hover:border-gray-600'
                )}
              >
                <div className="flex items-start gap-2">
                  {isMultiSelectMode && (
                    <button
                      className="mt-1 flex-shrink-0 text-gray-400 hover:text-white"
                      onClick={(e) => toggleClipSelection(clip.id, e)}
                    >
                      {selectedClipIds.has(clip.id) ? (
                        <CheckSquare className="w-4 h-4 text-primary-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      catInfo?.bgColor
                    )}
                  >
                    {catInfo && <catInfo.icon className={clsx('w-4 h-4', catInfo.color)} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-sm font-medium"
                          placeholder="标题"
                          autoFocus
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full text-xs"
                          placeholder="描述"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <button
                            className="btn btn-primary text-xs py-1 px-2"
                            onClick={() => finishEditing(clip.id)}
                          >
                            保存
                          </button>
                          <button
                            className="btn btn-secondary text-xs py-1 px-2"
                            onClick={() => setEditingClip(null)}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-gray-200 truncate">
                            {clip.title}
                          </h4>
                          <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTime(clip.endTime - clip.startTime)}
                          </span>
                        </div>

                        {clip.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {clip.description}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {clipText}...
                        </p>

                        {clip.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {clip.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 bg-primary-500/20 text-primary-300 text-[9px] rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1 hover:bg-dark-100 rounded"
                              title="播放"
                              onClick={() => handlePlayClip(clip)}
                            >
                              <Play className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            <button
                              className="p-1 hover:bg-dark-100 rounded"
                              title="标签"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingTagsForClip(
                                  editingTagsForClip === clip.id ? null : clip.id
                                )
                                setTagInput('')
                              }}
                            >
                              <Tag className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            <button
                              className="p-1 hover:bg-dark-100 rounded"
                              title="编辑"
                              onClick={() => startEditing(clip)}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            <select
                              className="text-xs bg-dark-100 border border-gray-600 rounded px-1 py-0.5"
                              value={clip.category}
                              onChange={(e) =>
                                dispatch(
                                  updateClip({
                                    id: clip.id,
                                    category: e.target.value as any,
                                  })
                                )
                              }
                            >
                              {categories.map((cat) => (
                                <option key={cat.key} value={cat.key}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                            <button
                              className="p-1 hover:bg-dark-100 rounded"
                              title="删除"
                              onClick={() => dispatch(removeClip(clip.id))}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {editingTagsForClip === clip.id && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-[10px] text-gray-500 mb-1">编辑标签：</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {clip.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="flex items-center gap-1 px-1.5 py-0.5 bg-primary-500/20 text-primary-300 text-[9px] rounded"
                                >
                                  {tag}
                                  <button
                                    className="hover:text-red-400"
                                    onClick={() => handleRemoveTagFromClip(clip.id, tag)}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="输入标签后回车"
                                className="flex-1 text-xs py-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddTagToClip(clip.id, tagInput)
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                className="btn btn-primary text-xs !py-1 !px-2"
                                onClick={() => handleAddTagToClip(clip.id, tagInput)}
                              >
                                添加
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-300 border border-gray-700 rounded-lg w-[520px] max-h-[90vh] overflow-y-auto p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">新建片段</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setShowAddModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!hasTranscript ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-200 mb-2">当前音频还没有文稿</h4>
                <p className="text-xs text-gray-500 mb-6 max-w-xs">
                  请先在导入区点击"生成文稿"按钮，完成后再创建片段。
                  片段内容需要基于文稿段落生成。
                </p>
                <div className="flex items-center gap-2 p-3 bg-dark-100 rounded-lg text-left">
                  <FileText className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-300">如何生成文稿？</p>
                    <p className="text-[10px] text-gray-500">
                      在左侧导入区选择音频文件，点击"生成文稿"按钮
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-secondary mt-6"
                  onClick={() => setShowAddModal(false)}
                >
                  知道了
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">分类</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.key}
                        className={clsx(
                          'flex items-center gap-2 p-2 rounded-lg border transition-all text-left',
                          newClip.category === cat.key
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-gray-700 bg-dark-200 hover:border-gray-600'
                        )}
                        onClick={() =>
                          setNewClip({ ...newClip, category: cat.key as any })
                        }
                      >
                        <cat.icon className={clsx('w-4 h-4', cat.color)} />
                        <span className="text-xs text-gray-200">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">标题</label>
                  <input
                    type="text"
                    value={newClip.title}
                    onChange={(e) => setNewClip({ ...newClip, title: e.target.value })}
                    placeholder="输入片段标题"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">描述</label>
                  <textarea
                    value={newClip.description}
                    onChange={(e) =>
                      setNewClip({ ...newClip, description: e.target.value })
                    }
                    placeholder="输入片段描述（可选）"
                    className="w-full resize-none"
                    rows={2}
                  />
                </div>

                <div className="p-3 bg-dark-100 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-gray-400 font-medium">时间范围</label>
                    <span className="text-[10px] text-primary-400">
                      时长 {formatTime(manualEndTime - manualStartTime)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">开始时间</label>
                      <div className="flex items-center gap-1">
                        <button
                          className="btn btn-secondary !py-1 !px-1.5"
                          onClick={() => adjustTime('start', -0.5)}
                          title="减少 0.5 秒"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <input
                          type="text"
                          value={formatTime(manualStartTime)}
                          onChange={(e) => {
                            const val = e.target.value
                            const parts = val.split(':')
                            if (parts.length === 2) {
                              const seconds =
                                parseFloat(parts[0]) * 60 + parseFloat(parts[1])
                              if (!isNaN(seconds)) {
                                setManualStartTime(seconds)
                              }
                            }
                          }}
                          className="w-full text-center text-sm py-1 bg-dark-200 border border-gray-600 rounded"
                        />
                        <button
                          className="btn btn-secondary !py-1 !px-1.5"
                          onClick={() => adjustTime('start', 0.5)}
                          title="增加 0.5 秒"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">结束时间</label>
                      <div className="flex items-center gap-1">
                        <button
                          className="btn btn-secondary !py-1 !px-1.5"
                          onClick={() => adjustTime('end', -0.5)}
                          title="减少 0.5 秒"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <input
                          type="text"
                          value={formatTime(manualEndTime)}
                          onChange={(e) => {
                            const val = e.target.value
                            const parts = val.split(':')
                            if (parts.length === 2) {
                              const seconds =
                                parseFloat(parts[0]) * 60 + parseFloat(parts[1])
                              if (!isNaN(seconds)) {
                                setManualEndTime(seconds)
                              }
                            }
                          }}
                          className="w-full text-center text-sm py-1 bg-dark-200 border border-gray-600 rounded"
                        />
                        <button
                          className="btn btn-secondary !py-1 !px-1.5"
                          onClick={() => adjustTime('end', 0.5)}
                          title="增加 0.5 秒"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <button
                      className="btn btn-secondary text-[10px] !py-1 !px-2 flex-1"
                      onClick={() => adjustTime('start', -1)}
                    >
                      -1秒
                    </button>
                    <button
                      className="btn btn-secondary text-[10px] !py-1 !px-2 flex-1"
                      onClick={() => adjustTime('start', 1)}
                    >
                      +1秒
                    </button>
                    <button
                      className="btn btn-secondary text-[10px] !py-1 !px-2 flex-1"
                      onClick={() => adjustTime('end', -1)}
                    >
                      尾-1秒
                    </button>
                    <button
                      className="btn btn-secondary text-[10px] !py-1 !px-2 flex-1"
                      onClick={() => adjustTime('end', 1)}
                    >
                      尾+1秒
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-dark-100 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400 font-medium">包含段落</label>
                    <span className="text-[10px] text-gray-500">
                      已选 {manualSegmentIds.length} 段
                      {manualSegmentIds.length > 0 && (
                        <span className="ml-2 text-primary-400">
                          点击段落可添加/移除
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {currentAudioSegments.map((seg) => {
                      const speaker = project.speakers.find(
                        (s) => s.id === seg.speaker
                      )
                      const isSelected = manualSegmentIds.includes(seg.id)
                      return (
                        <div
                          key={seg.id}
                          className={clsx(
                            'flex items-start gap-2 p-2 rounded cursor-pointer transition-all border',
                            isSelected
                              ? 'bg-primary-400/10 border-primary-400/30'
                              : 'bg-dark-200 border-transparent hover:border-gray-600'
                          )}
                          onClick={() => toggleSegmentInClip(seg.id)}
                        >
                          <div className="mt-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleSegmentInClip(seg.id)
                              }}
                              className="w-3.5 h-3.5 rounded border-gray-500 text-primary-400 focus:ring-primary-400"
                            />
                          </div>
                          <div
                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: speaker?.color || '#666' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] font-medium"
                                style={{ color: speaker?.color }}
                              >
                                {speaker?.name || '未知'}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {formatTime(seg.startTime)} -{' '}
                                {formatTime(seg.endTime)}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {seg.text}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {manualSegmentIds.length > 0 && (
                    <div className="flex gap-1 mt-2 pt-2 border-t border-gray-700">
                      <button
                        className="text-[10px] text-primary-400 hover:text-primary-300"
                        onClick={() => {
                          const allIds = currentAudioSegments.map((s) => s.id)
                          setManualSegmentIds(allIds)
                          updateTimeRangeFromSegments(allIds)
                        }}
                      >
                        全选
                      </button>
                      <span className="text-gray-600">·</span>
                      <button
                        className="text-[10px] text-gray-500 hover:text-gray-400"
                        onClick={() => {
                          setManualSegmentIds([])
                        }}
                      >
                        清空选择
                      </button>
                      <span className="text-gray-600">·</span>
                      <button
                        className="text-[10px] text-gray-500 hover:text-gray-400"
                        onClick={() => {
                          const targetIds = getTargetSegments()
                          setManualSegmentIds(targetIds)
                          updateTimeRangeFromSegments(targetIds)
                        }}
                      >
                        重置为默认
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    取消
                  </button>
                  <button
                    className="btn btn-primary flex-1"
                    onClick={handleAddClip}
                    disabled={manualSegmentIds.length === 0}
                  >
                    创建
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-300 border border-gray-700 rounded-lg w-[400px] p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">新建合集</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setShowNewCollectionModal(false)
                  setNewCollectionTitle('')
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">合集名称</label>
                <input
                  type="text"
                  value={newCollectionTitle}
                  onChange={(e) => setNewCollectionTitle(e.target.value)}
                  placeholder="输入合集名称"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      confirmCreateCollection()
                    }
                  }}
                />
              </div>

              <div className="p-2 bg-dark-200 rounded-lg">
                <p className="text-xs text-gray-400">
                  将合并 <span className="text-white font-medium">{selectedClipIds.size}</span> 个片段
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => {
                    setShowNewCollectionModal(false)
                    setNewCollectionTitle('')
                  }}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={confirmCreateCollection}
                  disabled={!newCollectionTitle.trim()}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

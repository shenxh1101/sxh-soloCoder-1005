import { useState } from 'react'
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
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { addClip, removeClip, updateClip } from '@/store/slices/projectSlice'
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

  const filteredClips =
    activeCategory === 'all'
      ? project.clips
      : project.clips.filter((c) => c.category === activeCategory)

  const getTargetSegments = () => {
    if (project.selectedSegmentIds.length > 0) {
      return project.selectedSegmentIds
    }

    const currentAudioSegments = project.segments
      .filter((s) => s.audioFileId === project.currentAudioFileId)
      .sort((a, b) => a.startTime - b.startTime)

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

  const handleAddClip = () => {
    if (!newClip.title.trim()) {
      alert('请输入片段标题')
      return
    }

    if (!project.currentAudioFileId) {
      alert('请先选择一个音频文件')
      return
    }

    const segmentIds = getTargetSegments()
    const segments = project.segments.filter((s) => segmentIds.includes(s.id))

    if (segments.length === 0) {
      alert('未找到可用的段落')
      return
    }

    dispatch(
      addClip({
        segmentIds,
        category: newClip.category,
        title: newClip.title,
        description: newClip.description,
      })
    )

    setShowAddModal(false)
    setNewClip({ category: 'golden', title: '', description: '' })
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
        <button
          className="btn btn-primary text-xs py-1.5"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          新建
        </button>
      </div>

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

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FolderOpen className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无片段</p>
            <p className="text-xs mt-1">点击上方按钮创建片段</p>
          </div>
        ) : (
          filteredClips.map((clip) => {
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
                  'p-3 rounded-lg border transition-all',
                  catInfo?.bgColor,
                  'border-gray-700 hover:border-gray-600'
                )}
              >
                <div className="flex items-start gap-2">
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
          <div className="bg-dark-300 border border-gray-700 rounded-lg w-96 p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">新建片段</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setShowAddModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  rows={3}
                />
              </div>

              {showAddModal && (
                <div className="p-3 bg-dark-100 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400">包含段落</label>
                    <span className="text-[10px] text-gray-500">
                      {project.selectedSegmentIds.length > 0
                        ? `已选择 ${project.selectedSegmentIds.length} 段`
                        : `当前播放位置附近 ${getTargetSegments().length} 段`}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {getTargetSegments().map((segId) => {
                      const seg = project.segments.find((s) => s.id === segId)
                      if (!seg) return null
                      const speaker = project.speakers.find(
                        (s) => s.id === seg.speaker
                      )
                      return (
                        <div
                          key={segId}
                          className="flex items-start gap-2 p-2 bg-dark-200 rounded"
                        >
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
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
                  <p className="text-[10px] text-gray-500 mt-2">
                    {project.selectedSegmentIds.length > 0
                      ? '提示：在文本校对中选择段落可精确指定片段内容'
                      : '提示：在文本校对中按住 Shift 点击可多选段落'}
                  </p>
                </div>
              )}

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

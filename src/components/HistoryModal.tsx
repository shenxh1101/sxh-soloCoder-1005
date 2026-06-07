import { useState } from 'react'
import { X, Clock, RotateCcw, Trash2, Save, ArrowRight, AlertTriangle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { restoreVersion, deleteVersion } from '@/store/slices/historySlice'
import { loadProjectState } from '@/store/slices/projectSlice'
import clsx from 'clsx'

interface HistoryModalProps {
  onClose: () => void
}

interface DiffPreview {
  versionId: string
  versionName: string
  current: {
    audioFiles: number
    segments: number
    markers: number
    clips: number
    speakers: number
  }
  target: {
    audioFiles: number
    segments: number
    markers: number
    clips: number
    speakers: number
  }
}

export default function HistoryModal({ onClose }: HistoryModalProps) {
  const dispatch = useAppDispatch()
  const history = useAppSelector((state) => state.history)
  const project = useAppSelector((state) => state.project)
  const [diffPreview, setDiffPreview] = useState<DiffPreview | null>(null)

  const showDiffPreview = (versionId: string) => {
    const version = history.versions.find((v) => v.id === versionId)
    if (!version) return

    setDiffPreview({
      versionId,
      versionName: version.name,
      current: {
        audioFiles: project.audioFiles.length,
        segments: project.segments.length,
        markers: project.markers.length,
        clips: project.clips.length,
        speakers: project.speakers.length,
      },
      target: {
        audioFiles: version.snapshot.audioFiles.length,
        segments: version.snapshot.segments.length,
        markers: version.snapshot.markers.length,
        clips: version.snapshot.clips.length,
        speakers: version.snapshot.speakers.length,
      },
    })
  }

  const confirmRestore = () => {
    if (!diffPreview) return

    const version = history.versions.find((v) => v.id === diffPreview.versionId)
    if (!version) return

    const snapshot = version.snapshot as any
    dispatch(
      loadProjectState({
        audioFiles: snapshot.audioFiles,
        segments: snapshot.segments,
        markers: snapshot.markers,
        clips: snapshot.clips,
        speakers: snapshot.speakers,
        currentAudioFileId: snapshot.currentAudioFileId,
        selectedSegmentIds: snapshot.selectedSegmentIds || [],
        filterSpeakerId: snapshot.filterSpeakerId || null,
      })
    )
    dispatch(restoreVersion(diffPreview.versionId))
    setDiffPreview(null)
    alert('版本已恢复！时间轴已自动切换到版本中的当前音频。')
    onClose()
  }

  const renderDiffItem = (label: string, current: number, target: number) => {
    const diff = target - current
    let diffColor = 'text-gray-400'
    let diffText = '不变'

    if (diff > 0) {
      diffColor = 'text-green-400'
      diffText = `+${diff}`
    } else if (diff < 0) {
      diffColor = 'text-red-400'
      diffText = `${diff}`
    }

    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
        <span className="text-xs text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300 w-8 text-right">{current}</span>
          <ArrowRight className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-300 w-8">{target}</span>
          <span className={clsx('text-xs w-12 text-right', diffColor)}>{diffText}</span>
        </div>
      </div>
    )
  }

  const handleDelete = (versionId: string) => {
    const confirmed = window.confirm('确定要删除这个版本吗？此操作不可撤销。')
    if (confirmed) {
      dispatch(deleteVersion(versionId))
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-dark-300 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">历史版本</h2>
              <p className="text-xs text-gray-400">
                {history.versions.length} 个版本 · 最多保存 {history.maxVersions} 个
              </p>
            </div>
          </div>
          <button
            className="p-2 hover:bg-dark-200 rounded text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {history.versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Save className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">暂无历史版本</p>
              <p className="text-xs mt-1">点击"保存版本"按钮创建版本快照</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.versions.map((version, index) => (
                <div
                  key={version.id}
                  className={clsx(
                    'p-4 rounded-lg border transition-all',
                    history.currentVersionId === version.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 bg-dark-200 hover:border-gray-600'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={clsx(
                          'w-3 h-3 rounded-full',
                          history.currentVersionId === version.id
                            ? 'bg-primary-500'
                            : 'bg-gray-600'
                        )}
                      />
                      {index < history.versions.length - 1 && (
                        <div className="w-px h-full bg-gray-700 mt-2" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-white truncate">
                          {version.name}
                        </h4>
                        {history.currentVersionId === version.id && (
                          <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] rounded-full">
                            当前
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(version.createdAt)}
                      </p>

                      {version.description && (
                        <p className="text-xs text-gray-400 mt-2">
                          {version.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
                        <span>{version.snapshot.audioFiles.length} 个音频</span>
                        <span>{version.snapshot.segments.length} 段文稿</span>
                        <span>{version.snapshot.clips.length} 个片段</span>
                        <span>{version.snapshot.markers.length} 个标记</span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          className="btn btn-secondary text-xs py-1 px-3"
                          onClick={() => showDiffPreview(version.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          恢复此版本
                        </button>
                        <button
                          className="btn btn-ghost text-xs py-1 px-3 text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(version.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button className="btn btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>

      {diffPreview && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="bg-dark-300 border border-gray-700 rounded-xl w-[480px] p-6 animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">恢复版本预览</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  即将恢复到 "{diffPreview.versionName}"
                </p>
              </div>
            </div>

            <div className="bg-dark-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                <span className="text-xs text-gray-500">项目</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8 text-right">当前</span>
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-500 w-8">目标</span>
                  <span className="text-xs text-gray-500 w-12 text-right">变化</span>
                </div>
              </div>

              {renderDiffItem('音频文件', diffPreview.current.audioFiles, diffPreview.target.audioFiles)}
              {renderDiffItem('文稿段落', diffPreview.current.segments, diffPreview.target.segments)}
              {renderDiffItem('标记数量', diffPreview.current.markers, diffPreview.target.markers)}
              {renderDiffItem('片段数量', diffPreview.current.clips, diffPreview.target.clips)}
              {renderDiffItem('说话人数量', diffPreview.current.speakers, diffPreview.target.speakers)}
            </div>

            <div className="bg-primary-400/10 border border-primary-400/30 rounded-lg p-3 mb-4">
              <p className="text-[11px] text-primary-300">
                💡 恢复后时间轴和文本校对将自动切换到该版本保存时的当前音频，
                未保存的更改将会丢失。
              </p>
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setDiffPreview(null)}
              >
                取消
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={confirmRestore}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

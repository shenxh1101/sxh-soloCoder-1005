import { X, Clock, RotateCcw, Trash2, Save } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { restoreVersion, deleteVersion } from '@/store/slices/historySlice'
import { loadProjectState } from '@/store/slices/projectSlice'
import clsx from 'clsx'

interface HistoryModalProps {
  onClose: () => void
}

export default function HistoryModal({ onClose }: HistoryModalProps) {
  const dispatch = useAppDispatch()
  const history = useAppSelector((state) => state.history)

  const handleRestore = (versionId: string) => {
    const version = history.versions.find((v) => v.id === versionId)
    if (!version) return

    const confirmed = window.confirm(
      `确定要恢复到版本 "${version.name}" 吗？当前未保存的更改将丢失。`
    )
    if (!confirmed) return

    dispatch(
      loadProjectState({
        audioFiles: version.snapshot.audioFiles,
        segments: version.snapshot.segments,
        markers: version.snapshot.markers,
        clips: version.snapshot.clips,
        speakers: version.snapshot.speakers,
      })
    )
    dispatch(restoreVersion(versionId))
    alert('版本已恢复！')
    onClose()
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
                          onClick={() => handleRestore(version.id)}
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
    </div>
  )
}

import { Upload, Music, Trash2, Play, FileAudio, Clock, HardDrive, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { addAudioFiles, removeAudioFile, setCurrentAudioFile, generateTranscript } from '@/store/slices/projectSlice'
import { formatTime, formatFileSize } from '@/utils/time'

export default function ImportPanel() {
  const dispatch = useAppDispatch()
  const project = useAppSelector((state) => state.project)

  const handleImport = async () => {
    try {
      const files = await window.electronAPI?.openAudioFiles()
      if (files && files.length > 0) {
        dispatch(addAudioFiles({ paths: files }))
      }
    } catch (error) {
      console.error('导入文件失败:', error)
    }
  }

  const handleGenerateTranscript = (audioFileId: string) => {
    dispatch(generateTranscript(audioFileId))
  }

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title">
          <Music className="w-4 h-4 text-primary-400" />
          导入区
        </h2>
        <button className="btn btn-primary text-xs py-1.5" onClick={handleImport}>
          <Upload className="w-3.5 h-3.5" />
          导入音频
        </button>
      </div>

      <div className="panel-content flex-1 overflow-y-auto">
        {project.audioFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileAudio className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无音频文件</p>
            <p className="text-xs mt-1">点击上方按钮导入音频</p>
          </div>
        ) : (
          <div className="space-y-3">
            {project.audioFiles.map((file) => (
              <div
                key={file.id}
                className={`card cursor-pointer transition-all ${
                  project.currentAudioFileId === file.id
                    ? 'border-primary-500 bg-primary-500/10'
                    : ''
                }`}
                onClick={() => dispatch(setCurrentAudioFile(file.id))}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      project.currentAudioFileId === file.id
                        ? 'bg-primary-600'
                        : 'bg-dark-100'
                    }`}
                  >
                    <Music
                      className={`w-5 h-5 ${
                        project.currentAudioFileId === file.id
                          ? 'text-white'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-200 truncate">
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(file.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        className="btn btn-secondary text-xs py-1 flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateTranscript(file.id)
                        }}
                        disabled={project.isGeneratingTranscript}
                      >
                        {project.isGeneratingTranscript ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            生成文稿
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-ghost p-1.5"
                        onClick={(e) => {
                          e.stopPropagation()
                          dispatch(removeAudioFile(file.id))
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {project.audioFiles.length > 0 && (
          <div className="mt-4 p-3 bg-dark-200 rounded-lg border border-gray-700">
            <h4 className="text-xs font-medium text-gray-400 mb-2">统计信息</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">音频数量</span>
                <p className="text-white font-medium">{project.audioFiles.length} 个</p>
              </div>
              <div>
                <span className="text-gray-500">总时长</span>
                <p className="text-white font-medium">
                  {formatTime(
                    project.audioFiles.reduce((acc, f) => acc + f.duration, 0)
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500">文稿段落</span>
                <p className="text-white font-medium">{project.segments.length} 段</p>
              </div>
              <div>
                <span className="text-gray-500">说话人</span>
                <p className="text-white font-medium">{project.speakers.length} 人</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

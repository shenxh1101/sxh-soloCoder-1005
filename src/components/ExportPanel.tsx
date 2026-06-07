import { useState } from 'react'
import {
  Download,
  X,
  FileText,
  List,
  Subtitles,
  Lightbulb,
  Check,
  Settings,
  Copy,
  FileDown,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { togglePanel } from '@/store/slices/uiSlice'
import type { ExportOptions } from '@/types'
import {
  generateTranscript,
  generateSRT,
  generateVTT,
  generateClipList,
  generateEditSuggestions,
  downloadFile,
} from '@/utils/export'

export default function ExportPanel() {
  const dispatch = useAppDispatch()
  const project = useAppSelector((state) => state.project)
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings')
  const [previewContent, setPreviewContent] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    exportTranscript: true,
    exportClips: true,
    exportSubtitles: true,
    exportEditSuggestions: true,
    transcriptFormat: 'txt',
    includeTimecodes: true,
    includeSpeakerNames: true,
    includeAnnotations: true,
    includeDeletedSegments: false,
    includeHeader: true,
  })

  const currentSegments = project.segments
    .filter((s) => s.audioFileId === project.currentAudioFileId)
    .sort((a, b) => a.startTime - b.startTime)

  const currentAudioFile = project.audioFiles.find(
    (f) => f.id === project.currentAudioFileId
  )

  const handlePreview = (type: 'transcript' | 'clips' | 'subtitles' | 'suggestions') => {
    let content = ''
    let title = ''

    switch (type) {
      case 'transcript':
        content = generateTranscript(currentSegments, project.speakers, exportOptions)
        title = '文稿预览'
        break
      case 'clips':
        content = generateClipList(project.clips, project.segments)
        title = '片段清单预览'
        break
      case 'subtitles':
        content =
          exportOptions.transcriptFormat === 'srt'
            ? generateSRT(currentSegments)
            : generateVTT(currentSegments)
        title = `字幕预览 (${exportOptions.transcriptFormat.toUpperCase()})`
        break
      case 'suggestions':
        content = generateEditSuggestions(
          currentSegments,
          project.markers.filter((m) => m.audioFileId === project.currentAudioFileId),
          project.clips
        )
        title = '剪辑建议预览'
        break
    }

    setPreviewContent(content)
    setPreviewTitle(title)
    setActiveTab('preview')
  }

  const handleExport = (type: 'transcript' | 'clips' | 'subtitles' | 'suggestions') => {
    let content = ''
    let filename = ''
    let mimeType = 'text/plain'

    const baseName = currentAudioFile?.name.replace(/\.[^/.]+$/, '') || 'podcast'

    switch (type) {
      case 'transcript':
        content = generateTranscript(currentSegments, project.speakers, exportOptions)
        filename = `${baseName}_文稿.${exportOptions.transcriptFormat === 'srt' ? 'srt' : exportOptions.transcriptFormat === 'vtt' ? 'vtt' : 'txt'}`
        mimeType = 'text/plain'
        break
      case 'clips':
        content = generateClipList(project.clips, project.segments)
        filename = `${baseName}_片段清单.txt`
        mimeType = 'text/plain'
        break
      case 'subtitles':
        if (exportOptions.transcriptFormat === 'srt') {
          content = generateSRT(currentSegments)
          filename = `${baseName}_字幕.srt`
          mimeType = 'application/x-subrip'
        } else {
          content = generateVTT(currentSegments)
          filename = `${baseName}_字幕.vtt`
          mimeType = 'text/vtt'
        }
        break
      case 'suggestions':
        content = generateEditSuggestions(
          currentSegments,
          project.markers.filter((m) => m.audioFileId === project.currentAudioFileId),
          project.clips
        )
        filename = `${baseName}_剪辑建议.txt`
        mimeType = 'text/plain'
        break
    }

    downloadFile(content, filename, mimeType)
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewContent)
    alert('已复制到剪贴板')
  }

  const handleExportAll = () => {
    if (exportOptions.exportTranscript) handleExport('transcript')
    if (exportOptions.exportClips) handleExport('clips')
    if (exportOptions.exportSubtitles) handleExport('subtitles')
    if (exportOptions.exportEditSuggestions) handleExport('suggestions')
    dispatch(togglePanel('export'))
  }

  const exportItems = [
    {
      key: 'transcript',
      label: '带时间码的文稿',
      icon: FileText,
      description: '包含说话人、时间码和注释的完整文稿',
      enabled: exportOptions.exportTranscript,
      onToggle: () =>
        setExportOptions({
          ...exportOptions,
          exportTranscript: !exportOptions.exportTranscript,
        }),
    },
    {
      key: 'clips',
      label: '片段清单',
      icon: List,
      description: '所有收藏片段的详细列表',
      enabled: exportOptions.exportClips,
      onToggle: () =>
        setExportOptions({ ...exportOptions, exportClips: !exportOptions.exportClips }),
    },
    {
      key: 'subtitles',
      label: '字幕文件',
      icon: Subtitles,
      description: 'SRT 或 VTT 格式的字幕文件',
      enabled: exportOptions.exportSubtitles,
      onToggle: () =>
        setExportOptions({
          ...exportOptions,
          exportSubtitles: !exportOptions.exportSubtitles,
        }),
    },
    {
      key: 'suggestions',
      label: '剪辑建议',
      icon: Lightbulb,
      description: '基于标记和分段的智能剪辑建议',
      enabled: exportOptions.exportEditSuggestions,
      onToggle: () =>
        setExportOptions({
          ...exportOptions,
          exportEditSuggestions: !exportOptions.exportEditSuggestions,
        }),
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-8">
      <div className="bg-dark-300 border border-gray-700 rounded-xl w-full max-w-5xl h-full max-h-[800px] flex flex-col animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">导出设置</h2>
              <p className="text-xs text-gray-400">
                {currentAudioFile?.name || '未选择文件'}
              </p>
            </div>
          </div>
          <button
            className="p-2 hover:bg-dark-200 rounded text-gray-400 hover:text-white"
            onClick={() => dispatch(togglePanel('export'))}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-700">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            导出设置
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            预览
            {previewTitle && ` - ${previewTitle}`}
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'settings' ? (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="font-medium text-gray-200 mb-4">选择导出内容</h3>
                <div className="space-y-3">
                  {exportItems.map((item) => (
                    <div
                      key={item.key}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        item.enabled
                          ? 'border-primary-500/50 bg-primary-500/5'
                          : 'border-gray-700 bg-dark-200 hover:border-gray-600'
                      }`}
                      onClick={item.onToggle}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            item.enabled ? 'bg-primary-600/20' : 'bg-dark-100'
                          }`}
                        >
                          <item.icon
                            className={`w-5 h-5 ${
                              item.enabled ? 'text-primary-400' : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-200">
                              {item.label}
                            </h4>
                            {item.enabled && (
                              <Check className="w-4 h-4 text-primary-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            item.enabled
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-gray-600'
                          }`}
                        >
                          {item.enabled && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      {item.enabled && (
                        <div className="flex gap-2 mt-3 ml-13">
                          <button
                            className="btn btn-secondary text-xs py-1.5"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePreview(item.key as any)
                            }}
                          >
                            预览
                          </button>
                          <button
                            className="btn btn-primary text-xs py-1.5"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExport(item.key as any)
                            }}
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            导出
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-72 border-l border-gray-700 p-6 bg-dark-200/50">
                <h3 className="font-medium text-gray-200 mb-4">导出选项</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">
                      文稿格式
                    </label>
                    <select
                      value={exportOptions.transcriptFormat}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          transcriptFormat: e.target.value as any,
                        })
                      }
                      className="w-full text-sm"
                    >
                      <option value="txt">TXT 文本</option>
                      <option value="srt">SRT 字幕</option>
                      <option value="vtt">VTT 字幕</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeTimecodes}
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeTimecodes: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-dark-100 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-300">包含时间码</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeSpeakerNames}
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeSpeakerNames: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-dark-100 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-300">包含说话人名称</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeAnnotations}
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeAnnotations: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-dark-100 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-300">包含注释</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeDeletedSegments}
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeDeletedSegments: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-dark-100 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-300">包含已删除片段</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeHeader}
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeHeader: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-dark-100 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-300">包含文稿头部</span>
                    </label>
                  </div>

                  <div className="divider" />

                  <div className="p-3 bg-dark-100 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-400 mb-2">导出统计</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">文稿段落</span>
                        <span className="text-white">{currentSegments.length} 段</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">片段数</span>
                        <span className="text-white">{project.clips.length} 个</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">标记数</span>
                        <span className="text-white">{project.markers.length} 个</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">说话人数</span>
                        <span className="text-white">{project.speakers.length} 人</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700">
                <h3 className="font-medium text-gray-200">{previewTitle}</h3>
                <button
                  className="btn btn-secondary text-xs py-1.5"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="w-3.5 h-3.5" />
                  复制到剪贴板
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {previewContent || '选择导出内容并点击预览'}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            className="btn btn-secondary"
            onClick={() => dispatch(togglePanel('export'))}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExportAll}
          >
            <Download className="w-4 h-4" />
            导出全部
          </button>
        </div>
      </div>
    </div>
  )
}
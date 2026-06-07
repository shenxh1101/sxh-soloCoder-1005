import {
  Mic2,
  History,
  Save,
  Download,
  LayoutGrid,
  Columns2,
  Columns3,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { setPanelLayout, togglePanel } from '@/store/slices/uiSlice'
import { saveVersion } from '@/store/slices/historySlice'
import { useState } from 'react'
import HistoryModal from './HistoryModal'

export default function Header() {
  const dispatch = useAppDispatch()
  const ui = useAppSelector((state) => state.ui)
  const project = useAppSelector((state) => state.project)
  const [showHistory, setShowHistory] = useState(false)

  const handleSaveVersion = () => {
    const name = prompt('输入版本名称：', `版本 ${new Date().toLocaleString('zh-CN')}`)
    if (name) {
      dispatch(
        saveVersion({
          name,
          description: '',
          snapshot: {
            audioFiles: project.audioFiles,
            segments: project.segments,
            markers: project.markers,
            clips: project.clips,
            speakers: project.speakers,
            currentAudioFileId: project.currentAudioFileId,
            selectedSegmentIds: project.selectedSegmentIds,
            filterSpeakerId: project.filterSpeakerId,
            searchQuery: project.searchQuery,
            isGeneratingTranscript: project.isGeneratingTranscript,
            playbackState: {
              isPlaying: false,
              currentTime: 0,
              duration: 0,
              playbackRate: 1,
              volume: 0.8,
              isMuted: false,
            },
          } as any,
        })
      )
      alert('版本已保存！')
    }
  }

  return (
    <header className="h-14 bg-dark-300 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Mic2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">播客剪辑工作台</h1>
        </div>

        <div className="h-6 w-px bg-gray-700 mx-2" />

        <div className="flex items-center gap-1">
          <button
            className={`px-3 py-1.5 rounded text-sm ${
              ui.activePanel === 'import' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
            onClick={() => dispatch(togglePanel('import'))}
          >
            导入区
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${
              ui.activePanel === 'timeline' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
            onClick={() => dispatch(togglePanel('timeline'))}
          >
            时间轴
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${
              ui.activePanel === 'text' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
            onClick={() => dispatch(togglePanel('text'))}
          >
            文本校对
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${
              ui.activePanel === 'clips' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
            onClick={() => dispatch(togglePanel('clips'))}
          >
            片段库
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${
              ui.showExportPanel ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
            onClick={() => dispatch(togglePanel('export'))}
          >
            导出设置
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-dark-200 rounded-lg p-1">
          <button
            className={`p-1.5 rounded ${ui.panelLayout === 'two-column' ? 'bg-dark-100 text-white' : 'text-gray-400'}`}
            onClick={() => dispatch(setPanelLayout('two-column'))}
            title="双栏布局"
          >
            <Columns2 className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 rounded ${ui.panelLayout === 'three-column' ? 'bg-dark-100 text-white' : 'text-gray-400'}`}
            onClick={() => dispatch(setPanelLayout('three-column'))}
            title="三栏布局"
          >
            <Columns3 className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 rounded ${ui.panelLayout === 'focus' ? 'bg-dark-100 text-white' : 'text-gray-400'}`}
            onClick={() => dispatch(setPanelLayout('focus'))}
            title="聚焦模式"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-700 mx-1" />

        <button
          className="btn btn-ghost"
          onClick={() => setShowHistory(true)}
          title="历史版本"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleSaveVersion}
        >
          <Save className="w-4 h-4" />
          保存版本
        </button>

        <button
          className="btn btn-primary"
          onClick={() => dispatch(togglePanel('export'))}
        >
          <Download className="w-4 h-4" />
          导出
        </button>

        <div className="h-6 w-px bg-gray-700 mx-1" />

        <button
          className="p-2 hover:bg-dark-200 rounded text-gray-400 hover:text-white"
          onClick={() => window.electronAPI?.minimize()}
        >
          <Minimize2 className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-dark-200 rounded text-gray-400 hover:text-white"
          onClick={() => window.electronAPI?.maximize()}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-red-600 rounded text-gray-400 hover:text-white"
          onClick={() => window.electronAPI?.close()}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </header>
  )
}

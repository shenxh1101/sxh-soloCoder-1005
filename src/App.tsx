import { useEffect } from 'react'
import { useAppSelector } from './store'
import Header from './components/Header'
import ImportPanel from './components/ImportPanel'
import TimelinePanel from './components/TimelinePanel'
import TextPanel from './components/TextPanel'
import ClipsPanel from './components/ClipsPanel'
import ExportPanel from './components/ExportPanel'
import { loadProjectState } from './store/slices/projectSlice'
import { loadHistoryFromStorageAction } from './store/slices/historySlice'
import { generateDemoProject } from './utils/mockData'
import { useAppDispatch } from './store'

function App() {
  const ui = useAppSelector((state) => state.ui)
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(loadHistoryFromStorageAction())
    
    const demoData = generateDemoProject()
    dispatch(
      loadProjectState({
        audioFiles: demoData.audioFiles,
        segments: demoData.segments,
        markers: demoData.markers,
        clips: demoData.clips,
        speakers: demoData.speakers,
      })
    )
  }, [dispatch])

  return (
    <div className="h-screen flex flex-col bg-dark-400 overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {ui.showImportPanel && (
          <div className="w-72 flex-shrink-0 flex flex-col">
            <ImportPanel />
          </div>
        )}

        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {ui.showTimelinePanel && (
            <div className="h-64 flex-shrink-0">
              <TimelinePanel />
            </div>
          )}

          {ui.showTextPanel && (
            <div className="flex-1 min-h-0">
              <TextPanel />
            </div>
          )}
        </div>

        {ui.showClipsPanel && (
          <div className="w-80 flex-shrink-0 flex flex-col">
            <ClipsPanel />
          </div>
        )}
      </div>

      {ui.showExportPanel && <ExportPanel />}
    </div>
  )
}

export default App

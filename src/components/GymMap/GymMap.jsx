import { useState } from 'react'
import GymBrowser from './GymBrowser'
import GymSeriesCreator from './GymSeriesCreator'
import GymSeriesDetail from './GymSeriesDetail'

function GymMap({ playerTeam, trainerInfo }) {
  const [view, setView] = useState('browser') // 'browser', 'creator', 'detail', 'battle'
  const [selectedSeries, setSelectedSeries] = useState(null)
  const [selectedGym, setSelectedGym] = useState(null)

  const handleSelectSeries = (series) => {
    setSelectedSeries(series)
    setView('detail')
  }

  const handleCreateNew = () => {
    setView('creator')
  }

  const handleSeriesCreated = (series) => {
    setSelectedSeries(series)
    setView('detail')
  }

  const handleStartGym = (series, gym) => {
    setSelectedSeries(series)
    setSelectedGym(gym)
    setView('battle')
    // TODO: Launch battle with gym mode
    alert(`Starting ${gym.gym_leader_name}'s gym! (Battle integration coming next)`)
  }

  const handleBack = () => {
    if (view === 'detail') {
      setView('browser')
      setSelectedSeries(null)
    } else if (view === 'creator') {
      setView('browser')
    }
  }

  return (
    <div>
      {view === 'browser' && (
        <GymBrowser 
          onSelectSeries={handleSelectSeries}
          onCreateNew={handleCreateNew}
        />
      )}

      {view === 'creator' && (
        <GymSeriesCreator
          onBack={handleBack}
          onCreated={handleSeriesCreated}
        />
      )}

      {view === 'detail' && selectedSeries && (
        <GymSeriesDetail
          series={selectedSeries}
          onBack={handleBack}
          onStartGym={handleStartGym}
        />
      )}

      {view === 'battle' && selectedGym && (
        <div className="text-center p-12">
          <p className="text-amber-50 text-2xl font-bold mb-4">
            Battle integration coming next!
          </p>
          <button
            onClick={handleBack}
            className="bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 py-3 px-8 rounded-2xl font-bold text-amber-200 border-4 border-double border-stone-950 shadow-lg"
          >
            Back to Series
          </button>
        </div>
      )}
    </div>
  )
}

export default GymMap

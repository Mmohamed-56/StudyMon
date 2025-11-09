import { useState } from 'react'
import GymBrowser from './GymBrowser'
import GymSeriesCreator from './GymSeriesCreator'
import GymSeriesDetail from './GymSeriesDetail'
import Battle from '../Battle/Battle'

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
  }

  const handleGymVictory = (gym) => {
    // Victory handled in Battle component, just return to detail view
    setView('detail')
  }

  const handleBattleExit = () => {
    // Return to gym detail view
    setView('detail')
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

      {view === 'battle' && selectedGym && selectedSeries && (
        <Battle
          playerTeam={playerTeam}
          trainerInfo={trainerInfo}
          mode="gym"
          gymData={{
            series: selectedSeries,
            gym: selectedGym
          }}
          onExit={handleBattleExit}
          onGymVictory={handleGymVictory}
        />
      )}
    </div>
  )
}

export default GymMap

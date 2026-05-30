import React from 'react'
import MapComponent from './components/MapComponent'
import SimulationControlPanel from './components/SimulationControlPanel'
import Sidebar from './components/Sidebar'

function App() {
  return (
    <div className="w-screen h-screen relative bg-gray-900 overflow-hidden">
      <MapComponent />
      <SimulationControlPanel />
      <Sidebar />
    </div>
  )
}

export default App

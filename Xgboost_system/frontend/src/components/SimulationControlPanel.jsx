import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import debounce from 'lodash/debounce';

export default function SimulationControlPanel() {
  const setSimulationParams = useStore((state) => state.setSimulationParams);
  const simulationParams = useStore((state) => state.simulationParams);
  
  // Local state for instant slider updates
  const [localParams, setLocalParams] = useState(simulationParams);

  // Debounced updater for global state (triggers API call)
  const debouncedSetParams = useCallback(
    debounce((newParams) => {
      setSimulationParams(newParams);
    }, 300),
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let parsedValue = value;
    if (name === 'time' || name === 'temperature') {
        parsedValue = parseFloat(value);
    } else if (name === 'day') {
        parsedValue = parseInt(value, 10);
    }

    const newParams = { ...localParams, [name]: parsedValue };
    setLocalParams(newParams);
    debouncedSetParams(newParams);
  };

  return (
    <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md p-6 rounded-xl border border-gray-700/50 text-white w-80 shadow-2xl z-10 font-sans">
      <h2 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
        Simulation Controls
      </h2>
      
      <div className="space-y-6">
        <div>
          <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
            <span>Time of Day</span>
            <span>{localParams.time}:00</span>
          </label>
          <input
            type="range"
            name="time"
            min="0"
            max="23"
            step="1"
            value={localParams.time}
            onChange={handleChange}
            className="w-full accent-blue-500 hover:accent-blue-400 transition-all"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
            <span>Day of Week</span>
            <span>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][localParams.day]}</span>
          </label>
          <input
            type="range"
            name="day"
            min="0"
            max="6"
            step="1"
            value={localParams.day}
            onChange={handleChange}
            className="w-full accent-purple-500 hover:accent-purple-400 transition-all"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
            <span>Temperature (°C)</span>
            <span>{localParams.temperature}°C</span>
          </label>
          <input
            type="range"
            name="temperature"
            min="-10"
            max="40"
            step="0.5"
            value={localParams.temperature}
            onChange={handleChange}
            className="w-full accent-emerald-500 hover:accent-emerald-400 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Weather Condition
          </label>
          <select
            name="weather"
            value={localParams.weather}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="Clear">Clear</option>
            <option value="Rain">Rain</option>
            <option value="Snow">Snow</option>
            <option value="Cloudy">Cloudy</option>
          </select>
        </div>
      </div>
    </div>
  );
}

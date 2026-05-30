import { create } from 'zustand';

export const useStore = create((set) => ({
  simulationParams: {
    time: 12,
    day: 3,
    temperature: 22,
    weather: 'Clear',
  },
  mapData: [],
  isSimulating: false,
  metrics: {
    r2Score: 93.16, // Real model R^2 score
    rmse: 0.0372,   // Real model RMSE
  },
  setSimulationParams: (params) => set((state) => ({
    simulationParams: { ...state.simulationParams, ...params }
  })),
  setMapData: (data) => set({ mapData: data }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
}));

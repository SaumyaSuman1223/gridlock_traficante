import React, { useEffect, useState } from 'react';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { PolygonLayer } from '@deck.gl/layers';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';
import { useStore } from '../store';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const getGeohashBounds = (lat, lon, delta = 0.002) => {
  return [
    [lon - delta, lat - delta],
    [lon - delta, lat + delta],
    [lon + delta, lat + delta],
    [lon + delta, lat - delta]
  ];
};

const getTrafficColor = (value, maxDemand = 1.0) => {
  const normalized = Math.min(Math.max(value / maxDemand, 0), 1);
  const alpha = 200;
  
  if (normalized < 0.4) return [59, 130, 246, alpha];  // Low
  if (normalized < 0.7) return [234, 179, 8, alpha];   // Average
  return [239, 68, 68, alpha];                         // High
};

const INITIAL_VIEW_STATE = {
  longitude: 90.7641,
  latitude: -5.3483,
  zoom: 11,
  minZoom: 0,
  maxZoom: 18,
  pitch: 45,
  bearing: 0
};

export default function MapComponent() {
  const simulationParams = useStore((state) => state.simulationParams);
  const mapData = useStore((state) => state.mapData);
  const setMapData = useStore((state) => state.setMapData);
  const setIsSimulating = useStore((state) => state.setIsSimulating);
  
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // Trigger API call when simulationParams change
  useEffect(() => {
    const fetchPredictions = async () => {
      setIsSimulating(true);
      try {
        const response = await axios.post('http://localhost:8000/api/predict', simulationParams);
        const data = response.data;
        
        setMapData(data);

        // Center map on first load
        if (data.length > 0 && viewState.longitude === 0) {
          const sumLat = data.reduce((acc, curr) => acc + curr.lat, 0);
          const sumLon = data.reduce((acc, curr) => acc + curr.lon, 0);
          setViewState(prev => ({
            ...prev,
            longitude: sumLon / data.length,
            latitude: sumLat / data.length,
          }));
        }
      } catch (error) {
        console.error("Error fetching predictions:", error);
      } finally {
        setIsSimulating(false);
      }
    };

    fetchPredictions();
  }, [simulationParams, setMapData, setIsSimulating]);

  const layers = [
    new PolygonLayer({
      id: 'traffic-road-bounds',
      data: mapData,
      pickable: true,
      stroked: true,
      filled: true,
      extruded: true,
      wireframe: true,
      lineWidthMinPixels: 2,
      getPolygon: d => getGeohashBounds(parseFloat(d.lat), parseFloat(d.lon)),
      getFillColor: d => getTrafficColor(parseFloat(d.demand), 1.0),
      getLineColor: [255, 255, 255, 30],
      getElevation: d => Math.max(d.demand * 1500, 10), // minimum elevation
      transitions: {
        getElevation: {
            duration: 500,
            enter: () => [0]
        },
        getFillColor: {
            duration: 500
        }
      },
      updateTriggers: {
        getElevation: [mapData],
        getFillColor: [mapData]
      }
    })
  ];

  return (
    <div className="w-full h-full relative bg-gray-900">
      <DeckGL
        viewState={viewState}
        onViewStateChange={e => setViewState(e.viewState)}
        controller={{ dragPan: true, scrollZoom: true, doubleClickZoom: false }}
        layers={layers}
        getTooltip={({ object }) => object && {
          html: `
            <div class="px-3 py-2 bg-gray-900/95 border border-gray-700 text-white rounded shadow-2xl text-xs space-y-1 font-sans backdrop-blur-md">
              <div class="text-blue-400 font-bold border-b border-gray-700 pb-1 mb-1">${object.geohash}</div>
              <div><strong class="text-gray-400">Demand:</strong> <span class="text-emerald-400">${(object.demand || 0).toFixed(3)}</span></div>
              <div><strong class="text-gray-400">Road Class:</strong> ${object.RoadType || 'Standard'}</div>
            </div>
          `,
          style: { backgroundColor: 'transparent', padding: '0px' }
        }}
      />
    </div>
  );
}

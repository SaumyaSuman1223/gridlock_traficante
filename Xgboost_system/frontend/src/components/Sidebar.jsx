import React from 'react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Mock SHAP data for the waterfall chart
const shapData = [
  { name: 'Base Value', value: 0.15, isTotal: true },
  { name: 'Time of Day', value: 0.25 },
  { name: 'Road Type', value: 0.10 },
  { name: 'Temperature', value: -0.05 },
  { name: 'Weather', value: 0.08 },
  { name: 'Prediction', value: 0.53, isTotal: true },
];

// Helper to format waterfall data correctly for Recharts
const processWaterfallData = (data) => {
    let current = 0;
    return data.map((item) => {
        if (item.isTotal) {
            current = item.value;
            return { ...item, start: 0, end: item.value, color: '#8884d8' };
        } else {
            const start = current;
            const end = current + item.value;
            current = end;
            return { 
                ...item, 
                start, 
                end, 
                color: item.value >= 0 ? '#10b981' : '#ef4444' // Green for positive, Red for negative
            };
        }
    });
};

const processedShap = processWaterfallData(shapData);

export default function Sidebar() {
  const metrics = useStore((state) => state.metrics);

  return (
    <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-md p-6 rounded-xl border border-gray-700/50 text-white w-96 shadow-2xl z-10 font-sans flex flex-col h-[calc(100vh-32px)]">
      <h2 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
        Analytics Engine
      </h2>
      
      <div className="flex gap-4 mb-8">
        <div className="flex-1 bg-gray-800/80 p-4 rounded-lg border border-gray-700 text-center">
            <div className="text-sm text-gray-400 mb-1">Model Accuracy</div>
            <div className="text-3xl font-bold text-emerald-400">{metrics.r2Score.toFixed(1)}</div>
            <div className="text-xs text-gray-500 mt-1">100 × R² Scaled</div>
        </div>
        <div className="flex-1 bg-gray-800/80 p-4 rounded-lg border border-gray-700 text-center">
            <div className="text-sm text-gray-400 mb-1">Error (RMSE)</div>
            <div className="text-3xl font-bold text-blue-400">{metrics.rmse.toFixed(3)}</div>
            <div className="text-xs text-gray-500 mt-1">Absolute Demand</div>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Local Feature Impact (SHAP)</h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={processedShap}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#9ca3af', fontSize: 12}} />
                <RechartsTooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    formatter={(value, name, props) => {
                        const originalValue = props.payload.value;
                        return [originalValue > 0 ? `+${originalValue}` : originalValue, 'Impact'];
                    }}
                />
                <Bar dataKey="end" fill="#8884d8" shape={(props) => {
                    const { x, y, width, height, start, end, color } = props;
                    const scale = width / end;
                    const barX = start * scale + props.x - (start * scale);
                    const barWidth = Math.abs(end - start) * scale;
                    
                    return (
                        <rect 
                            x={barX} 
                            y={y + height/4} 
                            width={barWidth} 
                            height={height/2} 
                            fill={color} 
                            rx={2} 
                            ry={2}
                        />
                    );
                }} />
            </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-500 text-center">
            XGBoost Inference Engine Active
        </p>
      </div>
    </div>
  );
}

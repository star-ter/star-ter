
import React from 'react';
import { Info } from 'lucide-react';

interface TrendItem {
  quarter: string; // e.g. "20242"
  sales: string;   // e.g. "1500000000"
}

interface SalesTrendGraphProps {
  color?: string;
  data?: TrendItem[] | number[]; // Accept both for backward compat or strictly TrendItem[]
}

export default function SalesTrendGraph({
  color = '#4A90E2',
  data = [], 
}: SalesTrendGraphProps) {
  // Normalize data to points
  let pointsData: number[] = [];
  let labels: string[] = [];

  if (Array.isArray(data) && data.length > 0) {
      if (typeof data[0] === 'number') {
          pointsData = data as number[];
          labels = pointsData.map((_, i) => `${i + 1}`); // fallback labels
      } else {
          // It's TrendItem[]
          const items = data as TrendItem[];
          // Sort specific to quarters just in case
          const sorted = [...items].sort((a, b) => a.quarter.localeCompare(b.quarter));
          
          pointsData = sorted.map(d => parseInt(d.sales, 10));
          labels = sorted.map(d => {
             const q = d.quarter.slice(4);
             return `${q}분기`;
          });
      }
  } else {
       // Placeholder mock if empty
       pointsData = [0, 0, 0, 0];
       labels = ['-', '-', '-', '-'];
  }

  // Calculate scaling
  const maxVal = Math.max(...pointsData, 1);
  const minVal = Math.min(...pointsData);
  // Add some padding to max for visual appeal
  const maxScale = maxVal * 1.1; 

  const height = 180;
  const width = 360;
  const paddingX = 40;
  const paddingY = 20;
  const graphHeight = height - paddingY - 10;
  const graphWidth = width - paddingX - 10;

  // Bar chart configurations
  const barWidth = 30; // Width of each bar
  
  // Function to calculate bar properties
  const getBarProps = (val: number, idx: number, length: number) => {
    // Distribute bars evenly
    // xCenter is the center position of value labels and bars
    const xStep = graphWidth / length;
    const xCenter = paddingX + (xStep * idx) + (xStep / 2);
    
    // Calculate Height
    // Scale: (val / maxScale) * graphHeight
    const barHeight = (val / maxScale) * graphHeight;
    const y = graphHeight - barHeight + 10;
    
    return { x: xCenter - barWidth / 2, y, width: barWidth, height: barHeight, center: xCenter };
  };

  const bars = pointsData.map((val, idx) => getBarProps(val, idx, pointsData.length));

  // Y-Axis Ticks (Approximate)
  const ticks = [0, maxScale * 0.33, maxScale * 0.66, maxScale].map(v => Math.round(v));

  // Helper formats
  const formatTick = (val: number) => {
      if (val === 0) return '0';
      if (val >= 100000000) {
          return `${Math.round(val / 100000000)}억`;
      }
      return val.toString();
  };

  return (
    <div className="w-full mt-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 px-1">
        <h4 className="text-[12px] font-semibold text-gray-900">
          최근 1년 동안 매출 변화 추정 그래프
        </h4>
        <div className="relative group">
          <Info size={14} className="text-gray-400 cursor-help" />
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 w-max px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-sm">
            상권 내 총 매출 추이
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div className="relative w-full h-[180px] bg-slate-50/50 rounded-lg overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid Layout & Ticks */}
            {ticks.map((tick, index) => {
             const normalizedTick = tick / Math.max(maxScale, 1);
             const y = graphHeight - (normalizedTick * graphHeight) + 10;
            return (
              <g key={`tick-${tick}-${index}`}>
                <text
                  x={paddingX - 5}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#9CA3AF"
                >
                  {formatTick(tick)}
                </text>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="0.8"
                  strokeDasharray={tick === 0 ? "0" : "4 4"} // Dashed lines for non-zero ticks
                />
              </g>
            );
          })}


          {/* Bar Charts and X-Axis Labels */}
          {bars.map((bar, i) => (
              <g key={i}>
                  {/* Bar */}
                  <rect
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      rx="4" // Rounded corners top
                      ry="4"
                      fill={color}
                      opacity={0.8}
                  >
                    <animate attributeName="height" from="0" to={bar.height} dur="0.8s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
                    <animate attributeName="y" from={graphHeight + 10} to={bar.y} dur="0.8s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
                  </rect>
                  
                  {/* X-Axis Label (Quarter) - Rendered inside SVG for perfect alignment */}
                  <text
                      x={bar.center}
                      y={height - 2} // Position at the bottom
                      textAnchor="middle"
                      fontSize="12"
                      fill="#6B7280" // text-gray-500
                      fontWeight="500"
                  >
                     {labels[i]} 
                  </text>
              </g>
          ))}

        </svg>
      </div>
    </div>
  );
}

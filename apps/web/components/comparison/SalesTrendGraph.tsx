
import React from 'react';
import { Info } from 'lucide-react';

interface SalesTrendGraphProps {
  color?: string;
  data?: number[]; // Mock data array (e.g., [100, 120, 90, ...])
}

export default function SalesTrendGraph({
  color = '#4A90E2',
  data = [280, 250, 220, 210, 225, 235, 220, 220, 225, 230, 235, 240], // Mock similar to the image
}: SalesTrendGraphProps) {
  const max = 300; // Fixed max scale as seen in image
  const min = 0;
  const height = 180; // Increased height for better aspect ratio
  const width = 360; // Adjusted for container width
  const paddingX = 40; // Left padding for Y-axis labels
  const paddingY = 20; // Bottom padding for X-axis labels
  const graphHeight = height - paddingY - 10;
  const graphWidth = width - paddingX - 10;

  // Function to calculate points
  const getPoint = (val: number, idx: number, length: number) => {
    const x = (idx / (length - 1)) * graphWidth + paddingX;
    const y = graphHeight - (val / max) * graphHeight + 10;
    return [x, y];
  };

  // Generate smooth bezier curve path (Catmull-Rom like simplification)
  const points = data.map((val, idx) => getPoint(val, idx, data.length));

  // Build the SVG Path command for a smooth curve
  const linePath = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point[0]},${point[1]}`;

    // Simple smoothing: use control points based on previous and next points
    // For a robust implementation, usually requires calculating control points.
    // Here we use a quadratic bezier for simplicity or a cubic one if we calculate CPs.
    // Let's use a simpler cubic bezier strategy:
    // P0=prev, P1=curr. CP1 is P0 + (P1-P_prev)*k, CP2 is P1 - (P_next - P0)*k
    // But standard cubic spline is better.
    // For this prototype, let's use a simple strategy:
    // C (prevX + currentX) / 2, prevY, (prevX + currentX) / 2, currentY, currentX, currentY
    // This creates a wave-like smoothness.

    const [pX, pY] = a[i - 1];
    const [cX, cY] = point;
    const midX = (pX + cX) / 2;

    return `${acc} C ${midX},${pY} ${midX},${cY} ${cX},${cY}`;
  }, '');

  // Close the path for the fill area
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint[0]},${graphHeight + 10} L ${firstPoint[0]},${graphHeight + 10} Z`;

  // Grid lines
  const ticks = [0, 50, 100, 150, 200, 250, 300];

  return (
    <div className="w-full mt-0">
      {/* Header with Title and Info */}
      <div className="flex justify-between items-center mb-2 px-1">
        <h4 className="text-[12px] font-semibold text-gray-900">
          최근 1년 동안 매출 변화 추정 그래프
        </h4>
        <div className="relative group">
          <Info size={14} className="text-gray-400 cursor-help" />
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 w-max px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-sm">
            과거매장 매출포함
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
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="80%" stopColor={color} stopOpacity="0.05" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Layout */}
          {ticks.map((tick) => {
            const y = graphHeight - (tick / max) * graphHeight + 10;
            return (
              <g key={tick}>
                {/* Y-Axis Label */}
                <text
                  x={paddingX - 8}
                  y={y + 4} // vertical align center correction
                  textAnchor="end"
                  fontSize="11"
                  fill="#9CA3AF"
                  fontWeight="normal"
                >
                  {tick}
                </text>
                {/* Horizontal Grid Line */}
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="0.8"
                />
              </g>
            );
          })}

          {/* Vertical Grid Lines (Optional, if needed to match perfectly, but image shows minimal vertical grids) */}
          {/* We'll skip vertical grids to match the clean look of the image, or add very light ones if demanded */}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#blueGradient)" />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* X-Axis Labels */}
        <div className="absolute bottom-1 right-0 left-[40px] flex justify-between px-2 text-[10px] text-gray-500 font-medium tracking-tight">
          <span>24/12</span>
          <span>25/02</span>
          <span>25/04</span>
          <span>25/06</span>
          <span>25/08</span>
          <span>25/10</span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

interface AgeGenderRadarChartProps {
  populationData: any;
}

export default function AgeGenderRadarChart({ populationData }: AgeGenderRadarChartProps) {
  if (!populationData) return null;

  const ages = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];
  const keys = ['a10', 'a20', 'a30', 'a40', 'a50', 'a60'];

  const maleRatio = populationData.total > 0 ? populationData.male / populationData.total : 0.5;
  const femaleRatio = populationData.total > 0 ? populationData.female / populationData.total : 0.5;

  let maxGroup = { label: '', val: -1 };

  const chartData = keys.map((key, index) => {
    const totalAgePop = populationData.age[key] || 0;
    
    // Check if real split data exists (Future proofing)
    const maleVal = populationData.age.male && populationData.age.male[key] !== undefined 
        ? populationData.age.male[key] 
        : Math.round(totalAgePop * maleRatio);
        
    const femaleVal = populationData.age.female && populationData.age.female[key] !== undefined 
        ? populationData.age.female[key] 
        : Math.round(totalAgePop * femaleRatio);

    // Track Max
    if (maleVal > maxGroup.val) maxGroup = { label: `${ages[index]}, 남성`, val: maleVal };
    if (femaleVal > maxGroup.val) maxGroup = { label: `${ages[index]}, 여성`, val: femaleVal };

    return {
      subject: ages[index],
      male: maleVal,
      female: femaleVal
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="52%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            
            <Radar
              name="남성"
              dataKey="male"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.2}
            />
            <Radar
              name="여성"
              dataKey="female"
              stroke="#ef4444"
              strokeWidth={2}
              fill="#ef4444"
              fillOpacity={0.2}
            />
            <Legend 
              verticalAlign="top" 
              wrapperStyle={{ top: -5 }}
              height={36} 
              iconType="rect"
              formatter={(value) => <span className="text-sm font-semibold text-gray-700 ml-1">{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Insight Comment */}
      <div className="mt-1 bg-blue-50 rounded-lg py-2 px-3 text-center">
        <span className="text-sm text-gray-800 tracking-tight">
          <span className="font-bold text-blue-600">{maxGroup.label}</span> 비율이 가장 높아요.
        </span>
      </div>
    </div>
  );
}

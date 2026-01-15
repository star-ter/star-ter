"use client";

import { BuildingInfo, AreaInfo, StoreInfo } from "./types/mapTypes";
import { Building2, MapPin, Store, Loader2 } from "lucide-react";

/**
 * MapInfoPanel 컴포넌트
 * 
 * - ChatMapSection 내 부가 정보 영역을 담당
 * - 건물 선택 시: 건물명, 주소, 점포 리스트
 * - 상권 선택 시: 상권명, 관련 정보
 * - 빈 상태: 안내 메시지
 */

// 헬퍼 함수
function formatRevenue(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  return value.toLocaleString();
}

function formatPopulation(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}만명`;
  }
  return `${value.toLocaleString()}명`;
}

interface MapInfoPanelProps {
  selectedBuilding?: BuildingInfo | null;
  selectedArea?: AreaInfo | null;
  isLoading?: boolean;
}

export function MapInfoPanel({ 
  selectedBuilding, 
  selectedArea, 
  isLoading = false 
}: MapInfoPanelProps) {
  
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="h-full bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 건물 선택 상태
  if (selectedBuilding) {
    return (
      <div className="h-full bg-slate-50 rounded-2xl border border-slate-100 p-4 overflow-y-auto">
        {/* 건물 헤더 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {selectedBuilding.name || "건물 정보"}
            </h3>
            {selectedBuilding.address && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {selectedBuilding.address}
              </p>
            )}
          </div>
        </div>

        {/* 점포 리스트 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">
            입점 점포 ({selectedBuilding.stores.length}개)
          </h4>
          
          {selectedBuilding.stores.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              등록된 점포 정보가 없습니다.
            </p>
          ) : (
            <div className="space-y-2 max-h-75 overflow-y-auto">
              {selectedBuilding.stores.map((store, idx) => (
                <StoreItem key={idx} store={store} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 상권 선택 상태
  if (selectedArea) {
    const hasData = !!(
      selectedArea.revenue ||
      selectedArea.floatingPopulation ||
      selectedArea.storeCount
    );

    return (
      <div className="h-full bg-slate-50 rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {selectedArea.name}
            </h3>
            <p className="text-sm text-slate-500">
              {selectedArea.type === 'commercial' ? '상권' : 
               selectedArea.type === 'dong' ? '행정동' : '자치구'}
            </p>
          </div>
        </div>

        {/* 상권 정보 */}
        {hasData ? (
          <div className="space-y-3">
            {/* 매출 & 유동인구 */}
            <div className="grid grid-cols-2 gap-3">
              {(selectedArea.revenue !== undefined && selectedArea.revenue > 0) && (
                <InfoCard 
                  label="분기 매출" 
                  value={formatRevenue(selectedArea.revenue)} 
                />
              )}
              {(selectedArea.floatingPopulation !== undefined && selectedArea.floatingPopulation > 0) && (
                <InfoCard 
                  label="유동인구" 
                  value={formatPopulation(selectedArea.floatingPopulation)} 
                />
              )}
            </div>
            
            {/* 점포수 */}
            {(selectedArea.storeCount !== undefined && selectedArea.storeCount > 0) && (
              <InfoCard 
                label="점포 수" 
                value={`${selectedArea.storeCount.toLocaleString()}개`} 
              />
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-6">
            <p className="text-sm">상세 분석은 AI에게 질문해보세요.</p>
          </div>
        )}
      </div>
    );
  }

  // 빈 상태 (기본)
  return (
    <div className="h-full bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="text-center text-slate-400">
        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-bold text-slate-600 mb-1">상권 상세 정보</h3>
        <p className="text-md">
          지도에서 건물을 선택하면<br/>
          상세 분석 데이터가 여기에 표시됩니다.
        </p>
      </div>
    </div>
  );
}

// 점포 아이템 컴포넌트
function StoreItem({ store }: { store: StoreInfo }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100">
      <div className="p-1.5 bg-slate-100 rounded">
        <Store className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {store.name || "상호명 없음"}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {store.category || "업종 미분류"}
          {store.subcategory && ` · ${store.subcategory}`}
        </p>
      </div>
    </div>
  );
}

// 정보 카드 컴포넌트
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-100 p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}

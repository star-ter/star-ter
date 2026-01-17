'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, Settings2 } from 'lucide-react';
import { formatToKoreaCurrency } from './utils';

/**
 * 【PriceFilterBar 컴포넌트】
 *
 * 부동산 가격 필터바 - TrafficFilterBar와 동일한 스타일
 * - 하단 바: 매물 수 요약 표시
 * - 필터 패널: 보증금/월세 듀얼 레인지 슬라이더
 */

interface PriceFilterBarProps {
  minDeposit: number;
  maxDeposit: number;
  minRent: number;
  maxRent: number;
  depositRange: [number, number];
  rentRange: [number, number];
  onDepositChange: (range: [number, number]) => void;
  onRentChange: (range: [number, number]) => void;
  totalCount: number;
  filteredCount: number;
}

export function PriceFilterBar({
  minDeposit,
  maxDeposit,
  minRent,
  maxRent,
  depositRange,
  rentRange,
  onDepositChange,
  onRentChange,
  totalCount,
  filteredCount,
}: PriceFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 슬라이더 값을 퍼센트로 변환
  const depositDiff = maxDeposit - minDeposit || 1;
  const rentDiff = maxRent - minRent || 1;
  const depositLeftPercent = ((depositRange[0] - minDeposit) / depositDiff) * 100;
  const depositRightPercent = ((depositRange[1] - minDeposit) / depositDiff) * 100;
  const rentLeftPercent = ((rentRange[0] - minRent) / rentDiff) * 100;
  const rentRightPercent = ((rentRange[1] - minRent) / rentDiff) * 100;

  // 외부 클릭 시 패널 닫기 (토글 버튼 제외)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-toggle-price-panel]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isExpanded]);

  return (
    <>
      <style>{`
        .dual-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        .dual-slider::-moz-range-thumb {
          pointer-events: auto;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          cursor: pointer;
        }
      `}</style>

      {/* 필터 패널 (보증금/월세 슬라이더) */}
      {isExpanded && (
        <div
          ref={panelRef}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-white rounded-2xl shadow-sm border border-border p-5 w-95"
        >
          {/* 보증금 슬라이더 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-caption font-medium text-muted-foreground">
                보증금
              </span>
              <span className="text-caption font-bold text-primary">
                {formatToKoreaCurrency(depositRange[0])} ~{' '}
                {formatToKoreaCurrency(depositRange[1])}
              </span>
            </div>
            <div className="relative h-6 flex items-center">
              {/* 트랙 배경 */}
              <div className="absolute left-0 right-0 h-1.5 bg-muted rounded-full" />
              {/* 활성 트랙 */}
              <div
                className="absolute h-1.5 bg-primary rounded-full"
                style={{
                  left: `${depositLeftPercent}%`,
                  width: `${depositRightPercent - depositLeftPercent}%`,
                }}
              />
              {/* 왼쪽 슬라이더 (최소값) */}
              <input
                type="range"
                min={minDeposit}
                max={maxDeposit}
                value={depositRange[0]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val < depositRange[1]) {
                    onDepositChange([val, depositRange[1]]);
                  }
                }}
                className="dual-slider absolute w-full h-full appearance-none bg-transparent pointer-events-none text-primary"
                style={{
                  zIndex:
                    depositRange[0] > (maxDeposit - minDeposit) / 2 + minDeposit
                      ? 5
                      : 3,
                }}
              />
              {/* 오른쪽 슬라이더 (최대값) */}
              <input
                type="range"
                min={minDeposit}
                max={maxDeposit}
                value={depositRange[1]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > depositRange[0]) {
                    onDepositChange([depositRange[0], val]);
                  }
                }}
                className="dual-slider absolute w-full h-full appearance-none bg-transparent pointer-events-none text-primary"
                style={{
                  zIndex:
                    depositRange[1] < (maxDeposit - minDeposit) / 2 + minDeposit
                      ? 5
                      : 4,
                }}
              />
            </div>
          </div>

          {/* 월세 슬라이더 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-caption font-medium text-muted-foreground">
                월세
              </span>
              <span className="text-caption font-bold text-info">
                {formatToKoreaCurrency(rentRange[0])} ~{' '}
                {formatToKoreaCurrency(rentRange[1])}
              </span>
            </div>
            <div className="relative h-6 flex items-center">
              {/* 트랙 배경 */}
              <div className="absolute left-0 right-0 h-1.5 bg-muted rounded-full" />
              {/* 활성 트랙 */}
              <div
                className="absolute h-1.5 bg-info rounded-full"
                style={{
                  left: `${rentLeftPercent}%`,
                  width: `${rentRightPercent - rentLeftPercent}%`,
                }}
              />
              {/* 왼쪽 슬라이더 (최소값) */}
              <input
                type="range"
                min={minRent}
                max={maxRent}
                value={rentRange[0]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val < rentRange[1]) {
                    onRentChange([val, rentRange[1]]);
                  }
                }}
                className="dual-slider absolute w-full h-full appearance-none bg-transparent pointer-events-none text-info"
                style={{
                  zIndex:
                    rentRange[0] > (maxRent - minRent) / 2 + minRent ? 5 : 3,
                }}
              />
              {/* 오른쪽 슬라이더 (최대값) */}
              <input
                type="range"
                min={minRent}
                max={maxRent}
                value={rentRange[1]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > rentRange[0]) {
                    onRentChange([rentRange[0], val]);
                  }
                }}
                className="dual-slider absolute w-full h-full appearance-none bg-transparent pointer-events-none text-info"
                style={{
                  zIndex:
                    rentRange[1] < (maxRent - minRent) / 2 + minRent ? 5 : 4,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 하단 바 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2.5 shadow-sm border border-border w-95 justify-between">
          {/* 아이콘 */}
          <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>

          {/* 매물 정보 */}
          <div className="flex items-center gap-2">
            <span className="text-caption font-bold text-primary">
              {filteredCount.toLocaleString()}개
            </span>
            <span className="text-caption font-medium text-muted-foreground">
              / {totalCount.toLocaleString()}개 매물
            </span>
          </div>

          <div className="w-px h-6 bg-border ml-2" />

          {/* 필터 버튼 */}
          <button
            data-toggle-price-panel
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
              isExpanded ? 'bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <span className="text-caption font-medium text-primary whitespace-nowrap">
              가격 필터
            </span>
            <Settings2
              className={`w-4 h-4 transition-colors ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </button>
        </div>
      </div>
    </>
  );
}

'use client';
import { useState } from 'react';

import ModalCard from './modal/ModalCard';
import PillButton from './PillButton';
// import AreaContents from './modal/AreaContents';
import PopulationContents from './modal/PopulationContents';
import IndustryContents from './modal/IndustryContents';
import CompareContents from './modal/CompareContents';
import CalculateRentContents from './modal/CalculateRentModal/CalculateRentContents';
import ReportInputView from './modal/ReportInputView';
import {
  IndustryCategory,
  CompareRequest,
  ReportRequest,
} from '../../types/bottom-menu-types';
import { IndustryData } from '../../mocks/industry';
import { useSidebarStore } from '../../stores/useSidebarStore';
import { useMapStore } from '../../stores/useMapStore';
import { useModalStore } from '../../stores/useModalStore';

type ActiveType =
  'population' | 'industry' | 'compare' | 'report' | 'calculateRent';

import { usePopulationVisual } from '../../hooks/usePopulationVisual';
interface BottomMenuProps {
  locationA: { name: string; code?: string };
  locationB: { name: string; code?: string };
  setLocationA: (area: { name: string; code?: string }) => void;
  setLocationB: (area: { name: string; code?: string }) => void;
  handlePickMode: (target: 'A' | 'B') => void;
  population: ReturnType<typeof usePopulationVisual>;
  onCompare?: (data?: CompareRequest) => void;
  onSelectCategory: (category: IndustryCategory | null) => void;
  onCreateReport?: (data: ReportRequest) => void;
  isReportOpen?: boolean;
  onToggleReport?: (isOpen: boolean) => void;
}

export default function BottomMenuBox({
  locationA = { name: '' },
  locationB = { name: '' },
  setLocationA,
  setLocationB,
  handlePickMode,
  population,
  onCompare,
  onSelectCategory,
  onCreateReport,
  isReportOpen,
  onToggleReport,
}: BottomMenuProps) {
  const [active, setActive] = useState<ActiveType | 'none'>('none');
  const { setInfoBarOpen, setIsOpen, setSelectedArea } = useSidebarStore();
  const { setSelectedIndustryCodes } = useMapStore();

  function modalClose() {
    if (active === 'report' && onToggleReport) {
      onToggleReport(false);
    }
    setActive('none');
  }

  function handleIndustry(id: string) {
    const selected = IndustryData.find((item) => item.code === id);
    if (selected) {
      setSelectedArea(null);
      setInfoBarOpen(true);
      onSelectCategory(selected);
      const childCodes = selected.children?.map((child) => child.code) || [];
      setSelectedIndustryCodes(childCodes.length > 0 ? childCodes : null);
    }
    modalClose();
  }

  function handleCompare(data: CompareRequest) {
    if (onCompare) {
      onCompare(data);
    }
    modalClose();
  }

  function handlePopulation() {}

  function handlePickLocation(target: 'A' | 'B') {
    if (handlePickMode) {
      handlePickMode(target);
    }
  }

  const items: { label: string; value: ActiveType | 'none' }[] = [
    { label: '유동인구', value: 'population' },
    { label: '업종', value: 'industry' },
    { label: '비교', value: 'compare' },
    { label: '보고서', value: 'report' },
    { label: '임대료 계산', value: 'calculateRent' },
    { label: '초기화', value: 'none' },
  ];

  const renderContent = () => {
    switch (active) {
      case 'population':
        return (
          <PopulationContents
            onClose={modalClose}
            onView={handlePopulation}
            population={population}
          />
        );
      case 'industry':
        return (
          <IndustryContents
            onClose={modalClose}
            categories={IndustryData}
            onSelect={handleIndustry}
            isLoading={false}
          />
        );
      case 'compare':
        return (
          <CompareContents
            onClose={modalClose}
            onCompare={handleCompare}
            targetA={locationA.name}
            targetB={locationB.name}
            propCodeA={locationA.code}
            propCodeB={locationB.code}
            changeTargetA={(val) => setLocationA({ name: val })}
            changeTargetB={(val) => setLocationB({ name: val })}
            onPickLocation={handlePickLocation}
          />
        );
      case 'report':
        return (
          <ReportInputView
            onCreateReport={(data) => {
              if (onCreateReport) onCreateReport(data);
              // Close local modal and de-highlight the button
              setActive('none');
              // Trigger overlay open
              if (onToggleReport) onToggleReport(true);
            }}
            initialRegion={undefined}
          />
        );
      case 'calculateRent':
        return <CalculateRentContents onClose={modalClose} />;
      default:
        return null;
    }
  };

  const content = renderContent();

  return (
    <section className="w-full flex flex-col items-center mb-8">
      {content && <ModalCard>{content}</ModalCard>}
      <div className="flex items-center justify-center gap-4 rounded-2xl bg-white/80 px-4 py-3 shadow-md ring-1 ring-black/5">
        {items.map(({ label, value }) => (
          <PillButton
            key={value}
            label={label}
            onClick={() => {
              if (value === 'none') {
                setActive('none');
                setLocationA({ name: '' });
                setLocationB({ name: '' });
                onSelectCategory(null);
                setSelectedIndustryCodes(null);
                population.setShowLayer(false);
                if (onToggleReport) onToggleReport(false);
                return;
              }

              if (active === value) {
                if (value === 'report' && isReportOpen && onToggleReport) {
                  onToggleReport(false);
                }
                modalClose();
                return;
              }

              // 보고서 클릭 처리
              if (value === 'report') {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                  useModalStore.getState().openModal({
                    type: 'confirm',
                    title: '로그인 필요',
                    content: (
                      <div className="text-center py-4">
                        <p className="mb-2 text-gray-700">
                          보고서 기능은 로그인이 필요한 서비스입니다.
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          로그인 페이지로 이동하시겠습니까?
                        </p>
                      </div>
                    ),
                    confirmText: '로그인하기',
                    onConfirm: () => {
                      window.location.href = '/login';
                    },
                  });
                  return;
                }
                // If we have result, just show it (toggle on)?
                // Or always start new input?
                // User expects "New Report" usually.
                // If isReportOpen is true, maybe just focus it.
                // If false, open Input.
                setActive('report');
                setLocationA({ name: '' });
                setLocationB({ name: '' });
                return;
              }

              setActive(value as ActiveType);
              if (onToggleReport) onToggleReport(false);

              setLocationA({ name: '' });
              setLocationB({ name: '' });

              if (value === 'compare') {
                setInfoBarOpen(false);
                setIsOpen(false);
              }

              if (value === 'calculateRent') {
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}

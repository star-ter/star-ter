import { useState, useEffect } from 'react';
import ReportResultView from './ReportResultView';
import { Loader2 } from 'lucide-react';
import { ReportRequest } from '../../types/bottom-menu-types';

interface ReportOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  userSelection?: ReportRequest | null;
}

export default function ReportOverlay({ isVisible, onClose, userSelection }: ReportOverlayProps) {
  const [view, setView] = useState<'loading' | 'result'>('loading');
  
  useEffect(() => {
    if (userSelection) {
      const startLoad = setTimeout(() => setView('loading'), 0);
      
      const timer = setTimeout(() => {
        setView('result');
      }, 2000);
      
      return () => {
        clearTimeout(startLoad);
        clearTimeout(timer);
      };
    }
  }, [userSelection]);

  if (!isVisible) return null;

  return (
    <>
      <div 
         className={`fixed bottom-[120px] left-1/2 -translate-x-1/2 z-[100] shadow-xl rounded-xl overflow-hidden animate-slide-up transition-all duration-300 ease-in-out w-[50vw] max-w-[900px] h-[calc(100vh-10rem)]`}
      >
         {view === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full bg-white/90 backdrop-blur-sm">
                <div className="p-4 rounded-full bg-blue-50 mb-4 animate-pulse">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">보고서를 생성하고 있어요</h3>
                <p className="text-sm text-gray-500">잠시만 기다려주세요...</p>
            </div>
         )}

         {view === 'result' && userSelection && (
            <ReportResultView 
               onClose={onClose}
               regionName={userSelection.regionName}
               industryName={userSelection.industryName}
            />
         )}
      </div>
    </>
  );
}

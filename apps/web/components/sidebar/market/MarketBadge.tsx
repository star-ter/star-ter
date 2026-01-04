import React from 'react';
import { Star } from 'lucide-react';
import { useBookmark } from '@/hooks/useBookmark';

interface Props {
  isCommercialZone: boolean;
  areaName: string;
  commercialCode?: string;
  commercialName?: string;
}

export default function MarketBadge({
  isCommercialZone,
  areaName,
  commercialCode,
  commercialName,
}: Props) {
  const { bookmarks, addBookmark, removeBookmark } = useBookmark();
  const isBookmarked =
    !!commercialCode &&
    bookmarks.some((b) => b.commercialCode === commercialCode);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!commercialCode || !commercialName) return;

    if (isBookmarked) {
      await removeBookmark(commercialCode);
    } else {
      await addBookmark(commercialCode, commercialName);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border shadow-sm flex items-center justify-between ${
        isCommercialZone
          ? 'bg-orange-50 border-orange-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{isCommercialZone ? '✨' : '🏠'}</span>
        <div>
          <div className="text-xs text-gray-500 mb-0.5">해당 상권 지역</div>
          <div className="flex items-center gap-2">
            <div
              className={`text-lg font-bold ${isCommercialZone ? 'text-orange-700' : 'text-gray-900'}`}
            >
              {areaName}
            </div>
          </div>
        </div>
      </div>
      {commercialCode && (
        <button
          onClick={handleBookmarkClick}
          className="hover:scale-110 transition-transform"
        >
          <Star
            size={25}
            className={`${isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      )}

      {/* {!isCommercialZone && (
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          데이터 부족
        </span>
      )} */}
    </div>
  );
}

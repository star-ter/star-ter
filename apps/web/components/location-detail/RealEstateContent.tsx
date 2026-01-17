import Image from 'next/image';
import type { RealEstateItem } from './types';
import { formatToKoreaCurrency, formatArea, formatFloor } from './utils';

/**
 * 【RealEstateContentProps 인터페이스】
 * 컨포넌트가 받는 props 타입 정의
 */
interface RealEstateContentProps {
  items: RealEstateItem[];
  onItemClick?: (item: RealEstateItem) => void; // 매물 클릭 시 호출될 콜백 함수
}

export function RealEstateContent({
  items,
  onItemClick,
}: RealEstateContentProps) {
  // 【조건부 렌더링 개념】
  // 데이터가 비어있을 때 사용자에게 알려주는 UI 표시
  if (!items || items.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            부동산 정보
          </h2>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">해당 상권 주변에 등록된 매물이 없습니다.</p>
            <p className="text-sm mt-2">더 넓은 지역을 검색해보세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // 【통계 계산】
  // reduce()를 사용해 배열의 평균값 계산
  const avgDeposit =
    items.reduce((sum, item) => sum + (item.deposit ?? 0), 0) / items.length;
  const avgRent =
    items.reduce((sum, item) => sum + (item.monthlyrent ?? 0), 0) /
    items.length;
  const avgPremium =
    items.reduce((sum, item) => sum + (item.premium ?? 0), 0) / items.length;
  const avgSize =
    items.reduce((sum, item) => sum + (item.size ?? 0), 0) / items.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4">
        <h2 className="text-h2 font-bold text-foreground">주변 부동산 정보</h2>
        {/* 평균 통계 카드 */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 bg-muted/50 rounded-xl">
            <p className="text-caption text-muted-foreground mb-2">
              평균 보증금
            </p>
            <p className="text-h3 font-bold text-foreground">
              {formatToKoreaCurrency(avgDeposit)}원
            </p>
          </div>
          <div className="p-6 bg-muted/50 rounded-xl">
            <p className="text-caption text-muted-foreground mb-2">평균 월세</p>
            <p className="text-h3 font-bold text-foreground">
              {formatToKoreaCurrency(avgRent)}원
            </p>
          </div>
          <div className="p-6 bg-muted/50 rounded-xl">
            <p className="text-caption text-muted-foreground mb-2">
              평균 권리금
            </p>
            <p className="text-h3 font-bold text-foreground">
              {formatToKoreaCurrency(avgPremium)}원
            </p>
          </div>
          <div className="p-6 bg-muted/50 rounded-xl">
            <p className="text-caption text-muted-foreground mb-2">평균 면적</p>
            <p className="text-h3 font-bold text-foreground">
              {formatArea(avgSize)}
            </p>
          </div>
        </div>
      </div>

      {/* 매물 목록 */}
      <div className="grid gap-4">
        <h2 className="text-h2 font-bold text-foreground">
          인근 매물 정보 ({items.length}개)
        </h2>
        {/* 
                【map() 함수 개념】
                배열의 각 요소(item)를 JSX 요소로 변환
                - key: React가 리스트 항목을 효율적으로 관리하기 위해 필요한 고유 식별자
                - 각 item 객체의 속성을 사용해 UI 렌더링
              */}
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer"
          >
            {/* 이미지 + 정보를 가로로 배치 */}
            <div className="flex items-start gap-4">
              {/* 미리보기 이미지 */}
              <div className="w-32 h-32 rounded-lg overflow-hidden shrink-0 bg-gray-100 ">
                {item.previewphotourl ? (
                  <Image
                    src={item.previewphotourl}
                    alt="매물 사진"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* 매물 정보 영역 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-h3 font-bold text-foreground">
                    {formatToKoreaCurrency(item.deposit)} /
                    {' ' + formatToKoreaCurrency(item.monthlyrent)}
                  </span>
                  <span
                    className={`text-caption px-2 py-1 rounded ${
                      item.ismoveindate
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.ismoveindate ? '즉시입주' : '협의필요'}
                  </span>
                </div>

                <div className="text-caption text-foreground space-y-1">
                  <p className="truncate">
                    {item.title || item.name || item.roadaddress || '매물 정보'}
                  </p>

                  <p>
                    {formatArea(item.size)} ·
                    {' ' + formatFloor(item.floor, item.groundfloor)}
                    {item.premium && item.premium > 0 && (
                      <span>
                        {' '}
                        · 권리금 {formatToKoreaCurrency(item.premium)}
                      </span>
                    )}
                    {item.maintenancefee && item.maintenancefee > 0 && (
                      <span className="text-foreground">
                        · 관리비 {formatToKoreaCurrency(item.maintenancefee)}
                      </span>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.nearsubwaystation && (
                      <span className="text-caption font-strong px-2 py-1 bg-info/10 text-info rounded">
                        {item.nearsubwaystation}
                      </span>
                    )}
                    {item.businessmiddlecodename && (
                      <span className="text-caption font-strong px-2 py-1 bg-accent/10 text-accent rounded">
                        {item.businessmiddlecodename}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

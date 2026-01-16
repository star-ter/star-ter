// 상권 상세 페이지 (Server Component)
// Next.js App Router 정석: URL에서 code를 받아 서버에서 데이터 페칭

import { getLocationDetailData } from '@/services/location/locationDetailPage.service';
import { LocationDetailPage } from '@/components/LocationDetailPage';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function Page({ params }: PageProps) {
  const { code } = await params;
  
  // 서버에서 데이터 가져오기 (병렬 처리됨)
  const data = await getLocationDetailData(code);

  // 에러 처리: 상권을 찾을 수 없는 경우
  if (data.error || !data.basicInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-h2 font-bold text-gray-800 mb-4">
            상권을 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            요청하신 상권 코드({code})에 해당하는 정보가 없습니다.
          </p>
          <Link
            href="/locations"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            상권 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <LocationDetailPage
      basicInfo={data.basicInfo}
      analytics={data.analytics}
      realEstate={data.realEstate}
      footTraffic={data.footTraffic}
    />
  );
}

// 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  const data = await getLocationDetailData(code);
  
  return {
    title: data.basicInfo 
      ? `${data.basicInfo.name} - 상권 분석` 
      : '상권 분석',
    description: data.basicInfo 
      ? `${data.basicInfo.name} 상권의 매출, 유동인구, 부동산 정보를 확인하세요.`
      : '상권 상세 정보',
  };
}

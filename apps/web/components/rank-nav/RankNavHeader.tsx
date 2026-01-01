type RankNavHeaderProps = {
  level: 'gu' | 'dong';
  parentGuName?: string;
};

export default function RankNavHeader({
  level,
  parentGuName,
}: RankNavHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {level === 'dong' && parentGuName
            ? `${parentGuName} 매출 순위`
            : level === 'dong'
              ? '동 매출 순위'
              : '서울시 매출 순위'}
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          {level === 'dong' && parentGuName
            ? `${parentGuName} 기준`
            : level === 'dong'
              ? '현재 구 기준'
              : '서울시 기준'}{' '}
          분기 매출
        </p>
      </div>
    </header>
  );
}

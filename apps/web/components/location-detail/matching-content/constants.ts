// 사용자 설정 라벨 맵
export const USER_LABELS: Record<string, Record<string, string>> = {
  age: {
    '10s': '10대',
    '20s': '20대',
    '30s': '30대',
    '40s': '40대',
    '50s': '50대',
    '60s': '60대 이상',
  },
  region: {
    office: '오피스',
    residential: '주거지역',
    commercial: '핫플레이스',
    university: '대학가',
    station: '역세권',
    tourist: '관광지',
  },
  operatingTime: {
    morning: '오전',
    afternoon: '오후',
    evening: '저녁',
    night: '야간',
    allday: '종일',
  },
  capital: {
    '10M': '1천만원',
    '30M': '3천만원',
    '50M': '5천만원',
    '100M': '1억원',
    '200M': '2억원',
    '200M+': '2억원 이상',
  },
};

export const CAPITAL_VALUES: Record<string, number> = {
  '10M': 10000000,
  '30M': 30000000,
  '50M': 50000000,
  '100M': 100000000,
  '200M': 200000000,
  '200M+': 300000000,
};

// 점수에 따른 색상
export const getScoreColor = (score: number) => {
  // 1등급 (80점 이상): 성공/안전 (초록)
  if (score >= 0.8) return { text: 'text-success', bg: 'bg-success/10' };
  // 2등급 (60점 이상): 양호/정보 (파랑)
  if (score >= 0.6)
    return { text: 'text-gender-male', bg: 'bg-gender-male/10' };
  // 3등급 (40점 이상): 보통/주의 (보라 - 주황 대신 사용)
  if (score >= 0.4) return { text: 'text-accent', bg: 'bg-accent/10' };
  // 4등급 (40점 미만): 위험/저조 (빨강)
  return { text: 'text-danger', bg: 'bg-danger/10' };
};

// 금액 포맷
export const formatMoney = (amount: number) => {
  if (amount === 0) return '0원';
  if (amount < 10000) return `${amount.toLocaleString()}원`;
  if (amount >= 100000000) {
    const uk = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return `${uk}억${man > 0 ? ` ${man.toLocaleString()}만` : ''}원`;
  }
  return `${Math.floor(amount / 10000).toLocaleString()}만원`;
};

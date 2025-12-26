/**
 * 사용자 메시지에서 위치 정보를 추출하는 유틸리티
 */

/**
 * 텍스트에서 여러 위치명을 추출 (배열 반환)
 * @param text - 사용자 입력 텍스트
 * @returns 추출된 위치명 배열
 */
export function extractLocations(text: string): string[] {
  const locations: string[] = [];
  
  // 1. 위치 관련 키워드/액션 제거
  let cleanedText = text
    .replace(/(으로|로)\s*(가|이동|보내|옮겨|가고|이동하고).*$/g, '')
    .replace(/\s*(보여줘|찾아줘|검색해줘|알려줘).*$/g, '')
    .replace(/\s*(분석|비교|상권).*$/g, '')
    .trim();
  
  // 2. 연결어로 분리: "이랑", "그리고", "랑", ",", "와", "과"
  const connectorPattern = /\s*(이랑|그리고|랑|,|와\s|과\s|하고)\s*/;
  let parts = cleanedText.split(connectorPattern).filter(part => {
    return part && !['이랑', '그리고', '랑', ',', '와', '과', '하고'].includes(part.trim());
  });
  
  // 3. 연결어로 분리된 게 1개뿐이면 공백 + 지역명 패턴으로 분리 시도
  if (parts.length <= 1 && cleanedText.includes(' ')) {
    // 지역명 패턴: 역, 길, 동, 구, 시장, 거리 등으로 끝나는 단어
    const locationPattern = /(\S+(?:역|길|동|구|시장|거리|로|타워|센터|광장|공원))/g;
    const matches = cleanedText.match(locationPattern);
    
    if (matches && matches.length > 1) {
      parts = matches;
    }
  }
  
  // 4. 각 파트 정제 및 유효성 검사
  for (const part of parts) {
    const cleaned = cleanLocationName(part);
    if (cleaned && cleaned.length >= 2 && !isCommonWord(cleaned)) {
      locations.push(cleaned);
    }
  }
  
  // 중복 제거
  return [...new Set(locations)];
}

/**
 * 텍스트에서 단일 위치명을 추출 (기존 호환성 유지)
 * @param text - 사용자 입력 텍스트
 * @returns 추출된 위치명 또는 null
 */
export function extractLocation(text: string): string | null {
  const locations = extractLocations(text);
  return locations.length > 0 ? locations[0] : null;
}

/**
 * 위치명 정제 (불필요한 접미사 제거)
 */
function cleanLocationName(location: string): string {
  return location
    .trim()
    .replace(/\s+(지도|위치|좌표|장소|근처|주변|상권)$/, '')
    .replace(/^(거기|여기|저기)\s+/, '');
}

/**
 * 주소 형식인지 판단
 */
function isAddressFormat(text: string): boolean {
  const addressPatterns = [
    /\S+(시|도)\s+\S+(구|군)\s+\S+(동|읍|면)/,
    /\S+(구|군)\s+\S+(동|읍|면)/,
    /\S+(로|길)\s+\d+/,
    /서울|부산|대구|인천|광주|대전|울산|세종/,
  ];

  return addressPatterns.some((pattern) => pattern.test(text));
}

/**
 * 일반적인 단어인지 판단 (위치가 아닌 것)
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    '안녕', '너', '나', '오늘', '어제', '내일',
    '뭐', '왜', '어떻게', '언제', '누구', '무엇',
    '좀', '해줘', '해', '줘', '알려', '보여',
  ];

  return commonWords.includes(word);
}

/**
 * 위치 검색 의도가 있는지 판단
 */
export function hasLocationIntent(text: string): boolean {
  const locationKeywords = [
    '가', '이동', '보여', '찾', '검색', '알려',
    '어디', '지도', '위치', '분석', '비교', '상권',
  ];

  return locationKeywords.some((keyword) => text.includes(keyword));
}


export class JsonUtils {
  /**
   * 텍스트에서 첫 번째로 발견되는 유효한 JSON 객체를 추출하여 파싱합니다.
   * AI가 마크다운(```json ... ```)이나 잡담을 섞어서 줄 때 유용합니다.
   */
  static extractFirstJson<T = any>(text: string): T | null {
    if (!text) return null;

    // 1. 가장 단순한 시도: 전체가 순수 JSON인 경우
    try {
      return JSON.parse(text);
    } catch {
      // 실패하면 다음 단계로 진행
    }

    // 2. 마크다운 코드 블록 제거 시도 (```json ... ```)
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      try {
        return JSON.parse(markdownMatch[1]);
      } catch {
        // 코드 블록 내부도 순수 JSON이 아니면 다음 단계로
      }
    }

    // 3. 중괄호 카운팅으로 첫 번째 JSON 객체 추출 시도 (가장 강력한 방법)
    try {
      const firstOpen = text.indexOf('{');
      if (firstOpen === -1) return null;

      let balance = 0;
      let inString = false;
      let escape = false;
      let end = -1;

      for (let i = firstOpen; i < text.length; i++) {
        const char = text[i];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\') {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') {
            balance++;
          } else if (char === '}') {
            balance--;
            if (balance === 0) {
              end = i;
              break;
            }
          }
        }
      }

      if (end !== -1) {
        const jsonStr = text.substring(firstOpen, end + 1);
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('[JsonUtils] Failed to extract JSON:', e);
    }

    return null;
  }
}

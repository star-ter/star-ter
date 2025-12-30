/**
 * 건물 마커의 생성을 위한 HTML 문자열
 * @param count 점포 수
 * @param color 카테고리 색상
 * @param categoryName 카테고리 이름
 */
export const createMarkerContent = (
  count: number,
  color: string,
  categoryName: string,
) => {
  return `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 2px solid ${color};
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      white-space: nowrap;
    ">
      <span style="
        font-size: 13px;
        font-weight: 700;
        color: ${color};
        margin-right: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      ">${categoryName}</span>
      <span style="
        font-size: 13px;
        font-weight: 800;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      ">${count}</span>
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0; 
        height: 0; 
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${color};
      "></div>
    </div>
  `;
};

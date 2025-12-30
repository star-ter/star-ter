'use client';
import { useState } from 'react';
import { ChatKit, ChatKitOptions, useChatKit } from '@openai/chatkit-react';
import { PanelRight } from 'lucide-react';
import { useMapStore } from '../../stores/useMapStore';

const options: ChatKitOptions = {
  api: {
    async getClientSecret(existing) {
      if (existing) {
        // implement session refresh
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/ai/chatkit/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const { client_secret } = await res.json();
      return client_secret;
    },
  },
  onClientTool: async (toolCall) => {
    console.log('🔥 [ChatKit] Tool Called:', toolCall.name, toolCall.params);

    // 툴 이름이 지도 이동 관련이면 처리 (move_map or show_map_location)
    const isMoveMap = ['move_map', 'show_map_location'].includes(
      toolCall.name.toLowerCase(),
    );

    if (isMoveMap) {
      const store = useMapStore.getState();
      const params = toolCall.params as any;

      // AI가 lat/lng을 직접 줬다면 그걸 우선 쓸 수도 있겠지만,
      // "DB 기반 정확한 이동"을 위해 검색어가 있으면 백엔드에 물어보는 로직을 우선 수행
      const query =
        params.query || params.place_query || params.location || params.place;

      if (query) {
        try {
          // 백엔드에 좌표 질의
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/ai/resolve-navigation`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                place_query: query,
                current_zoom: store.zoom ?? 3, // 줌 레벨이 없으면 기본값 3
              }),
            },
          );

          if (res.ok) {
            const data = await res.json();
            if (
              data &&
              typeof data.lat === 'number' &&
              typeof data.lng === 'number'
            ) {
              console.log('📍 Resolved Coordinates from DB:', data);
              store.moveToLocation(
                { lat: data.lat, lng: data.lng },
                query,
                data.zoom || 3,
              );
              return { result: 'moved to ' + query };
            }
          }
        } catch (error) {
          console.error('Failed to resolve navigation:', error);
        }
      }

      // 백엔드 조회 실패 시, 혹은 검색어 없이 lat/lng만 왔을 경우의 Fallback
      const { lat, lng, zoom } = params;
      if (typeof lat === 'number' && typeof lng === 'number') {
        console.log('📍 Moving Map to fallback coords:', lat, lng);
        store.setCenter({ lat, lng });
      }
      if (typeof zoom === 'number') {
        store.setZoom(zoom);
      }

      return { result: 'moved' };
    }

    return {};
  },
  theme: {
    colorScheme: 'light',
    radius: 'pill',
    density: 'normal',
    typography: {
      baseSize: 16,
      fontFamily:
        '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      fontFamilyMono:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
      fontSources: [
        {
          family: 'OpenAI Sans',
          src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2',
          weight: 400,
          style: 'normal',
          display: 'swap',
        },
        // ...and 7 more font sources
      ],
    },
  },
  composer: {
    attachments: {
      enabled: false,
    },
  },
  startScreen: {
    greeting: '상권분석',
    prompts: [],
  },
  history: { enabled: false },
};

export function MyChat() {
  const { control } = useChatKit(options);
  const PANEL_WIDTH = 450;
  const [isOpen, setIsOpen] = useState(false);
  const panelOffset = isOpen ? 0 : PANEL_WIDTH;
  const buttonOffset = isOpen ? -PANEL_WIDTH : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed top-6 right-6 z-60 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1) hover:bg-slate-800 hover:cursor-pointer"
        style={{ transform: `translateX(${buttonOffset}px)` }}
        aria-expanded={isOpen}
        aria-controls="chatkit-panel"
      >
        <PanelRight className="h-7 w-7" />
      </button>
      <ChatKit
        control={control}
        id="chatkit-panel"
        className="fixed top-0 right-0 bottom-0 z-50 w-112.5 border-l border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl transition-transform duration-500 cubic-bezier(0.25, 1, 0.5, 1)"
        style={{ transform: `translateX(${panelOffset}px)` }}
      />
    </>
  );
}

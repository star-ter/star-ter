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
    if (toolCall.name === 'move_map') {
      console.log('🔥 [ChatKit] Executing move_map:', toolCall.params);

      const store = useMapStore.getState();
      const params = toolCall.params as any;
      const { lat, lng, zoom } = params;

      const targetName = '목적지';
      const targetZoom = typeof zoom === 'number' ? zoom : 3;

      if (typeof lat === 'number' && typeof lng === 'number') {
        store.moveToLocation({ lat, lng }, targetName, targetZoom);
        return { result: `Moved map to ${lat}, ${lng} (Zoom: ${targetZoom})` };
      } else {
        console.warn('⚠️ move_map called without valid coordinates');
        return { error: 'Invalid coordinates' };
      }
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

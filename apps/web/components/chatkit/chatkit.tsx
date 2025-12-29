'use client';
import { useState } from 'react';
import { ChatKit, ChatKitOptions, useChatKit } from '@openai/chatkit-react';

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
    if (toolCall.name === 'move') {
      alert(toolCall.params.message);
      return {};
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
  console.log('API BASE URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
  const { control } = useChatKit(options);
  const PANEL_WIDTH = 450;
  const [isOpen, setIsOpen] = useState(true);
  const panelOffset = isOpen ? 0 : PANEL_WIDTH;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed top-5 right-5 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white transition-all hover:bg-gray-700 active:scale-90"
        aria-expanded={isOpen}
        aria-controls="chatkit-panel"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M15 3v18" />
          {isOpen && (
            <path
              d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4V3z"
              fill="currentColor"
              stroke="none"
            />
          )}
        </svg>
      </button>
      <ChatKit
        control={control}
        id="chatkit-panel"
  
        className="fixed top0 right-0 bottom-0 w-[450px] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${panelOffset}px)` }}
      />
    </>
  );
}

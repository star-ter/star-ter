import { ArrowRight } from 'lucide-react';

const SCENE = { text: '성수동', image: '/images/seongsu2.png' };

export default function TestPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans">
      {/* Background Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-100"
        style={{ backgroundImage: `url(${SCENE.image})` }}
        aria-hidden="true"
      >
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex h-screen w-full flex-col items-center justify-center text-white/95">
        {/* Text Display */}
        <h1 className="text-[6rem] font-medium leading-none tracking-tight drop-shadow-lg filter">
          {SCENE.text}
        </h1>
        <button className="mt-6 flex items-center gap-2 text-xl font-light opacity-90 transition-opacity hover:opacity-100 hover:scale-105 hover:font-medium">
          알아보러 가기 <ArrowRight className="h-6 w-6 stroke-[1.5]" />  
        </button>
      </div>
    </div>
  );
}

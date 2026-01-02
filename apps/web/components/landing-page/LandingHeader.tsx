import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <h1 className="text-2xl font-black text-blue-600 tracking-tighter cursor-pointer">
        STAR-TER
      </h1>
    </header>
  );
}

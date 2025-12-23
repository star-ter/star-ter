export default function SearchBox() {
  return (
    <header className="flex flex-start w-[100vw] px-4 py-4">
      <div className="flex w-[320px] items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-lg ring-1 ring-gray-200">
        <figure className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-gray-800">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </figure>
        <input
          type="text"
          placeholder="지역, 주소 또는 상권을 검색하세요.."
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
    </header>
  );
}

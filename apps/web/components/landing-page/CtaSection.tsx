import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="py-24 text-center bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          지금 바로 상권분석을 시작하세요
        </h2>
        <Link href={'/map'}>
          <button className="cursor-pointer px-12 py-5 bg-gray-900 text-white text-xl font-bold rounded-full hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl">
            상권 분석하러 가기 →
          </button>
        </Link>
      </div>
    </section>
  );
}

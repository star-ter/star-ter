import { ReactNode } from 'react';

type ModalCardContents = { children: ReactNode };

export default function ModalCard({ children }: ModalCardContents) {
  return (
    <section className="mb-[24px] flex flex-col justify-center gap-4 rounded-2xl bg-white/80 px-4 py-4 shadow-md ring-1 ring-black/5">
      {children}
    </section>
  );
}

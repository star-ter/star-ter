'use client';

import dynamic from 'next/dynamic';

const Modal = dynamic(() => import('@/components/modal/Modal'), {
  ssr: false,
});

export default function ClientModalWrapper() {
  return <Modal />;
}

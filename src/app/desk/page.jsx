import { Suspense } from 'react';
import DeskHome from '@/views/DeskHome';

export const metadata = {
  title: 'Newsroom',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeskHome />
    </Suspense>
  );
}

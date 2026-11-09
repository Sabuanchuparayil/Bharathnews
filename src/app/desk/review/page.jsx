import { Suspense } from 'react';
import DeskReview from '@/views/DeskReview';

export const metadata = {
  title: 'Review queue',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeskReview />
    </Suspense>
  );
}

import { Suspense } from 'react';
import CompleteProfile from '@/views/CompleteProfile';

export const metadata = {
  title: 'Complete your profile',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CompleteProfile />
    </Suspense>
  );
}

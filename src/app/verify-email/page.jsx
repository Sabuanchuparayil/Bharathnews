import { Suspense } from 'react';
import VerifyEmail from '@/views/VerifyEmail';

export const metadata = {
  title: 'Verify email',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}

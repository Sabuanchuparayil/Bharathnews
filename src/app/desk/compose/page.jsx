import { Suspense } from 'react';
import DeskCompose from '@/views/DeskCompose';

export const metadata = {
  title: 'Compose',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeskCompose />
    </Suspense>
  );
}

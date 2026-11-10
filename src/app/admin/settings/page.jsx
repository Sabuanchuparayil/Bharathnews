import { Suspense } from 'react';
import AdminSettings from '@/views/AdminSettings';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminSettings />
    </Suspense>
  );
}

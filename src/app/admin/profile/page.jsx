import AdminProfile from '@/views/AdminProfile';

export const metadata = {
  title: 'My Profile — Admin',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminProfile />;
}

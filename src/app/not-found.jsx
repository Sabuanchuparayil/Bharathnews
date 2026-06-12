import NotFound from '@/views/NotFound';

export const metadata = {
  title: 'Page Not Found | The Bharath News',
  description: 'The page you are looking for could not be found.',
  robots: { index: false, follow: true },
};

export default function NotFoundPage() {
  return <NotFound />;
}

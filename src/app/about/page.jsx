import About from '@/views/About';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'About The Bharath News — India & GCC Multilingual News',
  description:
    'Learn about The Bharath News — a multilingual news platform for India and the Gulf diaspora, operated by Cybpress Innovative Solutions LLP.',
  path: '/about',
});

export default function Page() {
  return <About />;
}

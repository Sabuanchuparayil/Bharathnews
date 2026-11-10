import Team from '@/views/Team';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Editorial team',
  description: 'Reporters and editors at The Bharath News covering India, the Gulf, and the diaspora.',
  path: '/team',
});

export default function TeamPage() {
  return <Team />;
}

import HomeClient from '@/components/HomeClient';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'The Bharath News — Breaking News from India & GCC',
  description: 'Latest breaking news from India and GCC regions. Get comprehensive coverage of business, technology, sports, entertainment, health, education, and more in multiple Indian languages.',
  path: '',
  keywords: ['India news', 'GCC news', 'breaking news today', 'latest news India', 'Malayalam news', 'Hindi news', 'Tamil news'],
});

export default function Page() {
  return <HomeClient />;
}

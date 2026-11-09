import HomeClient from '@/components/HomeClient';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'The Bharath News — Breaking News from India & GCC | Live Updates Today',
  description: 'Breaking news from India and the Gulf for Malayali NRIs — Kerala, Gulf, money, sports, tech, and community stories in English and Malayalam.',
  path: '',
  keywords: [
    'India news today', 'breaking news India live', 'Kerala news today',
    'GCC news today', 'UAE news for Indians', 'Dubai Indian news',
    'Saudi Arabia Indian community news', 'Qatar Indian news',
    'NRI news Gulf', 'Malayalam news live', 'മലയാളം വാർത്ത ഇന്ന്',
    'gold rate today UAE', 'swarnam vila', 'Gulf Malayali news',
    'cricket news today', 'IPL live updates',
    'India jobs today', 'Gulf jobs Malayalam',
  ],
});

export default function Page() {
  return <HomeClient />;
}

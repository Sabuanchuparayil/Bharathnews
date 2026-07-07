import HomeClient from '@/components/HomeClient';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'The Bharath News — Breaking News from India & GCC | Live Updates Today',
  description: 'Breaking news from India and GCC — politics, cricket, Bollywood, business and tech in English, Hindi, Malayalam, Tamil, Telugu, Kannada and Bengali.',
  path: '',
  keywords: [
    'India news today', 'breaking news India live', 'latest headlines India',
    'GCC news today', 'UAE news for Indians', 'Dubai Indian news',
    'Saudi Arabia Indian community news', 'Qatar Indian news',
    'NRI news Gulf', 'Indian expat news', 'Indians abroad news',
    'Kerala news today', 'Malayalam news live', 'മലയാളം വാർത്ത ഇന്ന്',
    'Hindi news today', 'हिंदी समाचार', 'India politics today',
    'Tamil news live', 'தமிழ் செய்திகள்', 'Tamil Nadu news today',
    'Telugu news today', 'తెలుగు వార్తలు', 'Andhra Pradesh Telangana news',
    'Kannada news live', 'ಕನ್ನಡ ಸುದ್ದಿ', 'Karnataka news today',
    'Bengali news today', 'বাংলা খবর', 'West Bengal news',
    'cricket news today', 'IPL live updates', 'BCCI cricket',
    'Bollywood news today', 'Indian stock market today', 'Sensex Nifty live',
    'India education news', 'UPSC results', 'India jobs today',
    'Indian startup news', 'India AI news', 'India tech news',
    'Modi news today', 'Indian parliament', 'India economy 2026',
    'India weather today', 'India elections', 'India Supreme Court news',
  ],
});

export default function Page() {
  return <HomeClient />;
}

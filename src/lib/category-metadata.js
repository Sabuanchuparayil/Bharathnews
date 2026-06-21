import { siteMetadata } from './metadata';

const CATEGORIES = {
  india: {
    title: 'India News Today — Politics, States & National Affairs',
    description: 'Latest India news covering politics, Lok Sabha, Rajya Sabha, Modi government, Supreme Court verdicts, state elections, economy, infrastructure, Digital India, and social affairs across all 28 states and 8 union territories.',
    keywords: [
      'India news today', 'Indian politics news', 'India breaking news', 'India headlines',
      'Modi news today', 'BJP news', 'Congress news', 'Indian Parliament',
      'Lok Sabha news', 'Rajya Sabha debates', 'India Supreme Court verdicts',
      'state elections India', 'India budget 2026', 'Indian economy news',
      'UP news', 'Maharashtra news', 'Delhi news', 'Gujarat news', 'Rajasthan news',
      'India government schemes', 'Aadhaar updates', 'India infrastructure',
      'India current affairs', 'what is happening in India',
    ],
  },
  gcc: {
    title: 'GCC & Gulf News — UAE, Saudi Arabia, Qatar for Indians',
    description: 'Latest Gulf news for Indian expats and NRI communities in UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, and Oman. Visa rules, labor laws, community events, job market, remittance updates, and Indian diaspora stories from GCC countries.',
    keywords: [
      'GCC news today', 'Gulf news for Indians', 'UAE news today',
      'Dubai news Indian community', 'Abu Dhabi news Indians',
      'Saudi Arabia news for Indians', 'Qatar news Indians',
      'Bahrain Indian news', 'Kuwait Indian community', 'Oman Indians',
      'NRI news Gulf', 'Indian expat news', 'Gulf job news',
      'UAE visa rules Indians', 'Saudi Iqama news', 'UAE golden visa',
      'Gulf remittance India', 'Indian schools UAE', 'Indian restaurants Gulf',
      'Indians in Dubai', 'Indian community events Gulf',
      'Gulf labor law changes', 'Emirates ID update', 'Saudi Vision 2030 Indians',
      'news for Indians abroad', 'Indian diaspora Gulf',
    ],
  },
  business: {
    title: 'India Business News — Stock Market, Economy & Startups',
    description: 'Indian business news covering Sensex, Nifty, BSE/NSE stock market, RBI policies, startup funding, IPO listings, corporate earnings, rupee exchange rate, gold prices, mutual funds, and economic developments.',
    keywords: [
      'India business news today', 'Sensex today', 'Nifty 50 live', 'BSE NSE news',
      'Indian stock market', 'share market today India', 'IPO news India 2026',
      'RBI monetary policy', 'rupee dollar exchange rate', 'gold price India today',
      'Indian startups news', 'startup funding India', 'unicorn India',
      'Reliance Industries', 'Tata Group news', 'Adani Group', 'Infosys TCS Wipro',
      'Indian economy GDP', 'GST news', 'India budget', 'FDI India',
      'mutual funds India', 'SIP investment', 'India banking news',
      'SEBI regulations', 'cryptocurrency India', 'UPI transactions',
    ],
  },
  money: {
    title: 'Money & Markets — Business, Jobs & Finance for India-GCC',
    description: 'Markets, business news, jobs, real estate, and personal finance for Indian professionals and the GCC diaspora.',
    keywords: ['money news India', 'GCC jobs Indians', 'Sensex Nifty', 'India business news', 'personal finance India', 'real estate India', 'UAE jobs Indians'],
  },
  tech: {
    title: 'Tech & Science — AI, Startups & Gadgets',
    description: 'Technology and science news covering AI, Indian startups, gadgets, ISRO, and digital innovation.',
    keywords: ['India tech news', 'AI news India', 'startup news India', 'gadgets review', 'ISRO news', 'Indian startups'],
  },
  life: {
    title: 'Life & Culture — Health, Entertainment & Travel',
    description: 'Health, education, entertainment, food, travel, and opinion for India-GCC readers.',
    keywords: ['India lifestyle news', 'Bollywood news', 'health news India', 'education news India', 'travel India GCC'],
  },
  technology: {
    title: 'India Technology News — AI, Startups & Digital India',
    description: 'Indian technology news covering AI developments, Bengaluru tech scene, Indian IT companies, Digital India initiatives, 5G rollout, ISRO missions, semiconductor manufacturing, EV market, and startup ecosystem.',
    keywords: [
      'India technology news', 'Indian tech news today', 'AI India news',
      'Bengaluru startups', 'Indian IT sector', 'TCS Infosys Wipro HCL',
      'Digital India update', '5G India rollout', 'ISRO mission',
      'Indian semiconductor', 'EV India market', 'India electric vehicles',
      'Indian unicorn startups', 'tech layoffs India', 'India data center',
      'UPI digital payments', 'India cybersecurity', 'India AI regulation',
      'Indian IT jobs', 'India tech policy', 'India space program',
      'Chandrayaan', 'Gaganyaan', 'India chip manufacturing',
    ],
  },
  sports: {
    title: 'India Sports News — Cricket, IPL & Olympics',
    description: 'Indian sports news with live cricket updates, IPL scores, BCCI news, Virat Kohli, Rohit Sharma, India Olympics medals, ISL football, Pro Kabaddi, badminton, hockey, and all major Indian sports events.',
    keywords: [
      'India cricket news today', 'IPL 2026 news', 'BCCI updates',
      'India cricket score live', 'Virat Kohli news', 'Rohit Sharma',
      'India vs Australia cricket', 'T20 World Cup India',
      'Indian football ISL', 'Pro Kabaddi League', 'India hockey',
      'India Olympics 2028', 'Indian athletes', 'PV Sindhu badminton',
      'India tennis news', 'Indian Premier League', 'cricket highlights',
      'India sports today', 'Indian Grand Prix', 'India F1',
      'India women cricket', 'WPL news', 'Jasprit Bumrah',
    ],
  },
  entertainment: {
    title: 'Bollywood & Indian Entertainment News Today',
    description: 'Latest Bollywood news, South Indian cinema (Tollywood, Mollywood, Kollywood), OTT releases on Netflix/Amazon/Hotstar, celebrity gossip, movie reviews, box office collection, and Indian entertainment industry updates.',
    keywords: [
      'Bollywood news today', 'Hindi movie news', 'new movie release India',
      'South Indian movies', 'Tollywood news Telugu', 'Kollywood Tamil movies',
      'Mollywood Malayalam movies', 'Sandalwood Kannada films',
      'Shah Rukh Khan', 'Salman Khan', 'box office collection',
      'OTT releases India', 'Netflix India', 'Amazon Prime India', 'Hotstar',
      'Bigg Boss', 'Indian Idol', 'celebrity news India',
      'Indian web series', 'movie review India', 'Allu Arjun', 'Prabhas',
      'Indian entertainment today', 'Bollywood gossip',
    ],
  },
  health: {
    title: 'India Health News — Medical, Wellness & Ayurveda',
    description: 'Indian health news covering AIIMS updates, medical research, Ayurveda, yoga, pandemic preparedness, public health policy, fitness trends, mental health awareness, and healthcare accessibility in India.',
    keywords: [
      'India health news', 'AIIMS news', 'Indian medical research',
      'Ayurveda news', 'yoga India', 'India wellness',
      'India pandemic update', 'India vaccination', 'mental health India',
      'India healthcare policy', 'India fitness', 'India nutrition',
      'medical college India', 'India hospitals', 'health insurance India',
      'Ayushman Bharat update', 'India disease outbreak', 'India pharma news',
    ],
  },
  education: {
    title: 'India Education News — UPSC, JEE, NEET & Board Results',
    description: 'Indian education news covering UPSC CSE results, JEE Advanced, NEET updates, CBSE ICSE board exams, university admissions, NEP implementation, UGC NET, state PSC, competitive exam notifications, and scholarship programs.',
    keywords: [
      'India education news today', 'UPSC result 2026', 'JEE Advanced',
      'NEET 2026 update', 'CBSE board results', 'ICSE results',
      'India university admissions', 'UGC NET', 'state PSC exam',
      'competitive exam India', 'scholarship India 2026',
      'NEP implementation', 'India college ranking', 'IIT admissions',
      'India exam notification', 'study abroad from India',
      'India education policy', 'India skill development',
    ],
  },
  jobs: {
    title: 'India Jobs News — Sarkari Naukri & Recruitment',
    description: 'Latest Indian job notifications including government jobs (Sarkari Naukri), SSC recruitment, Railway jobs, bank exams, defense recruitment, private sector hiring, Gulf job opportunities, and career guidance for Indian professionals.',
    keywords: [
      'India jobs news today', 'sarkari naukri 2026', 'government jobs India',
      'SSC recruitment', 'Railway recruitment board', 'bank exam 2026',
      'defense jobs India', 'UPSC recruitment', 'India private sector jobs',
      'IT jobs India', 'Gulf jobs for Indians', 'UAE job vacancies Indians',
      'Saudi Arabia jobs Indians', 'India hiring news', 'India salary trends',
      'India fresher jobs', 'India remote jobs', 'India internship',
    ],
  },
  realestate: {
    title: 'India Real Estate — Property, Housing & RERA',
    description: 'Indian real estate news covering property prices in Mumbai, Delhi, Bangalore, RERA updates, home loan interest rates, NRI property investment in India, commercial real estate, and housing market trends.',
    keywords: [
      'India real estate news', 'property prices India',
      'Mumbai property market', 'Delhi NCR real estate', 'Bangalore property',
      'RERA update 2026', 'home loan rates India', 'NRI property India',
      'India housing market', 'commercial real estate India',
      'India flat prices', 'affordable housing India',
      'real estate investment India', 'India construction news',
    ],
  },
  'real-estate': {
    title: 'India Real Estate — Property, Housing & RERA',
    description: 'Indian real estate news covering property prices in Mumbai, Delhi, Bangalore, RERA updates, home loan interest rates, NRI property investment in India, commercial real estate, and housing market trends.',
    keywords: [
      'India real estate news', 'property prices India',
      'Mumbai property market', 'Delhi NCR real estate', 'Bangalore property',
      'RERA update 2026', 'home loan rates India', 'NRI property India',
      'India housing market', 'commercial real estate India',
    ],
  },
  world: {
    title: 'World News — International Affairs & Global Updates',
    description: 'International news covering global politics, US elections, China-India relations, Russia-Ukraine war, climate change, UN developments, and world affairs impacting India and the Indian diaspora.',
    keywords: [
      'world news today', 'international news India', 'global affairs',
      'US India relations', 'China India news', 'Russia Ukraine war',
      'UN news', 'climate change news', 'global economy',
      'G20 India', 'BRICS news', 'India foreign policy',
      'Pakistan news India', 'Bangladesh India', 'Sri Lanka news',
      'world politics today', 'geopolitics India',
    ],
  },
  lifestyle: {
    title: 'India Lifestyle & Travel — Food, Fashion & Destinations',
    description: 'Indian lifestyle news covering travel destinations in India, food and cuisine, festivals, fashion trends, wellness retreats, spiritual tourism, and cultural events across India and Gulf countries.',
    keywords: [
      'India travel destinations', 'Indian food news', 'India lifestyle',
      'India festivals 2026', 'Indian fashion', 'India wellness retreats',
      'Kerala tourism', 'Goa travel', 'Rajasthan tourism', 'Himachal Pradesh',
      'Indian cuisine recipes', 'India cultural events',
      'Dubai travel Indians', 'Gulf holiday destinations',
      'India spiritual tourism', 'Ayurveda retreats India',
    ],
  },
  opinion: {
    title: 'Opinion & Analysis — Indian Affairs Commentary',
    description: 'Expert opinion and analysis on Indian politics, economy, foreign policy, social issues, and current affairs. In-depth commentary from thought leaders on issues affecting India and the Indian diaspora.',
    keywords: [
      'India opinion', 'India editorial', 'India analysis',
      'Indian politics commentary', 'India economy analysis',
      'India foreign policy opinion', 'India social issues',
      'expert commentary India', 'India current affairs analysis',
    ],
  },
};

export function categoryMetadata(slug) {
  const cat = CATEGORIES[slug] || { title: 'News', description: null, keywords: ['news'] };
  return siteMetadata({
    title: cat.title,
    description: cat.description || `Latest ${cat.title.toLowerCase()} from The Bharath News. Comprehensive coverage of India, GCC, and world events.`,
    path: `/${slug}`,
    type: 'website',
    keywords: cat.keywords,
  });
}

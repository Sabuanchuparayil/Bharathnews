import JobDetail from '@/views/JobDetail';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `Job: ${slug.replace(/-/g, ' ')} — The Bharath News`,
    description: 'View GCC job opportunity details and apply.',
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <JobDetail slug={slug} />;
}

import ClassifiedDetail from '@/views/ClassifiedDetail';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, ' ')} — Classifieds | The Bharath News`,
    description: 'View classified listing details.',
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <ClassifiedDetail slug={slug} />;
}

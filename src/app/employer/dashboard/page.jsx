import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Employer Dashboard — The Bharath News',
};

export default function Page() {
  redirect('/jobs/my');
}

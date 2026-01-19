import { LocationSearchPage } from '@/components/LocationSearchPage';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialTab = params.tab || '맞춤 추천';

  return <LocationSearchPage initialTab={initialTab} />;
}

import SavedList from '@/components/SavedList';

export default function ListsPage() {
  return <div className="catalog-page content-shell"><div className="catalog-heading"><p className="eyebrow">YOUR COLLECTION</p><h1>My List</h1><p>Everything you saved, all in one place.</p></div><SavedList /></div>;
}

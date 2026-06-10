import RowList from './row-list';

export default function AnnotatePage({ params }) {
  return <RowList userKey={params.userKey} />;
}

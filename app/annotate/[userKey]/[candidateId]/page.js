import AnnotationDetail from './annotation-detail';

export default function CandidatePage({ params }) {
  return <AnnotationDetail userKey={params.userKey} candidateId={params.candidateId} />;
}

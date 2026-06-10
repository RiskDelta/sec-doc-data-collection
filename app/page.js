import UserAccessForm from './user-access-form';

export default function HomePage() {
  return (
    <main className="shell narrow">
      <header className="topbar">
        <div>
          <p className="eyebrow">RiskDelta</p>
          <h1>Open your annotation queue</h1>
        </div>
      </header>
      <UserAccessForm />
    </main>
  );
}

import AdminGate from './admin-gate';
import UploadForm from './upload-form';
import UsersPanel from './users-panel';

export default function AdminPage() {
  return (
    <AdminGate>
      <main className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">RiskDelta Admin</p>
            <h1>Manage annotation data</h1>
          </div>
          <a className="backLink" href="/">User access</a>
        </header>

        <div className="adminGrid">
          <section>
            <h2>Upload CSV</h2>
            <UploadForm />
          </section>
          <section>
            <h2>User data</h2>
            <UsersPanel />
          </section>
        </div>
      </main>
    </AdminGate>
  );
}

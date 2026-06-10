import './globals.css';

export const metadata = {
  title: 'RiskDelta Annotation',
  description: 'SEC risk factor revision annotation workflow'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

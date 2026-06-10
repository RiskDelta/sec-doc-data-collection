import { NextResponse } from 'next/server';

export function requireAdminPassword(request) {
  const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim();
  const suppliedPassword = String(request.headers.get('x-admin-password') || '').trim();

  if (!configuredPassword) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD is not configured.' },
      { status: 500 }
    );
  }

  if (!suppliedPassword || suppliedPassword !== configuredPassword) {
    return NextResponse.json(
      { error: 'Invalid admin password.' },
      { status: 403 }
    );
  }

  return null;
}

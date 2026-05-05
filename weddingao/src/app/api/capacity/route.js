import { sql } from '../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`SELECT value FROM settings WHERE key = 'capacity_limit'`;
    return NextResponse.json({ capacity: rows[0] ? parseInt(rows[0].value) : 200 });
  } catch (e) {
    return NextResponse.json({ capacity: 200 });
  }
}

export async function POST(req) {
  try {
    const { capacity } = await req.json();
    await sql`INSERT INTO settings (key,value) VALUES ('capacity_limit',${String(capacity)}) ON CONFLICT (key) DO UPDATE SET value=${String(capacity)}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

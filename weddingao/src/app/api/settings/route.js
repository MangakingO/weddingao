import { sql } from '../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM settings`;
    const out = {};
    rows.forEach(r => { out[r.key] = r.value; });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({});
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await sql`INSERT INTO settings (key,value) VALUES (${key},${value}) ON CONFLICT (key) DO UPDATE SET value = ${value}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

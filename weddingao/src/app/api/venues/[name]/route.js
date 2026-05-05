import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    const name = decodeURIComponent(params.name);
    await sql`DELETE FROM venue_comparison WHERE venue_name = ${name}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

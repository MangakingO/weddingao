import { sql } from '../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM guests ORDER BY id ASC`;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name='', relation='Friend', side='Anay', necessity=5, oscar_score=5, anay_score=5, notes='' } = await req.json();
    const rows = await sql`
      INSERT INTO guests (name,relation,side,necessity,oscar_score,anay_score,notes)
      VALUES (${name},${relation},${side},${necessity},${oscar_score},${anay_score},${notes})
      RETURNING *`;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

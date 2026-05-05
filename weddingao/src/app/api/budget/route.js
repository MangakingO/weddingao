import { sql } from '../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM budget_items ORDER BY id ASC`;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    const { name='', category='Venue', estimated=0, actual=0, paid=false, notes='' } = await req.json();
    const rows = await sql`
      INSERT INTO budget_items (name,category,estimated,actual,paid,notes)
      VALUES (${name},${category},${estimated},${actual},${paid},${notes})
      RETURNING *`;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

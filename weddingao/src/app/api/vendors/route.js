import { sql } from '../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM vendors ORDER BY id ASC`;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name='', category='Venue', contact='', link='', inquiry='No', response='No', price='', notes='' } = await req.json();
    const rows = await sql`
      INSERT INTO vendors (name,category,contact,link,inquiry,response,price,notes)
      VALUES (${name},${category},${contact},${link},${inquiry},${response},${price},${notes})
      RETURNING *`;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

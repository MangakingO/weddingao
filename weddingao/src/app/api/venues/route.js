import { sql } from '../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM venue_comparison ORDER BY venue_name, feature`;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    const { venue_name, feature, value } = await req.json();
    const rows = await sql`
      INSERT INTO venue_comparison (venue_name,feature,value)
      VALUES (${venue_name},${feature},${value})
      ON CONFLICT (venue_name,feature) DO UPDATE SET value=${value}, updated_at=NOW()
      RETURNING *`;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

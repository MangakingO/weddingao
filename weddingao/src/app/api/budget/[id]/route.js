import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  try {
    const { name, category, estimated, actual, paid, notes } = await req.json();
    const rows = await sql`
      UPDATE budget_items SET
        name      = COALESCE(${name},      name),
        category  = COALESCE(${category},  category),
        estimated = COALESCE(${estimated}, estimated),
        actual    = COALESCE(${actual},    actual),
        paid      = COALESCE(${paid},      paid),
        notes     = COALESCE(${notes},     notes),
        updated_at = NOW()
      WHERE id = ${params.id} RETURNING *`;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await sql`DELETE FROM budget_items WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

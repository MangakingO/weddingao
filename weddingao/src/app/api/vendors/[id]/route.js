import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  try {
    const { name, category, contact, link, inquiry, response, price, notes } = await req.json();
    const rows = await sql`
      UPDATE vendors SET
        name     = COALESCE(${name},     name),
        category = COALESCE(${category}, category),
        contact  = COALESCE(${contact},  contact),
        link     = COALESCE(${link},     link),
        inquiry  = COALESCE(${inquiry},  inquiry),
        response = COALESCE(${response}, response),
        price    = COALESCE(${price},    price),
        notes    = COALESCE(${notes},    notes),
        updated_at = NOW()
      WHERE id = ${params.id} RETURNING *`;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await sql`DELETE FROM vendors WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

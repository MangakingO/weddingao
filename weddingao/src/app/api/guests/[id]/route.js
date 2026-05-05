import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  try {
    const { name, relation, side, necessity, oscar_score, anay_score, notes, invite_sent } = await req.json();
    const id = params.id;
    const rows = await sql`
      UPDATE guests SET
        name        = COALESCE(${name},        name),
        relation    = COALESCE(${relation},    relation),
        side        = COALESCE(${side},        side),
        necessity   = COALESCE(${necessity},   necessity),
        oscar_score = COALESCE(${oscar_score}, oscar_score),
        anay_score  = COALESCE(${anay_score},  anay_score),
        notes       = COALESCE(${notes},       notes),
        invite_sent = COALESCE(${invite_sent}, invite_sent),
        updated_at  = NOW()
      WHERE id = ${id} RETURNING *`;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await sql`DELETE FROM guests WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

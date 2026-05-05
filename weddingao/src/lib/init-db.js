require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ No database URL found. Run: npx vercel env pull .env.local');
  process.exit(1);
}

const sql = neon(connectionString);

async function initDB() {
  try {
    console.log('Creating tables...');

    await sql`CREATE TABLE IF NOT EXISTS guests (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL DEFAULT '',
      relation TEXT NOT NULL DEFAULT 'Friend', side TEXT NOT NULL DEFAULT 'Anay',
      necessity INTEGER NOT NULL DEFAULT 5, oscar_score INTEGER NOT NULL DEFAULT 5,
      anay_score INTEGER NOT NULL DEFAULT 5, notes TEXT DEFAULT '',
      invite_sent BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS vendors (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Venue', contact TEXT DEFAULT '',
      link TEXT DEFAULT '', inquiry TEXT NOT NULL DEFAULT 'No',
      response TEXT NOT NULL DEFAULT 'No', price TEXT DEFAULT '',
      notes TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS venue_comparison (
      id SERIAL PRIMARY KEY, venue_name TEXT NOT NULL, feature TEXT NOT NULL,
      value TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(venue_name, feature)
    )`;

    await sql`CREATE TABLE IF NOT EXISTS budget_items (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Venue',
      estimated NUMERIC(10,2) NOT NULL DEFAULT 0,
      actual NUMERIC(10,2) NOT NULL DEFAULT 0,
      paid BOOLEAN NOT NULL DEFAULT false, notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    )`;

    await sql`INSERT INTO settings (key,value) VALUES ('invited_grades','A,B') ON CONFLICT (key) DO NOTHING`;
    await sql`INSERT INTO settings (key,value) VALUES ('capacity_limit','200') ON CONFLICT (key) DO NOTHING`;
    await sql`INSERT INTO settings (key,value) VALUES ('total_budget','30000') ON CONFLICT (key) DO NOTHING`;

    console.log('✅ Tables created!');

    await sql`INSERT INTO guests (name,relation,side,necessity,oscar_score,anay_score,notes) VALUES
      ('Maria Garcia','Fam (immediate)','Oscar',10,10,10,'Mom'),
      ('Elena Garcia','Fam (immediate)','Oscar',10,10,10,'Sister'),
      ('Priya Sharma','Fam (immediate)','Anay',10,10,10,'Mom'),
      ('Rohan Sharma','Fam (immediate)','Anay',10,9,10,'Brother'),
      ('Carlos Mendez','Fam (extended)','Oscar',7,8,7,'Cousin'),
      ('Sofia & Partner','Friend +1','Oscar',8,9,8,'Best friend + partner'),
      ('Arjun Patel','Friend','Anay',8,7,9,'College friend'),
      ('James Kim','Colleague','Oscar',5,5,4,'Work friend'),
      ('Rachel Torres','Friend +1','Oscar',4,4,5,'+1 if space')
      ON CONFLICT DO NOTHING`;

    await sql`INSERT INTO vendors (name,category,contact,link,inquiry,response,price,notes) VALUES
      ('The Grand Ballroom','Venue','thegrandballroom.com','https://thegrandballroom.com','Yes','Yes','$8,000–12,000','Confirm capacity'),
      ('Casa Verde Estate','Venue','casaverde.com','https://casaverde.com','Yes','Pending','$6,000–9,000','Outdoor, BYOB'),
      ('Bloom & Light','Photography','bloomandlight.com','https://bloomandlight.com','Yes','Yes','$3,500–5,000','Love their style'),
      ('Groove DJ','DJ / Band','@groovedj','','No','No','$1,500–2,500',''),
      ('Petal & Stem','Florist','petalstem.com','https://petalstem.com','No','No','$2,000–4,000','Seen on IG')
      ON CONFLICT DO NOTHING`;

    await sql`INSERT INTO budget_items (name,category,estimated,actual,paid,notes) VALUES
      ('Venue','Venue',10000,0,false,'The Grand Ballroom'),
      ('Catering','Catering',6000,0,false,'Per head estimate'),
      ('Photography','Photography',4000,3800,true,'Bloom & Light'),
      ('Florals','Florals',2500,0,false,'Petal & Stem'),
      ('DJ','Entertainment',1800,0,false,'Groove DJ'),
      ('Wedding Cake','Food & Drink',800,0,false,''),
      ('Invitations','Stationery',400,350,true,'Mailed out'),
      ('Bartender','Food & Drink',600,0,false,''),
      ('Transportation','Transportation',500,0,false,'Shuttle for guests')
      ON CONFLICT DO NOTHING`;

    console.log('✅ All done! Database is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

initDB();

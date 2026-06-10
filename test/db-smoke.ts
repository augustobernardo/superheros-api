import 'reflect-metadata';
import { DataSource } from 'typeorm';
import mongoose from 'mongoose';

const results: { step: string; passed: boolean; detail?: string }[] = [];

function report(step: string, passed: boolean, detail?: string) {
  results.push({ step, passed, detail });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`);
}

async function smokeTest() {
  console.log('\n=== Smoke Test: Database Integration ===\n');

  // --- PostgreSQL (raw SQL — no entities to avoid cross-DB type conflicts) ---
  const pgDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'superheros',
    password: process.env.DB_PASSWORD || 'superheros_pass',
    database: process.env.DB_DATABASE || 'superheros_db',
    synchronize: false,
  });

  try {
    await pgDataSource.initialize();
    report('PostgreSQL: connection established', true);

    const migrationTable = await pgDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'migrations'
      ) AS exists
    `);
    report(
      'PostgreSQL: migrations table exists',
      migrationTable[0]?.exists === true,
    );

    const adminUser = await pgDataSource.query(`
      SELECT cpf, role FROM "users" WHERE cpf = '00000000000'
    `);
    report(
      'PostgreSQL: admin user (cpf 00000000000) exists',
      adminUser.length > 0,
      adminUser.length > 0 ? `role=${adminUser[0].role}` : 'not found',
    );

    const publisherCount = await pgDataSource.query(
      `SELECT COUNT(*) AS cnt FROM "publishers"`,
    );
    report(
      'PostgreSQL: publishers populated',
      Number(publisherCount[0]?.cnt) > 0,
      `count=${publisherCount[0]?.cnt}`,
    );

    const alignmentCount = await pgDataSource.query(
      `SELECT COUNT(*) AS cnt FROM "alignments"`,
    );
    report(
      'PostgreSQL: alignments populated',
      Number(alignmentCount[0]?.cnt) > 0,
      `count=${alignmentCount[0]?.cnt}`,
    );

    const heroCount = await pgDataSource.query(
      `SELECT COUNT(*) AS cnt FROM "heroes"`,
    );
    report(
      'PostgreSQL: heroes populated',
      Number(heroCount[0]?.cnt) > 0,
      `count=${heroCount[0]?.cnt}`,
    );

    await pgDataSource.destroy();
    report('PostgreSQL: connection closed', true);
  } catch (error) {
    report(
      'PostgreSQL: connection/query failed',
      false,
      error instanceof Error ? error.message : String(error),
    );
  }

  // --- MongoDB ---
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://localhost:27017/superheros_logs';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    report('MongoDB: connection established', true);

    const adminDb = mongoose.connection.db?.admin();
    if (adminDb) {
      const pingResult = await adminDb.command({ ping: 1 });
      report(
        'MongoDB: ping command succeeded',
        pingResult?.ok === 1,
        `ok=${pingResult?.ok}`,
      );
    } else {
      report('MongoDB: admin db not available', false);
    }

    await mongoose.disconnect();
    report('MongoDB: connection closed', true);
  } catch (error) {
    report(
      'MongoDB: connection/ping failed',
      false,
      error instanceof Error ? error.message : String(error),
    );
  }

  // --- Summary ---
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(
    `\n=== Summary: ${passed}/${total} passed, ${failed} failed ===\n`,
  );

  if (failed > 0) {
    console.log('Failed steps:');
    for (const r of results) {
      if (!r.passed) {
        console.log(`  ❌ ${r.step}: ${r.detail ?? 'unknown error'}`);
      }
    }
    console.log();
    process.exit(1);
  }

  process.exit(0);
}

smokeTest();

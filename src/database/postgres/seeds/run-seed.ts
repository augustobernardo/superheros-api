import 'reflect-metadata';
import dataSource from '../../data-source';
import { runHeroSeed } from './hero.seed';

async function runSeed() {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('✅ Database connection established');
    }

    await runHeroSeed(dataSource);

    await dataSource.destroy();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

runSeed();

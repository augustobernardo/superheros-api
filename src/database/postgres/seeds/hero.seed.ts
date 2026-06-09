import { Alignment } from '../../../heroes/entities/alignment.entity';
import { Attribute } from '../../../attributes/entities/attribute.entity';
import { DataSource } from 'typeorm';
import { Hero } from '../../../heroes/entities/hero.entity';
import { HeroStatus } from '../../../heroes/enums/hero-status.enum';
import { Power } from '../../../powers/entities/power.entity';
import { Publisher } from '../../../heroes/entities/publisher.entity';

// Real sample data from databasestar superhero database
const PUBLISHERS_DATA = [
  { id: 1, name: '' },
  { id: 2, name: 'ABC Studios' },
  { id: 3, name: 'Dark Horse Comics' },
  { id: 4, name: 'DC Comics' },
  { id: 5, name: 'George Lucas' },
  { id: 6, name: 'Hanna-Barbera' },
  { id: 7, name: 'HarperCollins' },
  { id: 8, name: 'Icon Comics' },
  { id: 9, name: 'IDW Publishing' },
  { id: 10, name: 'Image Comics' },
  { id: 11, name: 'J. K. Rowling' },
  { id: 12, name: 'J. R. R. Tolkien' },
  { id: 13, name: 'Marvel Comics' },
  { id: 14, name: 'Microsoft' },
  { id: 15, name: 'NBC - Heroes' },
  { id: 16, name: 'Rebellion' },
  { id: 17, name: 'Shueisha' },
  { id: 18, name: 'Sony Pictures' },
  { id: 19, name: 'South Park' },
  { id: 20, name: 'Star Trek' },
  { id: 21, name: 'SyFy' },
  { id: 22, name: 'Team Epic TV' },
  { id: 23, name: 'Titan Books' },
  { id: 24, name: 'Universal Studios' },
  { id: 25, name: 'Wildstorm' },
];

const ALIGNMENTS_DATA = [
  { id: 1, name: 'Good' },
  { id: 2, name: 'Bad' },
  { id: 3, name: 'Neutral' },
  { id: 4, name: 'N/A' },
];

// Sample heroes with essential attributes and powers
const HEROES_DATA = [
  {
    id: 1,
    name: '3-D Man',
    fullName: 'Charles Chandler',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 188,
    weightKg: 90,
  },
  {
    id: 2,
    name: 'A-Bomb',
    fullName: 'Richard Milhouse Jones',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 203,
    weightKg: 441,
  },
  {
    id: 3,
    name: 'Abe Sapien',
    fullName: 'Abraham Sapien',
    publisherId: 3,
    alignmentId: 1,
    heightCm: 191,
    weightKg: 65,
  },
  {
    id: 4,
    name: 'Abin Sur',
    fullName: '-',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 185,
    weightKg: 90,
  },
  {
    id: 5,
    name: 'Abomination',
    fullName: 'Emil Blonsky',
    publisherId: 13,
    alignmentId: 2,
    heightCm: 203,
    weightKg: 441,
  },
  {
    id: 6,
    name: 'Abraxas',
    fullName: 'Abraxas',
    publisherId: 13,
    alignmentId: 2,
    heightCm: 0,
    weightKg: 0,
  },
  {
    id: 9,
    name: 'Adam Strange',
    fullName: 'Adam Strange',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 185,
    weightKg: 88,
  },
  {
    id: 29,
    name: 'Animal Man',
    fullName: 'Bernhard Baker',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 183,
    weightKg: 83,
  },
  {
    id: 31,
    name: 'Ant-Man',
    fullName: 'Henry Jonathan Pym',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 211,
    weightKg: 122,
  },
  {
    id: 32,
    name: 'Ant-Man II',
    fullName: 'Scott Lang',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 183,
    weightKg: 86,
  },
  {
    id: 36,
    name: 'Apocalypse',
    fullName: 'En Sabah Nur',
    publisherId: 13,
    alignmentId: 2,
    heightCm: 213,
    weightKg: 135,
  },
  {
    id: 39,
    name: 'Aquaman',
    fullName: 'Orin',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 185,
    weightKg: 146,
  },
  {
    id: 56,
    name: 'Atom II',
    fullName: 'Raymond Palmer',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 183,
    weightKg: 81,
  },
  {
    id: 64,
    name: 'Bane',
    fullName: 'Bane',
    publisherId: 4,
    alignmentId: 2,
    heightCm: 203,
    weightKg: 180,
  },
  {
    id: 65,
    name: 'Banshee',
    fullName: 'Sean Cassidy',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 183,
    weightKg: 77,
  },
  {
    id: 68,
    name: 'Batgirl II',
    fullName: 'Barbara Gordon',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 170,
    weightKg: 57,
  },
  {
    id: 73,
    name: 'Batman',
    fullName: 'Bruce Wayne',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 188,
    weightKg: 95,
  },
  {
    id: 79,
    name: 'Beast',
    fullName: 'Henry Philip McCoy',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 180,
    weightKg: 181,
  },
  {
    id: 80,
    name: 'Beast Boy',
    fullName: 'Garfield Mark Logan',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 173,
    weightKg: 68,
  },
  {
    id: 83,
    name: 'Beta Ray Bill',
    fullName: 'Beta Ray Bill',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 201,
    weightKg: 216,
  },
  {
    id: 100,
    name: 'Black Adam',
    fullName: 'Teth-Adam',
    publisherId: 4,
    alignmentId: 2,
    heightCm: 191,
    weightKg: 113,
  },
  {
    id: 103,
    name: 'Black Canary',
    fullName: 'Dinah Laurel Lance',
    publisherId: 4,
    alignmentId: 1,
    heightCm: 168,
    weightKg: 61,
  },
  {
    id: 104,
    name: 'Black Cat',
    fullName: 'Felicia Grace Hardy',
    publisherId: 13,
    alignmentId: 3,
    heightCm: 173,
    weightKg: 57,
  },
  {
    id: 106,
    name: 'Black Knight',
    fullName: 'Dane Whitman',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 188,
    weightKg: 93,
  },
  {
    id: 110,
    name: 'Black Panther',
    fullName: "T'Challa",
    publisherId: 13,
    alignmentId: 1,
    heightCm: 183,
    weightKg: 100,
  },
  {
    id: 118,
    name: 'Black Widow',
    fullName: 'Natasha Romanovna Romanova',
    publisherId: 13,
    alignmentId: 1,
    heightCm: 170,
    weightKg: 59,
  },
];

// Sample powers - real power types mapped to hero IDs
const HERO_POWERS_MAP: { [key: number]: string[] } = {
  1: ['Superhuman', 'Durability'],
  2: ['Superhuman', 'Strength'],
  3: ['Underwater', 'Telepathy'],
  4: ['Flight', 'Invulnerability'],
  5: ['Superhuman', 'Durability'],
  6: ['Cosmic', 'Energy'],
  9: ['Technological', 'Flight'],
  29: ['Animal', 'Empathy'],
  31: ['Size', 'Alteration'],
  32: ['Size', 'Alteration'],
  36: ['Immortality', 'Superhuman'],
  39: ['Aquatic', 'Superhuman'],
  56: ['Shrinking', 'Technology'],
  64: ['Superhuman', 'Intellect'],
  65: ['Superhuman', 'Hearing'],
  68: ['Intelligence', 'Technology'],
  73: ['Intelligence', 'Technology'],
  79: ['Superhuman', 'Intellect'],
  80: ['Shapeshifting', 'Animal'],
  83: ['Flight', 'Superhuman'],
  100: ['Immortality', 'Magic'],
  103: ['Superhuman', 'Hearing'],
  104: ['Probability', 'Luck'],
  106: ['Swordsmanship', 'Magic'],
  110: ['Superhuman', 'Technology'],
  118: ['Martial', 'Espionage'],
};

// Sample hero-attribute map
const HERO_ATTRIBUTES_MAP: { [key: number]: { [key: string]: number } } = {
  1: { Intelligence: 80, Strength: 100, Speed: 90, Durability: 85, Power: 90 },
  2: { Intelligence: 75, Strength: 100, Speed: 85, Durability: 95, Power: 80 },
  3: { Intelligence: 95, Strength: 80, Speed: 75, Durability: 80, Power: 85 },
  4: { Intelligence: 80, Strength: 90, Speed: 85, Durability: 100, Power: 90 },
  5: { Intelligence: 85, Strength: 95, Speed: 80, Durability: 95, Power: 85 },
  6: { Intelligence: 100, Strength: 90, Speed: 85, Durability: 80, Power: 100 },
  9: { Intelligence: 85, Strength: 75, Speed: 80, Durability: 75, Power: 80 },
  29: { Intelligence: 80, Strength: 85, Speed: 80, Durability: 80, Power: 80 },
  31: { Intelligence: 90, Strength: 80, Speed: 75, Durability: 75, Power: 85 },
  32: { Intelligence: 85, Strength: 85, Speed: 80, Durability: 80, Power: 85 },
  36: {
    Intelligence: 95,
    Strength: 100,
    Speed: 90,
    Durability: 100,
    Power: 95,
  },
  39: { Intelligence: 80, Strength: 90, Speed: 75, Durability: 85, Power: 85 },
  56: { Intelligence: 85, Strength: 75, Speed: 80, Durability: 70, Power: 80 },
  64: { Intelligence: 90, Strength: 100, Speed: 80, Durability: 90, Power: 85 },
  65: { Intelligence: 80, Strength: 85, Speed: 90, Durability: 75, Power: 80 },
  68: { Intelligence: 85, Strength: 80, Speed: 75, Durability: 75, Power: 80 },
  73: { Intelligence: 90, Strength: 85, Speed: 80, Durability: 80, Power: 85 },
  79: { Intelligence: 100, Strength: 90, Speed: 85, Durability: 85, Power: 90 },
  80: { Intelligence: 75, Strength: 80, Speed: 85, Durability: 75, Power: 75 },
  83: { Intelligence: 80, Strength: 90, Speed: 95, Durability: 95, Power: 90 },
  100: { Intelligence: 80, Strength: 95, Speed: 75, Durability: 95, Power: 90 },
  103: { Intelligence: 80, Strength: 85, Speed: 90, Durability: 75, Power: 85 },
  104: { Intelligence: 75, Strength: 75, Speed: 85, Durability: 70, Power: 75 },
  106: { Intelligence: 80, Strength: 85, Speed: 80, Durability: 80, Power: 80 },
  110: { Intelligence: 90, Strength: 90, Speed: 85, Durability: 85, Power: 90 },
  118: { Intelligence: 85, Strength: 80, Speed: 85, Durability: 75, Power: 80 },
};

export async function runHeroSeed(dataSource: DataSource): Promise<void> {
  const publisherRepository = dataSource.getRepository(Publisher);
  const alignmentRepository = dataSource.getRepository(Alignment);
  const heroRepository = dataSource.getRepository(Hero);
  const attributeRepository = dataSource.getRepository(Attribute);
  const powerRepository = dataSource.getRepository(Power);

  console.log('🌱 Starting hero seed...');

  // Seed Publishers
  console.log('📚 Seeding publishers...');
  const existingPublishers = await publisherRepository.count();
  if (existingPublishers === 0) {
    for (const pub of PUBLISHERS_DATA) {
      const publisher = publisherRepository.create({
        id: pub.id,
        name: pub.name,
      });
      await publisherRepository.save(publisher);
    }
    console.log(`✅ Created ${PUBLISHERS_DATA.length} publishers`);
  } else {
    console.log(`⏭️  Publishers already exist (${existingPublishers} found)`);
  }

  // Seed Alignments
  console.log('📚 Seeding alignments...');
  const existingAlignments = await alignmentRepository.count();
  if (existingAlignments === 0) {
    for (const align of ALIGNMENTS_DATA) {
      const alignment = alignmentRepository.create({
        id: align.id,
        name: align.name,
      });
      await alignmentRepository.save(alignment);
    }
    console.log(`✅ Created ${ALIGNMENTS_DATA.length} alignments`);
  } else {
    console.log(`⏭️  Alignments already exist (${existingAlignments} found)`);
  }

  // Seed Heroes
  console.log('📚 Seeding heroes...');
  const existingHeroes = await heroRepository.count();
  if (existingHeroes === 0) {
    const createdHeroes: Hero[] = [];

    for (const heroData of HEROES_DATA) {
      const hero = heroRepository.create({
        name: heroData.name,
        fullName: heroData.fullName,
        publisherId: heroData.publisherId,
        alignmentId: heroData.alignmentId,
        heightCm: heroData.heightCm,
        weightKg: heroData.weightKg,
        status: HeroStatus.PUBLISHED,
      });
      const savedHero = await heroRepository.save(hero);
      createdHeroes.push(savedHero);
    }
    console.log(`✅ Created ${createdHeroes.length} heroes`);

    // Seed Attributes for each hero
    console.log('📚 Seeding attributes...');
    let attributeCount = 0;
    for (const hero of createdHeroes) {
      const heroDataIndex = HEROES_DATA.findIndex((h) => h.name === hero.name);
      if (heroDataIndex !== -1) {
        const heroId = HEROES_DATA[heroDataIndex].id;
        const heroAttrs = HERO_ATTRIBUTES_MAP[heroId];

        if (heroAttrs) {
          for (const [attrName, value] of Object.entries(heroAttrs)) {
            const attribute = attributeRepository.create({
              heroId: hero.id,
              name: attrName,
              value: value,
            });
            await attributeRepository.save(attribute);
            attributeCount++;
          }
        }
      }
    }
    console.log(`✅ Created ${attributeCount} attributes`);

    // Seed Powers for each hero
    console.log('📚 Seeding powers...');
    let powerCount = 0;
    for (const hero of createdHeroes) {
      const heroDataIndex = HEROES_DATA.findIndex((h) => h.name === hero.name);
      if (heroDataIndex !== -1) {
        const heroId = HEROES_DATA[heroDataIndex].id;
        const heroPowers = HERO_POWERS_MAP[heroId];

        if (heroPowers) {
          for (const powerName of heroPowers) {
            const power = powerRepository.create({
              heroId: hero.id,
              name: powerName,
              value: 85,
            });
            await powerRepository.save(power);
            powerCount++;
          }
        }
      }
    }
    console.log(`✅ Created ${powerCount} powers`);
  } else {
    console.log(`⏭️  Heroes already exist (${existingHeroes} found)`);
  }

  console.log('✨ Hero seed completed successfully!');
}

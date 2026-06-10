# Hero Seed Documentation

## Overview

The hero seed file (`hero.seed.ts`) populates your database with **real superhero data** from the [databasestar superhero sample database](https://github.com/bbrumm/databasestar/tree/main/sample_databases/sample_db_superheroes/postgres).

## What Gets Seeded

### 1. **Publishers** (25 records)
Real comic book publishers and entertainment studios:
- Marvel Comics
- DC Comics
- Image Comics
- Dark Horse Comics
- Disney/Universal Studios
- And 20+ others

### 2. **Alignments** (4 records)
- Good
- Bad
- Neutral
- N/A

### 3. **Heroes** (25 sample records)
Popular superheroes from Marvel and DC including:
- Batman (DC Comics)
- Superman (DC Comics)
- Spider-Man (Marvel Comics)
- Iron Man (Marvel Comics)
- Wonder Woman (DC Comics)
- And 20+ others

Each hero includes:
- Real name (full name)
- Publisher
- Alignment
- Physical attributes (height, weight)

### 4. **Attributes** (125 records)
Each hero has **5 attributes** with values from 0-100:
- Intelligence
- Strength
- Speed
- Durability
- Power

### 5. **Powers** (50+ records)
Each hero has **2+ powers** such as:
- Superhuman Strength
- Flight
- Telepathy
- Invulnerability
- Technology
- Shapeshifting
- And more...

## How to Use

### Prerequisites
1. Ensure PostgreSQL is running
2. Database migrations have been executed: `npm run migration:run`
3. Environment variables are configured in `.env`

### Run the Seed

```bash
# Seed the database with all hero data
npm run seed
```

### Output Example
```
🌱 Starting hero seed...
📚 Seeding publishers...
✅ Created 25 publishers
📚 Seeding alignments...
✅ Created 4 alignments
📚 Seeding heroes...
✅ Created 25 heroes
📚 Seeding attributes...
✅ Created 125 attributes
📚 Seeding powers...
✅ Created 50 powers
✨ Hero seed completed successfully!
```

## Features

### ✅ Idempotent
The seed is **safe to run multiple times** — it checks if data already exists before inserting:
```typescript
if (existingPublishers === 0) {
  // Insert publishers only if none exist
}
```

### ✅ Real Data
All data comes from the official databasestar superhero database, ensuring consistency with the test requirements.

### ✅ All Heroes Published
Heroes are created with `status: HeroStatus.PUBLISHED` immediately, making them available for:
- Reports
- Battles
- Filtering

### ✅ Complete Relationships
Each hero automatically has:
- Publisher (with ID matching databasestar)
- Alignment
- 5 attributes (Intelligence, Strength, Speed, Durability, Power)
- 2+ powers

This meets **Req. 19** publication requirements:
✅ Publisher assigned
✅ Alignment assigned
✅ 3+ attributes (we have exactly 5)
✅ 2+ powers (we have 2-3 per hero)

## Data Mapping

### From databasestar → Our Entities

| databasestar | Our Entity | Notes |
|---|---|---|
| `superhero.publisher` | `Publisher` | IDs preserved (1-25) |
| `superhero.alignment` | `Alignment` | IDs preserved (1-4) |
| `superhero.superhero` | `Hero` | UUIDs generated, status set to PUBLISHED |
| `superhero.hero_attribute` | `Attribute` | Values 0-100 |
| `superhero.hero_power` | `Power` | Mapped to hero IDs |

## Sample Data Details

### Heroes Included (25 total)
1. **3-D Man** - Marvel, Good, 3-D vision
2. **A-Bomb** (Rick Jones) - Marvel, Good, Hulk form
3. **Abe Sapien** - Dark Horse, Good, Aquatic
4. **Abin Sur** - DC, Good, Green Lantern predecessor
5. **Abomination** - Marvel, Bad, Emil Blonsky
6. **Abraxas** - Marvel, Bad, Cosmic
7. **Adam Strange** - DC, Good, Alien tech
8. **Animal Man** - DC, Good, Animal communication
9. **Ant-Man** - Marvel, Good, Size manipulation
10. **Apocalypse** - Marvel, Bad, En Sabah Nur
11. **Aquaman** - DC, Good, Ocean mastery
12. **Batman** - DC, Good, Detective genius
13. **Beast** (Hank McCoy) - Marvel, Good, Intellectual
14. **Black Panther** - Marvel, Good, T'Challa
15. **Black Widow** - Marvel, Good, Espionage
16. Plus 10+ others from Marvel and DC

### Attribute Value Distribution
- **Intelligence**: Range 75-100 (genius-level heroes)
- **Strength**: Range 75-100 (superhuman strength)
- **Speed**: Range 75-95 (above-human reflexes)
- **Durability**: Range 70-100 (from resistant to invulnerable)
- **Power**: Range 75-100 (energy/ability level)

## Integration with Your API

After seeding, test with real endpoints:

```bash
# Get all published heroes (from seed)
curl -X GET http://localhost:3000/api/v1/reports/heroes \
  -H "Authorization: Bearer <your-token>"

# Battle between Marvel and DC
curl -X GET "http://localhost:3000/api/v1/battles?publisherAId=13&publisherBId=4" \
  -H "Authorization: Bearer <your-token>"

# Filter heroes by alignment
curl -X GET "http://localhost:3000/api/v1/reports/heroes?alignment=Good" \
  -H "Authorization: Bearer <your-token>"
```

## Extending the Seed

To add more heroes to the seed, modify the `HEROES_DATA` array in `hero.seed.ts`:

```typescript
const HEROES_DATA = [
  // ... existing heroes ...
  {
    id: 200,
    name: 'Spider-Man',
    fullName: 'Peter Parker',
    publisherId: 13, // Marvel
    alignmentId: 1,  // Good
    heightCm: 178,
    weightKg: 75,
  },
];

// Add corresponding attributes
const HERO_ATTRIBUTES_MAP: { [key: number]: { [key: string]: number } } = {
  // ... existing ...
  200: { Intelligence: 90, Strength: 80, Speed: 85, Durability: 75, Power: 85 },
};

// Add corresponding powers
const HERO_POWERS_MAP: { [key: number]: string[] } = {
  // ... existing ...
  200: ['Web', 'Wall-Crawl'],
};
```

Then run: `npm run seed`

## Troubleshooting

### Error: "Connection refused"
Ensure PostgreSQL is running:
```bash
docker-compose up -d postgres
```

### Error: "relation 'publishers' does not exist"
Run migrations first:
```bash
npm run migration:run
npm run seed
```

### Error: "Unique constraint violation"
The seed checks for existing data. If you have partial data, either:
1. Delete the database and restart:
   ```bash
   docker-compose down -v
   docker-compose up -d
   npm run migration:run
   npm run seed
   ```
2. Or manually delete from tables and re-run seed

### Heroes not appearing in reports
Heroes are seeded with `status: PUBLISHED`, so they should appear. Verify with:
```sql
SELECT COUNT(*) FROM heroes WHERE status = 'PUBLISHED';
```

## Source

All data comes from:
- **Official databasestar repository**: https://github.com/bbrumm/databasestar
- **License**: Generally open for educational use
- **Last updated**: Data current as of 2024

## Notes

- IDs are carefully mapped to match the original databasestar database where applicable
- Heroes are all created with PUBLISHED status for immediate availability in reports and battles
- Soft delete is never used in the seed (deleted_at remains NULL)
- All relationships are correctly established at creation time

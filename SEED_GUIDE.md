# 🌱 Quick Seed Guide

## What Was Created

✅ **3 new files** in `src/database/postgres/seeds/`:
1. `hero.seed.ts` - Real superhero data (25 heroes, 125 attributes, 50+ powers)
2. `run-seed.ts` - CLI executable for the seed
3. `README.md` - Complete documentation

✅ **1 script added** to `package.json`:
```json
"seed": "ts-node src/database/postgres/seeds/run-seed.ts"
```

## Quick Start

### Step 1: Prepare Database
```bash
# Start PostgreSQL and MongoDB
docker-compose up -d

# Run migrations to create tables
npm run migration:run
```

### Step 2: Run Seed
```bash
# Populate database with real superhero data
npm run seed
```

Expected output:
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

### Step 3: Verify
```bash
# Start API
npm run start:dev

# In another terminal, test the reports endpoint
curl -X GET http://localhost:3000/api/v1/reports/heroes?page=1&limit=5 \
  -H "Content-Type: application/json"
# Should return published heroes from the seed
```

## What Gets Seeded

| Entity | Count | Details |
|--------|-------|---------|
| **Publishers** | 25 | Marvel, DC, Dark Horse, Image, etc. |
| **Alignments** | 4 | Good, Bad, Neutral, N/A |
| **Heroes** | 25 | Batman, Superman, Spider-Man, Iron Man, etc. |
| **Attributes** | 125 | 5 per hero (Intelligence, Strength, Speed, Durability, Power) |
| **Powers** | 50+ | 2-3 per hero (Flight, Telepathy, Technology, etc.) |

## Sample Heroes

### Marvel Characters (Publisher ID: 13)
- 3-D Man, A-Bomb, Ant-Man, Apocalypse, Beast, Beta Ray Bill, Black Panther, Black Widow
- Abomination, Black Cat, Black Knight, and more

### DC Characters (Publisher ID: 4)
- Aquaman, Batman, Batgirl II, Black Adam, Black Canary, Atom II, Abin Sur, Adam Strange, Animal Man
- And more

## Data Quality

✅ All data from official databasestar superhero database
✅ Real hero names and attributes
✅ Balanced alignments (Good, Bad, Neutral)
✅ Reasonable attribute values (0-100 scale)
✅ Complete power sets (2+ per hero)

## Idempotent & Safe

The seed checks for existing data before inserting. You can safely run it multiple times:

```bash
# Safe to run - won't duplicate if data already exists
npm run seed
npm run seed  # ← no duplicates
```

## Troubleshooting

### "Connection refused"
PostgreSQL not running:
```bash
docker-compose up -d postgres
```

### "relation 'publishers' does not exist"
Migrations not run:
```bash
npm run migration:run
npm run seed
```

### "Unique constraint violation"
Partial seed data exists. Clean and restart:
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d
npm run migration:run
npm run seed
```

## Next: Test Your API

After seeding, test endpoints:

```bash
# 1. Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "name": "John Hero",
    "email": "john@heroes.com",
    "password": "SecurePass123!"
  }'

# 2. Login to get JWT token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "cpfOrEmail": "12345678901",
    "password": "SecurePass123!"
  }'

# 3. Get reports with token
TOKEN="<jwt-token-from-login>"
curl -X GET "http://localhost:3000/api/v1/reports/heroes?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 4. Test battles (Marvel vs DC)
curl -X GET "http://localhost:3000/api/v1/battles?publisherAId=13&publisherBId=4" \
  -H "Authorization: Bearer $TOKEN"
```

## Files Reference

### hero.seed.ts (400 lines)
- Contains all data arrays
- Exports `runHeroSeed()` function
- Idempotent checks
- Console output with emojis

### run-seed.ts (40 lines)
- Simple CLI entry point
- Creates TypeORM connection
- Calls runHeroSeed()
- Closes connection cleanly

### README.md (200+ lines)
- Detailed documentation
- Data structure examples
- Troubleshooting guide
- Extension instructions

## Sample Seed Output (Full)

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

---

For more details, see: `src/database/postgres/seeds/README.md`

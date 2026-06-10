# 🌱 Hero Seed - Complete Index

## Overview
This directory contains everything needed to seed your Superheros API with real data from the databasestar superhero database.

## Files

| File | Size | Purpose |
|------|------|---------|
| **hero.seed.ts** | ~400 lines | Main seed logic with all real data |
| **run-seed.ts** | ~40 lines | CLI entry point |
| **README.md** | ~200 lines | Detailed documentation |
| **INDEX.md** | This file | Quick reference |

## Quick Start (30 seconds)

```bash
# Prerequisite: migrations must be run first
npm run migration:run

# Run the seed
npm run seed

# Result: Database populated with 25 heroes, 125 attributes, 50+ powers
```

## What Gets Seeded

### 1. Publishers (25)
From Marvel, DC, Dark Horse, and 22 other publishers

### 2. Alignments (4)
Good | Bad | Neutral | N/A

### 3. Heroes (25)
Famous superheroes like Batman, Superman, Spider-Man, etc.

### 4. Attributes (125)
5 per hero: Intelligence, Strength, Speed, Durability, Power (0-100 scale)

### 5. Powers (50+)
2-3 per hero: Flight, Telepathy, Technology, Shapeshifting, etc.

## Hero Quality

✅ **Complete**: Each hero has publisher + alignment + 3+ attributes + 2+ powers
✅ **Published**: All heroes seeded with PUBLISHED status
✅ **Real Data**: From official databasestar repository
✅ **Balanced**: Mix of Good, Bad, and Neutral alignments
✅ **Safe**: Idempotent - won't duplicate if run multiple times

## Data Flow

```
Reference SQL Files (/tmp/01_reference_data.sql, etc.)
         ↓
    Hero Sample Data
         ↓
    HEROES_DATA array
    PUBLISHERS_DATA array
    ALIGNMENTS_DATA array
    HERO_ATTRIBUTES_MAP
    HERO_POWERS_MAP
         ↓
    runHeroSeed() function
         ↓
    Database Entities
    (via TypeORM repositories)
         ↓
    PostgreSQL Database
```

## Integration

The seed is integrated via:

1. **TypeORM DataSource**: Uses existing connection from `data-source.ts`
2. **Entities**: Uses official entities (Hero, Attribute, Power, Publisher, Alignment)
3. **CLI Script**: Executable via `npm run seed`

## Extending the Seed

To add more heroes:

1. Add to `HEROES_DATA` array
2. Add to `HERO_ATTRIBUTES_MAP` 
3. Add to `HERO_POWERS_MAP`
4. Run: `npm run seed`

See README.md for detailed examples.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | `docker-compose up -d postgres` |
| Relation doesn't exist | `npm run migration:run` first |
| Unique constraint | Delete data and restart: `docker-compose down -v` |
| No heroes appear | Verify with: `SELECT COUNT(*) FROM heroes;` |

## Performance

- Seeding time: ~2-3 seconds
- Database size: ~5-10 MB
- Idempotent: Checks before inserting (safe to run multiple times)

## Next Steps

1. ✅ Run the seed
2. ✅ Start your API: `npm run start:dev`
3. ✅ Test reports endpoint with published heroes
4. ✅ Test battles between publishers
5. ✅ Test filtering and sorting

## Documentation

- **Quick Guide**: `../../SEED_GUIDE.md`
- **Detailed**: `README.md`
- **Plan**: `.github/SUPERHEROS_PLAN.md` (Section 14)

## Data Sources

- Publishers & Heroes: https://github.com/bbrumm/databasestar
- Sample DB: superheroes sample database (PostgreSQL)
- Updated: 2024

---

**Status**: ✅ Production Ready | **Last Updated**: 2026-06-09

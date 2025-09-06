# Seeding & Migrations in TypeORM

1. How migrations work in TypeORM (quick tour)

Migrations are versioned scripts that move your DB schema forward (up) and back (down). They’re generated from your entities or written by hand, then executed via the CLI. Since v0.3+, TypeORM uses a DataSource file (no ormconfig.json).

migration:create makes an empty file; migration:generate diffs your entities → SQL; migration:run applies pending migrations; migration:revert rolls back the last one. Note that run/revert operate on compiled JS unless you invoke the ts-node wrapper.

1. Minimal setup

Install deps

```bash
npm i typeorm pg
npm i -D ts-node typescript

```

src/data-source.ts

```tsx
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'mydb',
  entities: [User],
  migrations: ['dist/migrations/*.js'], // compiled JS
  // synchronize: false  // keep this OFF for prod; use migrations instead
});

```

(Keep synchronize off in real environments; it can drop/alter tables unexpectedly. Use migrations instead.)

package.json (handy scripts)

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typeorm": "typeorm",
    "mig:gen": "typeorm migration:generate src/migrations/Auto -d src/data-source.ts",
    "mig:create": "typeorm migration:create src/migrations/Named",
    "mig:run": "typeorm-ts-node-commonjs migration:run -d src/data-source.ts",
    "mig:revert": "typeorm-ts-node-commonjs migration:revert -d src/data-source.ts",
    "seed": "ts-node src/seed.ts"
  }
}

```

Using typeorm-ts-node-commonjs lets you run .ts migrations without pre-compiling; otherwise compile to JS and run migration:run against dist.

1. Create a new migration and apply it
    
    A. Define an entity (example)
    

```tsx
// src/users/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) email!: string;
  @Column() name!: string;
  @Column({ default: true }) isActive!: boolean;
}

```

B. Generate the migration (diff from entities)

```bash
# generates src/migrations/<timestamp>-Auto.ts
npm run mig:gen

```

This inspects metadata from your DataSource + entities and writes up/down SQL.

C. Run it

```bash
# run directly with ts-node wrapper
npm run mig:run
# or compile first, then:
npm run build
npx typeorm migration:run -d dist/data-source.js

```

You’ll now have a migrations table recording what ran.

1. Sample seed data into PostgreSQL (with repositories)

There isn't "official" seed shipping by TypeORM; the simplest way is an ad-hoc script booting your DataSource with the help of repositories. (There are community libraries like typeorm-seeding or typeorm-extension, but the script keeps the solution straightforward.)

src/seed.ts

```tsx
import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User } from './users/user.entity';

async function main() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const data = [
    { email: 'alice@example.com', name: 'Alice' },
    { email: 'bob@example.com',   name: 'Bob'   },
    { email: 'carol@example.com', name: 'Carol' }
  ];

  await userRepo.save(userRepo.create(data));

  console.log('Seed complete');
  await AppDataSource.destroy();
}

main().catch(async (e) => {
  console.error(e);
  try { await AppDataSource.destroy(); } catch {}
  process.exit(1);
});

```

Run it:

```bash
npm run seed

```

If you prefer libraries with factories/fixtures, look at typeorm-seeding or typeorm-extension.

1. Rollbacks (undo change)

Revert the last migration:

```bash
npm run mig:revert

```

It runs the down method on the most recently applied migration and removes the migration from the migrations table. Repeat to go back several versions (LIFO).

Reverting an individual olders migration isn't directly supported out-of-order; you revert typically step-by-step back to it, or author an additional fixer migration. (There are community threads discussing the workaround, but the official flow is linear.)

1. Foot-guns & tips

TS vs JS migrations: run/revert simply executes the compiled JS; use the typeorm-ts-node-commonjs wrapper to "directly" run the TS during dev.

Maintain the synchronize:.false in all the shared/dev/prod DBs to prevent drift & data loss; rely on migrations instead.

Point -d always at your DataSource file during generating/running, so the CLI knows the entities/migrations & the connection.

## Reflection

## 1. Purpose of Database Migrations in TypeORM

**Definition.** A migration is a versioned script describing a deterministic transition of the database schema from state N → N+1 (up) and the inverse (down). TypeORM records applied migrations in a tracking table so every environment (dev/CI/stage/prod) can replay the exact same sequence.

**Why they exist.**

- Determinism: Replace ad-hoc manual SQL with scripted, reviewable changes.
- Safety: Each change has an undo path (down) for controlled rollback.
- Coordination: Application code and schema evolve together; deployments become reproducible.
- Auditability: The history of structural changes is visible in Git and in the DB’s migration log.

**Life cycle.**

1. Author (hand-written) or generate (diff from entities) a migration.
2. Run it against the target DB; TypeORM marks it as executed.
3. Revert if necessary using the down method (LIFO order).

---

## 2. How Migrations Differ from Seeding

| Aspect | Migrations | Seeding |
| --- | --- | --- |
| Focus | Schema/structure (tables, columns, constraints, indexes) | Data/content (fixtures, reference rows, demo records) |
| When used | Anytime the structure must change | For initial lookups (countries/roles), sample/dev data, or bootstrap admin user |
| Source of truth | Must be version-controlled and reviewed | Often scripts or factories; may differ per environment |
| Idempotency | Enforced by migration tracking; up/down are exact | Should be designed idempotent (e.g., UPSERT/“do nothing if exists”) |
| Placement | src/migrations/*.ts | Separate scripts (src/seed.ts) or factory frameworks |

**Practical guidance.**

- Keep seeding out of schema migrations unless it is immutable reference data your app requires to boot (e.g., roles). Otherwise, use a dedicated seeding script or factory library.
- Make seeds idempotent (e.g., INSERT. ON CONFLICT DO NOTHING) so reruns are safe.

---

## 3. Why Version-Control Schema Changes

- Environment Consistency: Every database moves through the same ordered set of changes; no “works on my machine” schemas.
- Code–DB Synchronization: Migrations in the same PR as entity changes ensure runtime code matches the deployed schema.
- Review & Traceability: Changes are human-readable and diffable in Git; helpful commit messages document intent.
- Automated Delivery: CI can spin up a clean DB, run migrations, and run tests—catching breakage early.
- Compliance & Audits: A clear, immutable history of structural changes supports audit needs.

**Team policy (recommended).**

- synchronize: false in all shared environments.
- Migration files are never edited after merge; follow-up fixes get new migrations.
- One PR = entity changes plus the generated migration; reviewers read both.

---

## 4. How to Roll Back a Migration If an Issue Occurs

### 4.1 Standard rollback (last migration only)

**Command:** `npm run mig:revert`

**Effect:** Applies down the most recent migration applied and purges its record written in the migrations table.

Repeat to reverse several versions (LIFO).

### 4.2 Rolling back to an earlier point

TypeORM reverses sequentially. To get to migration K, keep going back until before K+1.

Do not delete or remant old migration files already applied in shared environments.

If the broken change is mid-history and you can't roll back (e.g., prod data constraints), deploy an new fixup migration that puts back the wanted invariant.

### 4.3 Unsustainable/unsafe rollbacks

Certain actions can't reverse exactly (e.g., dropping a column with no rollback strategy). In these scenarios:

Select expand–migrate–contract (a.k.a. "expand/contract"):

- Expanding: Add brand-new structure (Nullable column, new table).
- Migrate data: Backfill by chunks.
- Contracting: After-code flips over, delete old columns/constraints.

Commit data backups and, for dangerous transformations, make changes inside an transaction when natively safe and supported.

### 4.4 Operational checklist

- Ensure the DataSource the CLI points to points to the DB you're targeting.
- Ensure JS vs TS compile-time vs runtime is in sync with the scripts.
- Ensure no pending-code depends on an schema you're gonna revert.
- In-production: Announce downtime/maintenance windows when required.

---

## 5. Concrete Examples

### 5.1 Typical migration (hand-curated example)

```tsx
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsers1700000000000 implements MigrationInterface {
  name = 'AddUsers1700000000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" TEXT UNIQUE NOT NULL,
        "name"  TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true
      )
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_user_email ON "user" ("email")`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_user_email`);
    await qr.query(`DROP TABLE IF EXISTS "user"`);
  }
}

```

### 5.2 Idempotent seed (separate script)

```tsx
// src/seed.ts
import { AppDataSource } from './data-source';
import { User } from './users/user.entity';

async function run() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);

  await repo.query(`
    INSERT INTO "user" ("email","name","isActive")
    VALUES
      ('alice@example.com','Alice',true),
      ('bob@example.com','Bob',true),
      ('carol@example.com','Carol',true)
    ON CONFLICT ("email") DO NOTHING
  `);

  await AppDataSource.destroy();
}
run().catch(async (e) => { console.error(e); try { await AppDataSource.destroy(); } catch {} process.exit(1); });

```

### 5.3 Rollback usage (scripts)

```bash
# Apply pending migrations
npm run mig:run

# Revert last migration
npm run mig:revert

# Re-apply after fix
npm run mig:run

```

---

## 6. Best Practices & Anti-Patterns

**Best practices**

- Treat migrations as source code: name them clearly, review them carefully.
- Keep changes small and focused; avoid multi-feature mega-migrations.
- Use transactions in migrations where possible to keep DB consistent.
- For heavy data moves, consider batched backfills and locking awareness.

**Anti-patterns to avoid**

- Enabling synchronize: true in shared/prod DBs.
- Embedding volatile sample data inside schema migrations.
- Rewriting past migrations to “fix history.”
- Running migrations against the wrong DataSource/DB.
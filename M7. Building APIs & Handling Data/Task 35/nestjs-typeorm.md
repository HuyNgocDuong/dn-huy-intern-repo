# Connecting to PostgreSQL with TypeORM in NestJS

1. Research: how @nestjs/typeorm integrates with NestJS

Nest provides first-class integration via TypeOrmModule. You configure a connection in the root module with forRoot()/forRootAsync(), and register entity repositories per feature module with forFeature(). Repositories are injected with @InjectRepository(), which is what makes database access feel “Nest-native.”

NestJS Documentation

Migration classes are managed by the TypeORM CLI (outside Nest’s DI). You run them via CLI using your DataSource config; Nest docs explicitly note that migrations don’t participate in DI.

NestJS Documentation

---

1. Set up a PostgreSQL connection in NestJS

Install

```bash
npm i @nestjs/typeorm typeorm pg

```

app.module.ts (simple, static config)

```tsx
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'appdb',
      autoLoadEntities: true,    // pulls entities registered via forFeature()
      synchronize: false,        // keep OFF in shared/prod envs
    }),
    UsersModule,
  ],
})
export class AppModule {}

```

autoLoadEntities simplifies wiring; Nest docs also warn against synchronize: true in production.

NestJS Documentation

(If you prefer env-driven config, use forRootAsync(); Nest supports async config factories.

NestJS Documentation)

---

1. Create an entity & repository

src/users/user.entity.ts

```tsx
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ default: true })
  isActive!: boolean;
}

```

(TypeORM entities map class fields to table columns with @Entity() & @Column().)

typeorm.io

src/users/users.module.ts

```tsx
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // registers Repository<User>
  providers: [UsersService],
  controllers: [UsersController],
  exports: [TypeOrmModule],
})
export class UsersModule {}

```

Registering entities via forFeature exposes their repositories for DI (i.e., @InjectRepository(User)).

NestJS Documentation

---

1. Perform CRUD with TypeORM (service + controller)

src/users/users.service.ts

```tsx
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

type CreateUserDto = { email: string; name: string };
type UpdateUserDto = Partial<CreateUserDto> & { isActive?: boolean };

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  create(dto: CreateUserDto) {
    const user = this.repo.create(dto);     // new entity (not persisted)
    return this.repo.save(user);            // INSERT
  }

  findAll() {
    return this.repo.find();                // SELECT *
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({ where: { id } }); // SELECT. WHERE id
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const preloaded = await this.repo.preload({ id, .dto }); // merge + validate exists
    if (!preloaded) throw new NotFoundException('User not found');
    return this.repo.save(preloaded);        // UPDATE
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.repo.remove(user);            // DELETE (entity form)
    return { deleted: true };
  }
}

```

(These methods rely on the standard Repository API: create, save, find, findOne, preload, remove.)

typeorm.io

TypeORM

src/users/users.controller.ts (optional HTTP endpoints)

```tsx
import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post() create(@Body() dto: any)            { return this.users.create(dto); }
@Get()  findAll()                           { return this.users.findAll(); }
  @Get(':id') findOne(@Param('id') id: string){ return this.users.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: any) {
    return this.users.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}

```

---

1. Migrations in a NestJS project (TypeORM 0.3+)

Where they live: in your repo (e.g., src/migrations), executed by the TypeORM CLI, separate from Nest DI.

NestJS Documentation

How to run: with a DataSource file. The CLI can run compiled .js migrations or .ts with the ts-node wrapper.

typeorm.io

src/data-source.ts (for CLI)

```tsx
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'appdb',
  entities: [User],
  migrations: ['dist/migrations/*.js'], // or 'src/migrations/*.ts' when using ts-node wrapper
});

```

package.json scripts

```json
{
  "scripts": {
    "mig:create": "typeorm migration:create src/migrations/Init",
    "mig:gen": "typeorm migration:generate src/migrations/Auto -d src/data-source.ts",
    "mig:run": "typeorm-ts-node-commonjs migration:run -d src/data-source.ts",
    "mig:revert": "typeorm-ts-node-commonjs migration:revert -d src/data-source.ts"
  }
}

```

(TypeORM CLI behavior re: .ts vs .js migrations and the -d DataSource flag.)

typeorm.io

---

1. Why PostgreSQL for your Nest app? (quick, practical wins)

JSONB columns: store semi-structured data with indexes & operators—handy when your DTOs have optional, evolving fields.

PostgreSQL

Full-Text Search out of the box for “search this content” features without bolting on a separate engine.

PostgreSQL

+1

MVCC & ACID: strong consistency + high concurrency, which keeps app behavior predictable under load.

PostgreSQL

ChatGPT can make mistakes. Check important info.

## Reflection

1. How does @nestjs/typeorm simplify database interactions?

Nest DI integration. Configure once with TypeOrmModule.forRoot()/forRootAsync(), then expose repositories per feature using TypeOrmModule.forFeature([Entity]). Inject with @InjectRepository(Entity) (and @InjectDataSource, @InjectEntityManager when needed).

Lifecycle & config. Connection is created, reused, and closed by Nest—no manual bootstrapping. Supports env-driven async config.

Testing-friendly. Repositories are providers, so they’re easy to mock/override in TestingModule.

Entity auto-registration. autoLoadEntities: true can reduce module wiring in small/medium apps.

1. What is the difference between an entity and a repository in TypeORM?

Entity (what your data is).

A class annotated with @Entity() whose properties (with @Column(), @PrimaryGeneratedColumn(), relations, indices, constraints) map to table structure. It describes schema and relationships.

Repository (how you access data).

A typed data-access façade for one entity. Provides CRUD and querying (create, save, find, findOne, preload, remove, query builder). In Nest, repositories are injected, keeping services thin and testable.

1. How does TypeORM handle migrations in a NestJS project?

Authored and executed via the TypeORM CLI. Migrations are not Nest providers and don’t use DI.

DataSource-driven. Keep a data-source.ts (or compiled dist/data-source.js) that lists entities and migrations. CLI commands reference it with -d.

Typical scripts.

Generate from entity diffs: typeorm migration:generate src/migrations/Auto -d src/data-source.ts

Apply: typeorm-ts-node-commonjs migration:run -d src/data-source.ts (or compile then run JS)

Revert: typeorm-ts-node-commonjs migration:revert -d src/data-source.ts

Operational guidance.

Set synchronize: false in shared/prod envs. Treat migrations as source-controlled, reviewed change sets. For prod safety, design expand→migrate→contract steps and make data moves idempotent/batched.

1. What are the advantages of using PostgreSQL over other databases in a NestJS app?

Flexible schemas with safety. JSONB for semi-structured fields with indexes/operators, plus strong relational constraints (FKs, checks, partial/expressional indexes).

Built-in search & analytics. Full-text search, window functions, CTEs—often avoiding extra services for many use cases.

Reliability under load. ACID transactions, MVCC concurrency, transactional DDL—predictable behavior and safer deploys.

Powerful extensions. pg_trgm for fuzzy matching, PostGIS for geospatial, uuid-ossp/gen_random_uuid(), citext, etc.

Developer ergonomics. Native UPSERT (ON CONFLICT), generated columns, rich SQL, great tooling—maps cleanly to TypeORM features (UUIDs, enums, relations).
# Handling Environment Variables & Configuration in NestJS

## **Set up an `.env` file to manage environment variables securely**

![image.png](image.png)

## 1) NestJS configuration with `@nestjs/config`

### What it provides

- Loads variables from your environment (and optionally from `.env` files).
- Typed, centralized access to settings via a `ConfigService`.
- Namespaced configs (`registerAs`) and config factories (`load`).
- Validation hook built-in with `validationSchema`.
- Caching and variable expansion.

### Minimal setup

```tsx
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,            // exposes ConfigService to the entire app
      cache: true,               // stores lookups (perf)
      expandVariables: true,     // unrolls NEST_DB_URL="postgres://${DB_USER}:${DB_PASS}@..."
      // envFilePath: ['.env.local', '.env'], // optional, if you use files
    }),
  ],
})
export class AppModule {}

```

### Using `ConfigService`

```tsx
// anywhere (controller/service/guard)
import { ConfigService } from '@nestjs/config';

constructor(private readonly config: ConfigService) {}

const port = this.config.get<number>('PORT', 3000);             // with default
const dbUrl = this.config.getOrThrow<string>('DATABASE_URL');   // throws if missing

```

### Namespacing with `registerAs`

```tsx
// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
}));

```

```tsx
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import database from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [database], // later: config.get('database.url')
    }),
  ],
})
export class AppModule {}

```

---

## 2) Validating Environment Variables in NestJS

Fail early on boot when required variables do not exist or are invalid. The two popular options are **Joi** (built-in choice) or a custom function (e.g., Zod/envalid).

```tsx
// src/app.module.ts
import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
        PORT: Joi.number().port().default(3000),
        DATABASE_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        DB_POOL_SIZE: Joi.number().integer().min(1).default(10),
      }),
      validationOptions: {
        abortEarly: false,   // report all issues, not just the first
        allowUnknown: true,  // don't worry about extraneous envs if you don't
      },
    }),
  ],
})
export class AppModule {}

```

**Tip for use:** Prefer `getOrThrow` when reading mandatory vars:

```tsx
const secret = this.config.getOrThrow<string>('JWT_SECRET');

```

---

## 3) Why You Should Not Commit Secrets to Version Control

### Risks

- **Immediate compromise:** Anyone who has repo access (or any fork/mirror/CI logs) can see your secrets.
- **Supply-chain blast radius:** Dumps keys will commonly provide lateral motion (DB exfiltration, queue access, blob storage).
- **Long-lived exposure:** Git history is forever; removing a leaked secret requires **revocation + rotation**, not a revert.
- **Compliance & liability:** Violates basic security policy (12-factor), can trigger incident response and legal reporting.

### Recommended Practices

**Use a secrets manager**

AWS Secrets Manager / Parameter Store, GCP Secret Manager, Azure Key Vault, HashiCorp Vault, Doppler, 1Password Secrets Automation, etc.

Inject secrets at runtime through the platform (Kubernetes Secrets/External Secrets, ECS task defs, GitHub Actions/OIDC + cloud IAM).

**Never commit real secrets**

Add `.env` to `.gitignore`.

Include a `.env.example` with **placeholder only** (no actual values).

**Limit scope & rotate**

Least privilege principle (a key per service and environment).

Regular rotation; rotate as soon as possible in case you think you've been compromised.

**Guardrails**

Pre-commit scanning (gitleaks, trufflehog).

CI scanners on PRs.

Alerting on suspicious usage of secrets.

**Environment segregation**

Credentials separate for dev, staging, prod.

Do not reuse secrets between environments.

## Reflection

# How does `@nestjs/config` assist with environment variables for configuring and executing your application?

**Loads env into your app**: `ConfigModule.forRoot()` loads from the current environment and (optionally) `.env*` files.

**Typed, centralized access**: `ConfigService` provides you with `config.get<'type'>('KEY')` anywhere (with DI).

**Namespacing**: `registerAs('db', () => ({ host: … }))` keeps related settings together and keys clean.

**Validation hook**: built-in `validationSchema` (Joi) or `validate` function to reject invalid configs on boot.

**Variable expansion & caching**: `expandVariables: true` enables `${VAR}` references to function; `cache: true` speeds up lookups.

```tsx
// app.module.ts
import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      // envFilePath: ['.env.local', '.env'], // optional
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development','test','production').required(),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().uri().required(),
      }),
    }),
  ],
})
export class AppModule {}

```

Use it anywhere:

```tsx
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}
  port = this.config.get<number>('PORT', 3000);
}

```

---

# Why secrets should never be stored in source code

**Risk of exposure**: Repos get forked, cloned, emailed, or posted unintentionally; history never passes away.

**Blast radius**: One leak exposes all environments to that secret.

**Compliance**: Breaks best practices (SOC 2, ISO 27001, PCI DSS).

**Rotation headache**: Code updates and redeployments for hardcoded secrets.

**Improved alternatives**:

- Inject at runtime through environment variables in your orchestrator (Docker/K8s), CI/CD secret stores.
- Use a secrets manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, Doppler, 1Password) and load on boot.
- Restrict permissions with IAM/KMS and log accesses.

---

# How to check environment variables before the app boot

Crash hard with a schema so the app never boots with bad config.

**Option A — Joi (built-in path):**

```tsx
ConfigModule.forRoot({
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development','test','production').required(),
    PORT: Joi.number().integer().min(1).max(65535).required(),
    DATABASE_URL: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(32).required(),
  }),
});

```

**Option B — Custom validate() (for custom errors/transforms, or Zod if you prefer):**

```tsx
import { z } from 'zod';

function validateEnv(cfg: Record<string, unknown>) {
  const schema = z.object({
    NODE_ENV: z.enum(['development','test','production']),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  });

  const parsed = schema.safeParse(cfg);
  if (!parsed.success) {
    // Show a human-readable error and end the process
    throw new Error('❌ Invalid env:\n' + JSON.stringify(parsed.error.format(), null, 2));
  }
  return parsed.data;
}

ConfigModule.forRoot({ isGlobal: true, validate: validateEnv });

```

---

# How to split configuration for multiple environments (local vs production)

Pick any combination that fits your deployment plan:

**A) Multiple env files + NODE_ENV**

```tsx
const env = process.env.NODE_ENV ?? 'development';
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [`.env.${env}.local`, `.env.${env}`, '.env'],
});

```

**Example files:**

- `.env.development` (local defaults)
- `.env.test` (CI)
- `.env.production` (staging/prod fallback; typically empty if using a secrets manager)

Precedence left→right: priority goes to first encountered file for all keys.

---

**B) Namespaced configs per environment**

```tsx
// config/database.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    url: process.env.DATABASE_URL!,
    ssl: isProd,           // enable/disable per env
    poolSize: isProd ? 20 : 5,
  };
});

// app.module.ts
ConfigModule.forRoot({ load: [databaseConfig] });

```

---

**C) Orchestrator-driven (recommended for prod)**

Don’t deploy `.env` to prod. Kubernetes/Docker/CI inject environment variables or mount secrets at runtime.

Your code doesn’t change; only the deployment provides different values.

---

**D) Conditional modules/providers**

```tsx
const isProd = process.env.NODE_ENV === 'production';
@Module({
  providers: [
    { provide: 'CACHE_TTL', useValue: isProd ? 300 : 5 },
  ],
})
export class AppModule {}

```
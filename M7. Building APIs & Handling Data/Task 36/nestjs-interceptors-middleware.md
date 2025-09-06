# Using Interceptors & Middleware in NestJS

# 1) Interceptors vs. Middleware (what to use when)

**Middleware**

Runs before the route handler at the platform layer (Express/Fastify). Great for cross-cutting concerns that don’t need Nest’s method metadata: request logging, CORS, raw auth libraries, body munging, etc. Applied via `MiddlewareConsumer` in a module (class/function style), or `app.use()` for plain Express/Fastify middleware.

**Interceptors**

Wrap a controller/route method and can run before & after it. They can transform the result, bind to metadata, and work with RxJS (`handle().pipe(.)`). Perfect for response mapping/serialization, timing, caching, and error/response shaping. Scope: method, controller, or global.

**Pipeline order (simplified)**

Middleware → Guards → Interceptors (before) → Pipes → Handler → Interceptors (after) → Exception filters. Use this to decide where logic belongs.

---

# 2) Built-in: ClassSerializerInterceptor

ClassSerializerInterceptor uses class-transformer to convert returned class instances into plain objects and obey decorators like `@Exclude()`, `@Expose()`, and `@Transform()`. You can apply it per-route, per-controller, or globally.

**Example DTO/entity**

```tsx
import { Exclude, Expose, Transform } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  @Expose()
  get fullName() { return `${this.firstName} ${this.lastName}`; }

  @Transform(({ value }) => value?.name)
  role?: { name: string };
  constructor(partial: Partial<UserEntity>) { Object.assign(this, partial); }
}

```

**Controller usage**

```tsx
import { Controller, Get, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  @Get()
  findOne() {
    return new UserEntity({ id: 1, firstName: 'Ada', lastName: 'Lovelace', password: 'secret' });
  }
}

```

**Global usage (recommended)**

```tsx
// main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(3000);
}
bootstrap();

```

(The global pattern above is the standard way shown in docs/discussions.)

---

# 3) Implement a simple logging interceptor

Logs method, URL, status (via after hook), and duration. Because interceptors see the handler’s result, you can log both success and errors in one place.

```tsx
// logging.interceptor.ts
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest<Request & { method: string; url: string }>();
    const { method, url } = req as any;
    const start = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${url} -> ${ms}ms`);
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        this.logger.error(`${method} ${url} FAILED -> ${ms}ms`, err?.stack);
        throw err;
      }),
    );
  }
}

```

**Apply it**

```tsx
// per-controller
@UseInterceptors(LoggingInterceptor)

// or global in main.ts
app.useGlobalInterceptors(new LoggingInterceptor());

```

(Interceptors use `tap()` to hook after the observable completes.)

---

# 4) Create middleware & apply globally/specific routes

## a) Class-based middleware

```tsx
// logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    console.log(`[MW] ${req.method} ${req.originalUrl}`);
    next();
  }
}

```

**Register on routes (module-scoped)**

```tsx
// app.module.ts
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';
import { UsersController } from './users.controller';

@Module({ controllers: [UsersController] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.GET }, // only GET /users
      );
  }
}

```

(Use `MiddlewareConsumer` and `RequestMethod` to target specific paths/methods.)

## b) Apply to all routes

If it’s class-based Nest middleware, you can:

```tsx
consumer.apply(LoggerMiddleware).forRoutes('*');

```

If it’s a plain Express/Fastify function (e.g., `helmet()`, `cookieParser()`), apply in `main.ts`:

```tsx
// main.ts
import helmet from 'helmet';
app.use(helmet());

```

(Using `app.use()` is the idiomatic way for platform-level middleware.)

## Reflection

## **Interceptor vs Middleware in NestJS**

### **Middleware**

- Executed before the route handler (controller) is called.
- Works at the request/response level, just like Express middleware.
- Typically used for:
    - Request logging.
    - Auth checks.
    - Setting/changing request properties.
    - Rate limiting.
- Middleware does not easily get access to the execution context (controller, handler, return values).

### **Interceptor**

- Executed before and/or after the route handler is called.
- Works at the controller/handler level, in addition to Nest's request lifecycle.
- Can:
    - Transform request/response data.
    - Inject additional logic before or after the controller method being called.
    - Apply cross-cutting concerns (caching, performance profiling, logging).
    - Attach more logic onto the returned observables with RxJS operators (i.e., `map`, `catchError`).

---

## **When to Use an Interceptor Instead of Middleware**

- Use middleware when you need to act upon the underlying request/response stream (similar to Express).
    - Example: JSON parsing, adding CORS headers, logging request metadata.
- Use interceptors when you require NestJS context (returned values, execution context, controllers).
    - Example: rewrapping outgoing responses, wrapping results in a consistent format, timing handler execution, logging errors with extra context.

**Rule of thumb:**

- Middleware = *"pre-controller, raw HTTP manipulation."*
- Interceptor = *"around-controller, business logic enhancement."*

---

## **LoggerErrorInterceptor**

- This is an internal NestJS interceptor which:
    - Catches exceptions raised by route handlers.
    - Automatically logs them using NestJS's internal Logger.
    - Saves developers from having to write custom try/catch everywhere just to view errors in the logs in a timely manner.

### **How it helps**

- Centralizes error logging.
- Saves time from not duplicating boilerplate (`try/catch + Logger.error()`).
- Ensures logs look the same across the entire app.
- Fits perfectly in production apps for debugging uncaught exceptions.

**Example usage:**

```tsx
import { LoggerErrorInterceptor } from 'nestjs-pino';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerErrorInterceptor,
    },
  ],
})
export class AppModule {}

```

- This guarantees that any exception that occurs within a request pipeline gets logged in a uniform, formatted way.
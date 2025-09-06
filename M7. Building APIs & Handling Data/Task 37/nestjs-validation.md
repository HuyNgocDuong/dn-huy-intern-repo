# Validating Requests with Pipes in NestJS

## 1) What pipes are in NestJS & how they work

- Pipes are classes that **transform and/or validate data** before it reaches your route handler.
- They run **after guards** and **before interceptors/the controller method**.
- Signature: `PipeTransform` with `transform(value, metadata)`.
- If validation fails, a pipe throws an exception (e.g., `BadRequestException`) which the exception filters handle.

---

## 2) Explore built-in pipes

- Common built-ins you’ll actually use:
    - `ValidationPipe` — integrates `class-validator` to validate DTOs.
    - `ParseIntPipe`, `ParseBoolPipe`, `ParseUUIDPipe`, `ParseFloatPipe` — cast and validate primitives.
    - `DefaultValuePipe` — return a default when a value is `undefined`.
    - `ParseArrayPipe`, `ParseEnumPipe`, `ParseFilePipe` — validate arrays/enums/files.

### Quick demo (built-ins)

```tsx
@Get(':id')
getOne(
  @Param('id', ParseIntPipe) id: number,           // ensures number
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
) {
  return { id, page };
}

```

---

## 3) Create a custom DTO with class-validator

```tsx
// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;
}

```

### Use the DTO in a controller

```tsx
// src/users/users.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    // If we reached here, dto is validated (and optionally mapped)
    return { ok: true, dto };
  }
}

```

---

## 4) Use a global ValidationPipe

- Harden inputs and require DTO validation everywhere in the app.

```tsx
// src/main.ts
import { ValidationPipe, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // strip unknown properties
    forbidNonWhitelisted: true,   // throw on sending unknown props
    transform: true,              // automatically convert payloads to DTO classes & types
    transformOptions: { enableImplicitConversion: true }, // e.g. "42" -> number
  }));

  await app.listen(3000);
}
bootstrap();

```

---

## (Bonus) A tiny custom pipe example

- Useful patterns: trim strings, validate Mongo IDs, coerce CSV to string[].

```tsx
// src/common/pipes/trim.pipe.ts
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') return value.trim();
    return value;
  }
}

// usage
@Post()
create(@Body('name', new TrimPipe()) name: string) { /* ... */ }

```

---

# ✅ Reflection (nestjs-validation.md)

### 1) Why are pipes handy in NestJS?

- To validate and/or transform incoming data prior to reaching your controllers.
- They assist in making controllers cleaner, uphold input contracts, and ensure your handlers are getting proper shapes/types.

### 2) Why does ValidationPipe enhance API security and integrity of the data?

- **Security:**
    - `whitelist: true` erases properties you did not permit explicitly (prevents mass-assignment).
    - `forbidNonWhitelisted: true` declines requests with unexpected fields.
- **Integrity:**
    - Guarantees each request body/query/param complies with your DTO rules, not letting incorrect states into your system.
    - With `transform: true`, types are coerced (e.g., `"5"` → number), minimizing parsing errors.

### 3) Built-in vs. custom pipes

- **Built-in pipes:** Plug-and-play for boilerplate work (parsing primitives, arrays, enums, files; DTO validation).
- **Custom pipes:** You use `PipeTransform` to deal with project-specific validation/transformation (e.g., trimming, phone number normalizing, Mongo/ObjectId checking, base64 decoding payloads).

### 4) How are decorators `@IsString()` and `@IsNumber()` applied to DTOs?

- They are `class-validator` decorators applied on DTO class properties.
- `ValidationPipe` at runtime:
    - Creates the DTO class.
    - Reads rules from the decorators.
    - Compares the incoming object to them.
    - Throws a `BadRequestException` with rich errors upon failure (or removes/forbids unknown fields depending on options).
- **Result:** your controller receives a validated and possibly transformed instance.
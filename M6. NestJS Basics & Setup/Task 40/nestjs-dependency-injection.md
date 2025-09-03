# Dependency Injection in NestJS

# 1. How Dependency Injection Enhances Maintainability

Dependency Injection (DI) is a pattern wherein a class does not create instances of its own dependencies but instead has them injected by some third party. DI enhances maintainability in NestJS by making components loosely coupled. Services, controllers, and other classes talk to each other through defined interfaces instead of concrete implementations, allowing the modification or extension of functionality without rewriting dependent code. For instance, to change a database provider (say MongoDB to PostgreSQL) is not a big job because the dependencies are injected and not hard-coded. It also enhances testability as it becomes easy to mock or replace the dependencies while doing unit testing.

---

# 2. Reason for the @Injectable() Decorator

`@Injectable()` decorator defines a class as a provider in NestJS, hence it can be handled by the Nest IoC (Inversion of Control) container and can be injected into other classes. Unless decorated, NestJS will not treat the class as eligible for DI. The decorator notifies the framework that the class can depend on other providers and the class can be injected somewhere else too. This allows the Nest runtime to construct and manage class instances by the given provider scope.

**Example:**

```tsx
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll() {
    return ['Alice', 'Bob', 'Charlie'];
  }
}

```

---

# 3. How Services Are Injected into Controllers

Controllers process incoming HTTP requests, and services encapsulate business logic. NestJS separates concerns and maintains light-weight controllers by injecting services into controllers.

**Example:**

```tsx
import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}

```

In this example, NestJS resolves the `UsersService` dependency automatically in the `UsersController` constructor. No longer do developers create an instance of `UsersService` manually—the DI container does.

---

# 4. Provider Scopes in NestJS

Providers are singleton-scoped by default, but NestJS offers three scopes:

### Singleton (Default)

- One instance is shared throughout the application lifetime.
- Most appropriate for stateless services like data stores or utility classes.
- **Example:** Log or configuration services.

### Request Scope

- New instance for each incoming request.
- Most suitable when a provider needs to retain state or cache request-scoped data.
- **Example:** Services storing user session information or request context.

### Transient Scope

- New instance for each injection of the provider.
- Useful when you need to have multiple isolated instances within the same request or service chain.
- **Example:** Helper classes or random ID generators that must remain isolated.

**Example of scope setup:**

```tsx
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST }) // also Scope.TRANSIENT
export class RequestScopedService {}

```

---

# 5. How NestJS Automatically Resolves Dependencies

NestJS employs TypeScript's reflection metadata system (`reflect-metadata`) and decorators for managing the dependencies. When a class is decorated with `@Injectable()` and injected with a constructor, the framework looks at the parameter types of the constructor and provides the correct instance from the IoC container automatically.

- When a dependency is registered as a provider within a module, the container creates or reuses an instance based on its scope.
- The container injects this instance into the class which depends upon it.
- Developers are not aware of this procedure, i.e., no explicit instantiation is needed.

**Multiple injections example:**

```tsx
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}
}

```

NestJS resolves `OrdersService` and `UsersService` automatically if they are registered in the module correctly.
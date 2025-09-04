# What is NestJS? (Framework Overview)

1. What Are the Main Differences Between NestJS and Express.js?

Express.js is a lightweight Node.js framework that specializes in responding to HTTP requests and sending HTTP responses. It is flexible but less structured, with application architecture left to developers to figure out.

NestJS, on the other hand, is a progressive Node.js framework built on Express (or optionally Fastify). It offers a strongly opinionated architecture inspired by Angular and emphasizes modularity, dependency injection, and TypeScript support natively. Whereas Express requires manual wiring and structuring of middleware, NestJS demands a layered, modular approach more suitable for enterprise applications.

---

1. Why Does NestJS Rely So Much on Decorators?

NestJS relies extensively on TypeScript decorators for marking classes and methods with metadata. Decorators enable developers to express intent declaratively instead of coding boilerplate configuration.

- `@Controller()` → Specifies a class as a controller and with a route prefix.
- `@Injectable()` → Specifies a class as a provider for dependency injection.
- `@Module()` → Provides controllers, providers, and imported modules for registration.

With decorators, the code remains clean and expressive but allows the framework's IoC (Inversion of Control) container to automate wiring of components.

---

1. How Does NestJS Manage Dependency Injection?

NestJS has an IoC container integrated into it that manages creation and life cycle of providers. Classes annotated with `@Injectable()` are converted into providers and can be injected into other classes via constructor injection.

For instance:

```tsx
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}

```

In this, `UsersService` is automatically resolved and injected by NestJS container without instantiation. Thus, it's simple to test (mocks are used instead of services), loosely couple, and have configurable provider scopes (singleton, request, transient).

---

1. Why are Modular Architecture beneficial in a Large-Scale App?

NestJS module-based architecture divides the application into feature-specific modules (i.e., UsersModule, OrdersModule). Controllers and providers are nested under each module based on their interaction.

**Strengths are:**

- **Separation of concerns** – business logic, routing, and database access are well-defined.
- **Reusability** – the modules can be exported from one part of the app or even from other apps.
- **Scalability** – new features can be introduced as separate modules without affecting existing ones.
- **Maintainability** – it is simpler to test and debug smaller, specialized units of code.
- **Collaboration between teams** – several teams can develop separate modules at the same time with minimal contention.
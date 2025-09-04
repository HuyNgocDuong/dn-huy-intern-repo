# Setting Up a NestJS Project

1. What Files Are Included in a Default NestJS Project?

A new NestJS project can be created using the CLI (nest new project-name), which produces a nice-looking scaffold. The most important files and folders are:

- **src/app.module.ts** – the top-level module that binds controllers and providers together.
- **src/app.controller.ts** – a simple controller that handles a meaningless GET / endpoint.
- **src/app.service.ts** – a simple service that returns the "Hello World" string used by the controller.
- **src/main.ts** – application entry point, bootstrapping NestJS.
- **test/** – a few test files included within a directory.
- **package.json** – project metadata and dependencies.
- **tsconfig.json / tsconfig.build.json** – TypeScript configuration files.

All the scaffolding here to boot up a simple HTTP server straight away.

---

1. How main.ts Boots a NestJS Application?

The entry point for any NestJS application is the main.ts. It takes advantage of NestFactory to initialize an instance of the application and listen on HTTP requests.

**Example:**

```tsx
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

```

Here, `NestFactory.create(AppModule)` initializes the dependency injection container, loads modules, and initializes providers. `app.listen(3000)` initializes the HTTP server to listen on port 3000.

---

1. Why is AppModule used in the project?

AppModule is the root module of an application in NestJS. It structures the application by importing its providers and controllers, and declaring its imports. Other feature modules are imported in AppModule, which itself becomes the central point that binds the system together.

**Example:**

```tsx
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

Here, AppController and AppService are declared in the default project. As the app expands, feature modules (e.g., UsersModule, OrdersModule) can be added by developers and imported to AppModule.

---

1. How Does NestJS Structure Enable Scalability?

NestJS needs to have a modular structure that enables applications to expand without becoming unmanageable:

- **Modules**: Organize related features, easy to maintain and test independently.
- **Controllers**: Take care of routing and incoming requests, separated from business logic.
- **Providers (Services)**: Store reusable logic and can be injected wherever needed through dependency injection.
- **Decorators**: (`@Module()`, `@Controller()`, `@Injectable()`) convey metadata so that NestJS automatically wires components together.
# Introduction to Testing in NestJS

## **Explore how to test NestJS modules using `@nestjs/testing`**

```jsx
import { Test } from '@nestjs/testing';
import { HelloController } from './hello.controller';
import { GreeterService } from './greeter.service';

describe('HelloController', () => {
  it('returns message from GreeterService', async () => {
    const greeterMock = { greet: jest.fn().mockReturnValue('Good afternoon, Huy!') };

    const moduleRef = await Test.createTestingModule({
      controllers: [HelloController],
      providers: [{ provide: GreeterService, useValue: greeterMock }],
    }).compile();

    const ctrl = moduleRef.get(HelloController);

    const res = ctrl.sayHello('Huy');
    expect(res).toEqual({ message: 'Good afternoon, Huy!' });
    expect(greeterMock.greet).toHaveBeenCalledWith('Huy');
  });
});

```

## Run the sample test

![image.png](image.png)

## Reflection

1. Most Important Differences Between Unit, Integration, and E2E Tests

Unit tests attempt to exercise the behavior of individual classes or methods independently, often by substituting mock objects for dependencies. For instance, it is possible to test a service method without actually invoking a live database or an HTTP request. Integration tests confirm the interoperability of two or more modules or services in a manner that components like a service and a repository work properly with actual implementations. End-to-End (E2E) tests run at the top level by testing the overall application from a client's point of view. In NestJS, it typically involves bootstrapping the complete HTTP server and hitting through its controllers, services, and persistence layers to mimic actual use cases. Every testing layer plays a specific role: unit tests check correctness of small units, integration tests check co-working of modules, and E2E tests check system-level behavior.

1. Testing necessity for a NestJS Backend

Testing is required in a NestJS backend since it makes sure that business logic, APIs, and data processing are stable, secure, and easy to maintain. Backends tend to handle primary tasks like authentication, data storage, and interfacing with external services. Without tests, tiny bugs in one component would become monumental failures in production. A robustly tested backend instills confidence when refactoring or introducing new features, minimizes the likelihood of regressions, and leads to more stable long-term projects. To a development team, a solid test suite also leads to better developer collaboration as developers can trust tests to inform them if changes are safe. Finally, testing leads to more efficient developers as well as an overall quality of the backend system.

1. @nestjs/testing's Role in Streamlining Testing

NestJS comes with the @nestjs/testing package to facilitate unit, integration, and E2E testing by taking advantage of its dependency injection system. Using Test.createTestingModule(), developers can create lightweight test modules that reflect the structure of the application but with mock providers, controllers, or repositories. This prevents overwhelming manual setup and has classes with their dependencies injected automatically. In addition, the test helpers are seamlessly incorporated into Jest, which is NestJS' default testing library. Combined with the dependency injection and mocking helpers, @nestjs/testing allows developers to write test meaningful logic instead of boilerplate setup code.

1. Testing a NestJS Application: Challenges

With awesome support for testing, developers still find it challenging to write tests in NestJS. One such area is managing intricate module dependencies, particularly in multi-repository or larger applications where services rely on numerous repositories or third-party modules. The second is choosing the correct testing strategy—whether to mock, stub, or perform in actual terms—affected by test suite reliability and maintainability. Tests can end up slowing down or becoming brittle too if excessive reliance is made on integration or E2E strategies without proper demarcation. Also, satirizing libraries like TypeORM repositories or third-party services is not convenient for new users since they need to be aware of provider tokens and dependency injection. Lastly, keeping test coverage in addition to making tests worth running is a chronic problem since really simple tests can inflate coverage ratios without giving actual confidence in correctness.
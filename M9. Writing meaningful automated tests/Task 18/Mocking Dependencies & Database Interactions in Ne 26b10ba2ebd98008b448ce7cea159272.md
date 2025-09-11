# Mocking Dependencies & Database Interactions in NestJS

## **Mock a service inside a controller test**

```tsx
import { Test } from '@nestjs/testing';
import { HelloController } from './hello.controller';
import { GreeterService } from './greeter.service';

describe('HelloController (with mocked service)', () => {
  it('returns mocked message', async () => {
    const greeterMock = { greet: jest.fn().mockReturnValue('Hi from mock!') };

    const moduleRef = await Test.createTestingModule({
      controllers: [HelloController],
      providers: [{ provide: GreeterService, useValue: greeterMock }],
    }).compile();

    const ctrl = moduleRef.get(HelloController);

    expect(ctrl.sayHello('Huy')).toEqual({ message: 'Hi from mock!' });
    expect(greeterMock.greet).toHaveBeenCalledWith('Huy');
  });
});

```

## **Mock a database repository (`TypeORM Repository`) in a service test**

```tsx
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repo.find();
  }
}

```

```tsx
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';

describe('UserService (mocked repo)', () => {
  let service: UserService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: { find: jest.fn() }, // mock only what you need
        },
      ],
    }).compile();

    service = moduleRef.get(UserService);
    repo = moduleRef.get(getRepositoryToken(User));
  });

  it('returns users from mock repo', async () => {
    const fakeUsers = [{ id: 1, name: 'Huy' }] as User[];
    repo.find.mockResolvedValue(fakeUsers);

    const result = await service.findAll();
    expect(result).toEqual(fakeUsers);
    expect(repo.find).toHaveBeenCalled();
  });
});

```

In this configuration, the UserService relies on a TypeORM repository injected with @InjectRepository(User), which would otherwise grant full database access at runtime. But in the unit test, we do not wish to be running against an actual database, so we assign this dependency a mock. We achieve this by getRepositoryToken(User), which constructs the same provider token that NestJS does internally for the User repository. In the test module, rather than allowing NestJS to resolve the actual repository, we provide a mock object ({ find: jest.fn() }) under that token. Both the service and the test reference the same token, so NestJS injects the mock automatically into the UserService. As a result, when service.findAll() calls this.repo.find(), it calls the find method which has been mocked out, allowing us to decide the result value (mockResolvedValue) and verify the way it is called, without touching a live database. The association keeps the service's behaviour isolated while keeping the database layer safely abstracted.

## **Explore when to use `jest.spyOn()` vs `jest.fn()` in mocks**

- **`jest.fn()`**: Create a mock function from scratch.
- **`jest.spyOn()`**: Wrap an *existing* method to watch or override it.

**File: `spy-vs-fn.spec.ts`**

```tsx
class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
}

describe('jest.fn vs jest.spyOn', () => {
  it('jest.fn() creates a fake function', () => {
    const fakeAdd = jest.fn().mockReturnValue(42);
    expect(fakeAdd(1, 2)).toBe(42);
    expect(fakeAdd).toHaveBeenCalledWith(1, 2);
  });

  it('jest.spyOn() spies or overrides a real method', () => {
    const calc = new Calculator();

    // spy but keep real behavior
    const spy = jest.spyOn(calc, 'add');
    expect(calc.add(2, 3)).toBe(5);
    expect(spy).toHaveBeenCalledWith(2, 3);

    // override implementation
    spy.mockReturnValue(99);
    expect(calc.add(2, 3)).toBe(99);
  });
});

```

## Reflection

1. Mocking Unit Tests' Role

Mocking is important in unit tests because it severs the unit being tested from its outside dependencies. Services, repositories, and external APIs in a NestJS application tend to undertake slow or laborious actions like database queries or network connections. By substituting these dependencies with mock objects that can be controlled by the test, tests are made faster, deterministic, and easier to understand. Mocking guarantees that the interaction of the unit itself is being tested and not the combined interaction of several components. Mocking also simplifies debugging because the failure of a test directly indicates the logic within the unit and not possible side effects through other layers.

1. Mocking a NestJS Provider

Providers such as services in NestJS are injected into other classes using dependency injection. During testing, providers can be mocked out so that one can control their behavior. As an example, when a controller is being tested and it relies on a service, then the service can be overridden using a mock with the useValue pattern in the test module. One common technique is to provide the service's token and pass a mock object:

providers: [
{ provide: GreeterService, useValue: { greet: jest.fn().mockReturnValue('Hello!') } }

].
That makes the controller easy to unit test in isolation since only its request handling and response logic are tested and underlying service logic is hidden.

1. Advantages of Mocking the Database Rather Than a Live One

Mocking the database proves to be very useful because live database access creates some issues for unit testing. First, tests become slow and brittle due to their reliance on external state, network, and potentially big datasets. Second, real databases imply setup and teardown code in order to keep tests consistent, which is messy. By mocking the database layer—most commonly by mocking the TypeORM Repository or Prisma client—tests remain fast, reproducible, and independent of environment problems. Apart from that, mocking enables developers to emulate certain edge conditions (e.g., empty results, constraint violations, or query exceptions) that are more difficult to consistently recreate in a live database.

1. What to Mock vs. What to Test Directly

Mocking or direct testing is dictated by test scope. In unit tests, the class's external dependencies have to be mocked since the aim is to test only the unit's logic in isolation. In integration tests, the actual services and modules may be integrated to verify that the components play well together, although third-party APIs and other external services may be mocked. As a rule of thumb, infrastructure issues like databases, APIs, and message queues would be mocked and business logic and error handling tested separately. This tiered approach guarantees both the correctness of individual units as well as the reliability of their interdependences without affecting test performance or maintainability.
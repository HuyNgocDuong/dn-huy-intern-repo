# Using Jest & Supertest for API Testing in NestJS

# ✅ Tasks

### **🔍 Research: How Supertest is Used for API Testing in NestJS**

Supertest is a Node.js library that allows you to simulate HTTP requests against a NestJS application. It integrates seamlessly with Jest and the `INestApplication` interface, enabling:

- End-to-end testing without running a real server
- Full request/response lifecycle testing
- Validation of HTTP status codes, headers, and body payloads

In NestJS, Supertest is used with:

```tsx
request(app.getHttpServer())
  .get('/route')
  .expect(200)
  .expect('Expected Response');

```

---

### **🔧 Write an Integration Test for a Simple GET API Endpoint**

```tsx
it('/GET root (should return "Hello World!")', () => {
  return request(app.getHttpServer())
    .get('/')
    .expect(200)
    .expect('Hello World!');
});

```

This verifies that the root route (`GET /`) returns the correct string as expected.

---

### **📨 Write an Integration Test for a POST API Endpoint with Validation**

Assuming we have a DTO like:

```tsx
export class CreateMessageDto {
  @IsString()
  message: string;
}

```

And a secured controller route in the app.controller:

```tsx
@Post('echo')
@UseGuards(JwtAuthGuard)
echoMessage(@Body() dto: CreateMessageDto) {
  return { echoed: dto.message };
}

```

Then, the integration tests would look like:

```tsx
it('/POST echo (201 with valid token)', () => {
  return request(app.getHttpServer())
    .post('/echo')
    .set('Authorization', 'Bearer test-token')
    .send({ message: 'NestJS is cool' })
    .expect(201)
    .expect((res) => {
      expect(res.body.echoed).toBe('NestJS is cool');
    });
});

it('/POST echo (400 - missing message)', () => {
  return request(app.getHttpServer())
    .post('/echo')
    .set('Authorization', 'Bearer test-token')
    .send({})
    .expect(400);
});

```

---

### **🔐 Mock Authentication in API Tests (Provide Test JWT)**

Instead of setting up full JWT, we mocked auth using a custom guard:

```tsx
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    return auth === 'Bearer test-token';
  }
}

```

This allows us to simulate authorized access by setting a header in tests:

```tsx
.set('Authorization', 'Bearer test-token')

```

---

## 🧠 Reflection (nestjs-api-tests.md)

### 🔹 **How does Supertest help test API endpoints?**

Supertest allows developers to simulate HTTP requests directly in code, making it easy to verify how NestJS endpoints behave under real-world conditions. It helps ensure correctness of routing, status codes, and returned data without starting a live server.

---

### 🔹 **What is the difference between unit tests and API tests?**

| Feature | Unit Tests | API/Integration Tests |
| --- | --- | --- |
| Scope | Individual functions/methods | Whole request/response cycle |
| Speed | Very fast | Slower due to bootstrapping the app |
| Dependencies | Mocked | May use actual modules (controllers, guards) |
| Example | Test a `Service` method | Test `/POST /echo` endpoint |

---

### 🔹 **Why should authentication be mocked in integration tests?**

Mocking authentication:

- Keeps tests **fast and isolated**
- Avoids depending on **external services or real JWT tokens**
- Lets you focus on **testing the business logic**, not the auth process
- Ensures **predictable results** in different environments

---

### 🔹 **How can you structure API tests to cover both success and failure cases?**

Use separate `describe` and `it` blocks to organize tests like:

```tsx
describe('/POST echo', () => {
  it('should return echoed message (201)', () => { ... });
  it('should return 400 for missing message', () => { ... });
  it('should return 403 without valid token', () => { ... });
});

```

This structure helps:

- Ensure positive and negative paths are both covered
- Make the test file easy to read and maintain
- Validate API robustness against edge cases
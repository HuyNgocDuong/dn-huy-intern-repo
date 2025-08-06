import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable validation for DTOs
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Task 2: GET test
  it('/GET root (should return "Hello World!")', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  // Task 3: POST success with valid token
  it('/POST echo (201 with valid token)', () => {
    return request(app.getHttpServer())
      .post('/echo')
      .set('Authorization', 'Bearer test-token') // mocked token
      .send({ message: 'NestJS is cool' })
      .expect(201)
      .expect((res) => {
        expect(res.body.echoed).toBe('NestJS is cool');
      });
  });

  // Task 3: POST failure without token
  it('/POST echo (403 without token)', () => {
    return request(app.getHttpServer())
      .post('/echo')
      .send({ message: 'Should fail' })
      .expect(403);
  });

  // Task 3: POST failure with missing message (validation)
  it('/POST echo (400 - missing message)', () => {
    return request(app.getHttpServer())
      .post('/echo')
      .set('Authorization', 'Bearer test-token')
      .send({})
      .expect(400);
  });
});

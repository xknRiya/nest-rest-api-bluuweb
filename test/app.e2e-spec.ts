import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

export interface ResBody extends Response {
  access_token: string;
}

describe('Rest API', () => {
  let app: INestApplication<App>;
  let connection: DataSource;
  let access_token: string;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    connection = app.get(DataSource);
  });

  afterAll(async () => {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;'); // Desactivar comprobaciones

    const entities = connection.entityMetadatas;
    for (const entity of entities) {
      await connection.query(`TRUNCATE TABLE ${entity.tableName}`);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;'); // Volver a activar las comprobaciones
    await connection.destroy();
    await app.close();
  });

  describe('Auth', () => {
    describe('Fail Tests', () => {
      it('/auth/register (POST) should return 400 for short password', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ name: 'test', email: 'test@test.com', password: 'test' });
        return expect(res.status).toBe(400);
      });
      it('/auth/login (POST) should return 400 because above post fails', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'test@test.com', password: 'test' });
        return expect(res.status).toBe(400);
      });

      it('/auth/register (POST) should return 400 for short name', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'test',
            email: 'test@test.com',
            password: 'test-password',
          });
        return expect(res.status).toBe(400);
      });

      it('/auth/register (POST) should return 400 for invalid email', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'test',
            email: 'test',
            password: 'test-password',
          });
        return expect(res.status).toBe(400);
      });
    });
    describe('Correct Tests', () => {
      it('/auth/register (POST) should return 201 if values are valid', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'test-name',
            email: 'test@mail.com',
            password: 'test-password',
          });
        return expect(res.status).toBe(201);
      });
      it('/auth/login (POST) should return Forbidden 400 if credentials are wrong', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'test@mail.com', password: 'testing' });
        return expect(res.status).toBe(400);
      });

      it('/auth/login (POST) should return 201 if credentials are right', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'test@mail.com', password: 'test-password' });
        const responseBody = res.body as ResBody;
        expect(res.body).toHaveProperty('access_token');
        access_token = 'Bearer ' + responseBody.access_token;
        return expect(res.status).toBe(201);
      });
    });
  });

  describe('Common Endpoints', () => {
    describe('Free Requests', () => {
      it('/cats (GET) should return 200', async () => {
        const res = await request(app.getHttpServer()).get('/cats');
        expect(res.status).toBe(200);
        return expect(res.body).toEqual([]);
      });

      it('/breeds (GET) should return 200', async () => {
        const res = await request(app.getHttpServer()).get('/breeds');
        expect(res.status).toBe(200);
        return expect(res.body).toEqual([]);
      });
    });
    describe('Unauthorized POSTs', () => {
      it('/cats (POST) should return 401 for unauthorized request', async () => {
        const res = await request(app.getHttpServer())
          .post('/cats')
          .send({ name: 'test', age: 10, breed: 'test' });
        return expect(res.status).toBe(401);
      });
      it('/breeds (POST) should return 401 for unauthorized request', async () => {
        const res = await request(app.getHttpServer()).post('/breeds');
        return expect(res.status).toBe(401);
      });
    });

    describe('Authorized Requests + GETs for checks', () => {
      it('/breeds (POST)', async () => {
        const res = await request(app.getHttpServer())
          .post('/breeds')
          .set('Authorization', access_token)
          .send({ name: 'test name' });
        return expect(res.status).toBe(201);
      });

      it('/breeds/:id (GET)', async () => {
        const res = await request(app.getHttpServer()).get(`/breeds/1`);
        expect(res.status).toBe(200);
        return expect(res.body).toEqual({ id: 1, name: 'test name' });
      });

      it('/cats (POST)', async () => {
        const res = await request(app.getHttpServer())
          .post('/cats')
          .set('Authorization', access_token)
          .send({ name: 'test', age: 10, breed: 'test name' });
        return expect(res.status).toBe(201);
      });

      it('/cats/:id (GET)', async () => {
        const res = await request(app.getHttpServer()).get(`/cats/1`);
        expect(res.status).toBe(200);
        return expect(res.body).toEqual({
          id: 1,
          name: 'test',
          age: 10,
          breed: {
            id: 1,
            name: 'test name',
          },
          createdAt: expect.any(String) as string,
          deletedAt: null,
        });
      });

      it('/cats/:id (PATCH)', async () => {
        const res = await request(app.getHttpServer())
          .patch('/cats/1')
          .set('Authorization', access_token)
          .send({ name: 'test2' });
        return expect(res.status).toBe(200);
      });

      it('/cats/:id (GET)', async () => {
        const res = await request(app.getHttpServer()).get('/cats/1');
        expect(res.status).toBe(200);
        return expect(res.body).toEqual({
          id: 1,
          name: 'test2',
          age: 10,
          breed: {
            id: 1,
            name: 'test name',
          },
          createdAt: expect.any(String) as string,
          deletedAt: null,
        });
      });
    });
    describe('Unauthorized PATCHs', () => {
      it('/cats/:id (PATCH) should return 401', async () => {
        const res = await request(app.getHttpServer())
          .patch('/cats/1')
          .send({ name: 'test2' });
        return expect(res.status).toBe(401);
      });
      it('/cats/:id (PATCH) should return 401', async () => {
        const res = await request(app.getHttpServer())
          .patch('/breeds/1')
          .send({ name: 'test2' });
        return expect(res.status).toBe(401);
      });
    });
  });
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getConnectionToken } from '@nestjs/sequelize';
import { BooksService } from './books.service';
import { v4 as uuidv4 } from 'uuid';
import { Book } from './entities/book.entity';
import {
  cleanupTest,
  createAppFrom,
  createTestingModule,
} from '../../test/test-utils';
import { Sequelize } from 'sequelize-typescript';
import { up as bookTable } from '../../migrations/20250214143721-books';

describe('BooksController (e2e)', () => {
  let app: INestApplication;
  let booksService: BooksService;

  beforeEach(async () => {
    const module = createTestingModule();

    app = await createAppFrom(module, true);
    const sequelize: Sequelize = await app.resolve(getConnectionToken());

    await bookTable(sequelize.getQueryInterface(), Sequelize);
    // Seeders
    // await up(sequelize.getQueryInterface());

    booksService = app.get<BooksService>(BooksService);
  });

  afterEach(async () => {
    await cleanupTest(app);
  });

  describe('Input Validation Tests', () => {
    const testCases = [
      {
        description: 'should validate empty title',
        payload: { author: 'Test Author', description: 'Test Description' },
        expectedStatus: 400,
      },
      {
        description: 'should validate empty author',
        payload: { title: 'Test Title', description: 'Test Description' },
        expectedStatus: 400,
      },
      {
        description: 'should validate title length > 100 characters',
        payload: { title: 'a'.repeat(101), author: 'Test Author' },
        expectedStatus: 400,
      },
      {
        description: 'should validate author length > 100 characters',
        payload: { title: 'Test Title', author: 'a'.repeat(101) },
        expectedStatus: 400,
      },
      {
        description: 'should validate negative price',
        payload: { title: 'Test Title', author: 'Test Author', price: -1 },
        expectedStatus: 400,
      },
    ];

    testCases.forEach(({ description, payload, expectedStatus }) => {
      it(description, () => {
        return request(app.getHttpServer())
          .post('/books')
          .send(payload)
          .expect(expectedStatus);
      });
    });
  });

  describe('CREATE /books', () => {
    const validBooks = [
      {
        title: 'Test Book 1',
        author: 'Test Author 1',
        description: 'Test Description 1',
        price: 999,
      },
      {
        title: 'Test Book 2',
        author: 'Test Author 2',
        description: 'Test Description 2',
        price: 1999,
      },
    ];

    validBooks.forEach((book, index) => {
      it(`should create book ${index + 1} successfully`, async () => {
        const response = await request(app.getHttpServer())
          .post('/books')
          .send(book)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(book.title);
        expect(response.body.author).toBe(book.author);
      });
    });

    it('should create book with minimum required fields', async () => {
      const minBook = {
        title: 'Minimum Book',
        author: 'Minimum Author',
      };

      const response = await request(app.getHttpServer())
        .post('/books')
        .send(minBook)
        .expect(201);

      expect(response.body.price).toBe(0);
      expect(response.body.description).toBeNull();
    });
  });

  describe('READ /books', () => {
    let testBook: Book;

    beforeEach(async () => {
      testBook = await booksService.create({
        title: 'Read Test Book',
        author: 'Read Test Author',
        description: 'Read Test Description',
        price: 999,
      });
    });

    it('should get all books', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get book by valid ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${testBook.id}`)
        .expect(200);

      expect(response.body.id).toBe(testBook.id);
    });

    it('should return 404 for non-existent book ID', async () => {
      const nonExistentId = uuidv4();
      await request(app.getHttpServer())
        .get(`/books/${nonExistentId}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer()).get('/books/invalid-uuid').expect(400);
    });
  });

  describe('UPDATE /books', () => {
    let testBook: Book;

    beforeEach(async () => {
      testBook = await booksService.create({
        title: 'Update Test Book',
        author: 'Update Test Author',
        description: 'Update Test Description',
        price: 999,
      });
    });

    const updateTestCases = [
      {
        description: 'should update title only',
        payload: { title: 'Updated Title' },
      },
      {
        description: 'should update author only',
        payload: { author: 'Updated Author' },
      },
      {
        description: 'should update description only',
        payload: { description: 'Updated Description' },
      },
      {
        description: 'should update price only',
        payload: { price: 1999 },
      },
      {
        description: 'should update all fields',
        payload: {
          title: 'Fully Updated Title',
          author: 'Fully Updated Author',
          description: 'Fully Updated Description',
          price: 2999,
        },
      },
    ];

    updateTestCases.forEach(({ description, payload }) => {
      it(description, async () => {
        const response = await request(app.getHttpServer())
          .patch(`/books/${testBook.id}`)
          .send(payload)
          .expect(200);

        console.log(response.body);

        Object.keys(payload).forEach((key) => {
          expect(response.body[key]).toBe(payload[key]);
        });
      });
    });

    it('should return 404 when updating non-existent book', async () => {
      const nonExistentId = uuidv4();
      await request(app.getHttpServer())
        .patch(`/books/${nonExistentId}`)
        .send({ title: 'Updated Title' })
        .expect(404);
    });
  });

  describe('DELETE /books', () => {
    let testBook: Book;

    beforeEach(async () => {
      testBook = await booksService.create({
        title: 'Delete Test Book',
        author: 'Delete Test Author',
        description: 'Delete Test Description',
        price: 999,
      });
    });

    it('should delete existing book', async () => {
      await request(app.getHttpServer())
        .delete(`/books/${testBook.id}`)
        .expect(200);

      // Verify book is deleted
      await request(app.getHttpServer())
        .get(`/books/${testBook.id}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent book', async () => {
      const nonExistentId = uuidv4();
      await request(app.getHttpServer())
        .delete(`/books/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      await request(app.getHttpServer()).post('/books').send({}).expect(400);
    });

    it('should handle malformed JSON', async () => {
      await request(app.getHttpServer())
        .post('/books')
        .set('Content-Type', 'application/json')
        .send('{"title":')
        .expect(400);
    });

    it('should handle very long text fields', async () => {
      const longText = 'a'.repeat(5000);
      const response = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Long Text Book',
          author: 'Long Text Author',
          description: longText,
        })
        .expect(201);

      expect(response.body.description).toBe(longText);
    });
  });

  describe('Business Logic Tests', () => {
    it('should maintain data consistency after multiple updates', async () => {
      // Create initial book
      const book = await booksService.create({
        title: 'Consistency Test Book',
        author: 'Consistency Test Author',
        price: 999,
      });

      // Perform multiple updates
      const updates = [
        { title: 'Updated Title 1', price: 1999 },
        { author: 'Updated Author 1', price: 2999 },
        { title: 'Updated Title 2', author: 'Updated Author 2' },
      ];

      for (const update of updates) {
        await request(app.getHttpServer())
          .patch(`/books/${book.id}`)
          .send(update)
          .expect(200);
      }

      // Verify final state
      const response = await request(app.getHttpServer())
        .get(`/books/${book.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Updated Title 2',
        author: 'Updated Author 2',
        price: 2999,
      });
    });
  });

  describe('Search and Filter Tests', () => {
    beforeEach(async () => {
      // Create test data for search/filter tests
      const testBooks = [
        { title: 'Search Book 1', author: 'Search Author 1', price: 999 },
        { title: 'Search Book 2', author: 'Search Author 2', price: 1999 },
        { title: 'Different Title', author: 'Search Author 1', price: 2999 },
      ];

      for (const book of testBooks) {
        await booksService.create(book);
      }
    });

    const searchTestCases = [
      {
        description: 'should filter books by title',
        query: { title: 'Search Book' },
        expectedCount: 2,
      },
      {
        description: 'should filter books by author',
        query: { author: 'Search Author 1' },
        expectedCount: 2,
      },
      {
        description: 'should filter books by price range',
        query: { minPrice: 1000, maxPrice: 2000 },
        expectedCount: 1,
      },
    ];

    searchTestCases.forEach(({ description, query, expectedCount }) => {
      it(description, async () => {
        const response = await request(app.getHttpServer())
          .get('/books')
          .query(query)
          .expect(200);

        expect(response.body.length).toBe(expectedCount);
      });
    });
  });
});

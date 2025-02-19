import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/sequelize';
import { BooksService } from './books.service';
import { v4 as uuidv4 } from 'uuid';
import { Book } from './entities/book.entity';
import { Author } from './entities/author.entity';
import { BookDetails } from './entities/bookDetails.entity';
import { Review } from './entities/review.entity';
import {
  booksMigration,
  cleanupTest,
  createAppFrom,
  createTestingModule,
} from '../../test/test-utils';
import { Sequelize } from 'sequelize-typescript';
import { faker } from '@faker-js/faker';
import { BookAuthor } from './entities/bookAuthor.entity';

describe('BooksController (e2e)', () => {
  let app: INestApplication;
  let booksService: BooksService;
  let server: string;

  beforeEach(async () => {
    const module = createTestingModule();

    app = await createAppFrom(module, true);
    const sequelize: Sequelize = await app.resolve(getConnectionToken());

    await booksMigration(sequelize.getQueryInterface());

    booksService = app.get<BooksService>(BooksService);
    await app.listen(3000);
    server = await app.getUrl();
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
        description: 'should validate invalid publication year (negative)',
        payload: {
          title: 'Test Title',
          author: 'Test Author',
          publicationYear: -1,
        },
        expectedStatus: 400,
      },
      {
        description: 'should validate invalid ISBN format',
        payload: {
          title: 'Test Title',
          author: 'Test Author',
          isbn: 'not-valid-isbn',
        },
        expectedStatus: 400,
      },
      // New validation test cases based on entities
      {
        description: 'should validate invalid review rating (> 5)',
        payload: {
          title: 'Test Title',
          author: 'Test Author',
          reviews: [{ rating: 6, reviewerName: 'Test Reviewer' }],
        },
        expectedStatus: 400,
      },
      {
        description: 'should validate invalid review rating (< 1)',
        payload: {
          title: 'Test Title',
          author: 'Test Author',
          reviews: [{ rating: 0, reviewerName: 'Test Reviewer' }],
        },
        expectedStatus: 400,
      },
    ];

    testCases.forEach(({ description, payload, expectedStatus }) => {
      it(description, async () => {
        const response = await fetch(`${server}/books`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        expect(response.status).toBe(expectedStatus);
      });
    });
  });

  describe('Author Association Tests', () => {
    let testBook: Book;
    let testAuthor1: Author;
    let testAuthor2: Author;

    beforeEach(async () => {
      // Create test authors
      testAuthor1 = await Author.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        biography: faker.lorem.paragraph(),
      });

      testAuthor2 = await Author.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        biography: faker.lorem.paragraph(),
      });

      // Create test book
      testBook = await booksService.create({
        title: faker.book.title(),
        author: `${testAuthor1.firstName} ${testAuthor1.lastName}`,
        description: faker.lorem.paragraph(),
        publicationYear: 2024,
        isbn: uuidv4().slice(0, 13),
      });
    });

    it('should associate multiple authors with different roles', async () => {
      await BookAuthor.create({
        bookId: testBook.id,
        authorId: testAuthor1.id,
        role: 'Primary',
      });

      await BookAuthor.create({
        bookId: testBook.id,
        authorId: testAuthor2.id,
        role: 'Co-author',
      });

      const response = await fetch(
        `${server}/books/${testBook.id}?include=authors`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const data = (await response.json()) as Book;

      expect(response.status).toBe(200);
      expect(data.authors).toHaveLength(2);
      expect(
        data.authors.find((author) => author?.BookAuthor?.role === 'Primary')
          ?.BookAuthor?.role,
      ).toBe('Primary');
      expect(
        data.authors.find((author) => author?.BookAuthor?.role === 'Co-author')
          ?.BookAuthor?.role,
      ).toBe('Co-author');
    });

    it('should update author roles', async () => {
      // First associate author
      await BookAuthor.create({
        bookId: testBook.id,
        authorId: testAuthor1.id,
        role: 'Primary',
      });

      // Update role
      const patchResponse = await fetch(
        `${server}/books/${testBook.id}?include=authors`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authors: [{ authorId: testAuthor1.id, role: 'Editor' }],
          }),
        },
      );
      expect(patchResponse.status).toBe(200);

      const response = await fetch(
        `${server}/books/${testBook.id}?include=authors`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as Book;

      expect(data.authors[0]?.BookAuthor?.role).toBe('Editor');
    });

    it('should remove author associations', async () => {
      // First associate authors
      await BookAuthor.create({
        bookId: testBook.id,
        authorId: testAuthor1.id,
        role: 'Primary',
      });

      await BookAuthor.create({
        bookId: testBook.id,
        authorId: testAuthor2.id,
        role: 'Co-author',
      });

      // Update book authors
      const updateResponse = await fetch(`${server}/books/${testBook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authors: [{ authorId: testAuthor1.id, role: 'Editor' }],
        }),
      });

      expect(updateResponse.status).toBe(200);

      // Fetch the updated book details
      const response = await fetch(
        `${server}/books/${testBook.id}?include=authors`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as Book;

      // Assertions
      expect(data.authors).toHaveLength(1);
      expect(data.authors[0].id).toBe(testAuthor1.id);
      expect(data.authors[0]?.BookAuthor?.role).toBe('Editor');
    });
  });

  describe('Cascade Delete Tests', () => {
    let testBook: Book;
    let author: Author;

    beforeEach(async () => {
      // Create test data with all relationships
      author = await Author.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        biography: faker.lorem.paragraph(),
      });

      testBook = await booksService.create({
        title: faker.book.title(),
        author: `${author.firstName} ${author.lastName}`,
        description: faker.lorem.paragraph(),
        publicationYear: 2024,
        isbn: uuidv4().slice(0, 13),
      });

      await BookAuthor.create({
        bookId: testBook.id,
        authorId: author.id,
        role: 'Primary',
      });

      await BookDetails.create({
        bookId: testBook.id,
        pageCount: 328,
        language: 'English',
        publisher: faker.company.name(),
        edition: 'First Edition',
      });

      await Review.create({
        bookId: testBook.id,
        reviewerName: faker.person.fullName(),
        rating: 4,
        comment: faker.lorem.paragraph(),
      });
    });

    it('should delete all related entities when book is deleted', async () => {
      const response = await fetch(`${server}/books/${testBook.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);

      // Verify cascade deletes
      const details = await BookDetails.findOne({
        where: { bookId: testBook.id },
      });
      expect(details).toBeNull();

      const bookAuthor = await BookAuthor.findOne({
        where: { bookId: testBook.id },
      });
      expect(bookAuthor).toBeNull();

      const reviews = await Review.findAll({ where: { bookId: testBook.id } });
      expect(reviews).toHaveLength(0);

      // Verify author still exists (should not be deleted)
      const authorExists = await Author.findByPk(author.id);
      expect(authorExists).not.toBeNull();
    });
  });

  describe('READ /books', () => {
    let testBook: Book;
    let testAuthor: Author;

    beforeEach(async () => {
      // Create test author
      testAuthor = await Author.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        biography: faker.lorem.paragraph(),
      });

      // Create test book with relationships
      testBook = await booksService.create({
        title: faker.book.title(),
        author: `${testAuthor.firstName} ${testAuthor.lastName}`,
        description: 'A dystopian social science fiction novel.',
        publicationYear: 1949,
        isbn: uuidv4().slice(0, 13),
      });

      // Associate book with author
      await testBook.$add('authors', testAuthor);

      // Add book details
      await BookDetails.create({
        bookId: testBook.id,
        pageCount: 328,
        language: 'English',
        publisher: faker.company.name(),
        edition: 'First Edition',
      });

      // Add review
      await Review.create({
        bookId: testBook.id,
        reviewerName: faker.person.fullName(),
        rating: 4,
        comment: faker.lorem.paragraph(),
      });
    });

    it('should get all books', async () => {
      const response = await fetch(`${server}/books`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as Book[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should get book by valid ID with details and authors', async () => {
      const response = await fetch(
        `${server}/books/${testBook.id}?include=details,authors,reviews`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as Book;
      expect(data.id).toBe(testBook.id);
      expect(data.details).toBeDefined();
      expect(data.authors).toBeDefined();
      expect(data.authors.length).toBe(1);
      expect(data.reviews).toBeDefined();
      expect(data.reviews.length).toBe(1);
    });

    it('should return 404 for non-existent book ID', async () => {
      const nonExistentId = uuidv4();
      const response = await fetch(`${server}/books/${nonExistentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await fetch(`${server}/books/invalid-uuid`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
    });
  });

  describe('UPDATE /books', () => {
    let testBook: Book;
    let testAuthor: Author;

    beforeEach(async () => {
      // Create test author
      testAuthor = await Author.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        biography: faker.lorem.paragraph(),
      });

      // Create test book with relationships
      testBook = await booksService.create({
        title: faker.book.title(),
        author: `${testAuthor.firstName} ${testAuthor.lastName}`,
        description: 'A dystopian social science fiction novel.',
        publicationYear: 1949,
        isbn: uuidv4().slice(0, 13),
      });

      // Associate book with author
      await testBook.$add('authors', testAuthor);

      // Add book details
      await BookDetails.create({
        bookId: testBook.id,
        pageCount: 328,
        language: 'English',
        publisher: faker.company.name(),
        edition: 'First Edition',
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
        description: 'should update publication year only',
        payload: { publicationYear: 1950 },
      },
      {
        description: 'should update isbn only',
        payload: { isbn: '9780451524936' },
      },
      {
        description: 'should update details only',
        payload: {
          details: {
            pageCount: 450,
            language: 'Spanish',
            publisher: 'Updated Publisher',
            edition: 'Second Edition',
          },
        },
      },
      {
        description: 'should update author associations',
        payload: {
          authors: [
            {
              authorId: '', // will be replaced in the test
              role: 'Updated Role',
            },
          ],
        },
      },
      {
        description: 'should update all fields',
        payload: {
          title: faker.book.title(),
          author: faker.person.fullName(),
          description: 'An updated dystopian novel.',
          publicationYear: 1950,
          isbn: '9780451524937',
          details: {
            pageCount: 500,
            language: 'French',
            publisher: 'New Publisher',
            edition: 'Third Edition',
          },
          authors: [], // Remove all authors
        },
      },
    ];

    updateTestCases.forEach(({ description, payload }) => {
      it(description, async () => {
        // If updating author associations, use the real author ID
        if (
          payload.authors &&
          payload.authors.length > 0 &&
          payload.authors[0].authorId === ''
        ) {
          payload.authors[0].authorId = testAuthor.id;
        }

        console.log('payload.authors', payload.authors);

        const response = await fetch(`${server}/books/${testBook.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(response.status).toBe(200);
        const data = (await response.json()) as Book;

        // Verify basic fields
        Object.keys(payload).forEach((key) => {
          if (key !== 'details' && key !== 'authors') {
            expect(data[key]).toBe(payload[key]);
          }
        });

        // Verify details if updated
        if (payload.details) {
          const getResponse = await fetch(
            `${server}/books/${testBook.id}?include=details`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            },
          );

          expect(getResponse.status).toBe(200);
          const getData = (await getResponse.json()) as Book;
          expect(getData.details).toMatchObject(payload.details);
        }

        // Verify authors if updated
        if (payload.authors) {
          const getResponse = await fetch(
            `${server}/books/${testBook.id}?include=authors`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            },
          );

          expect(getResponse.status).toBe(200);
          const getData = (await getResponse.json()) as Book;
          expect(getData.authors.length).toBe(payload.authors.length);
        }
      });
    });

    it('should return 404 when updating non-existent book', async () => {
      const nonExistentId = uuidv4();
      const response = await fetch(`${server}/books/${nonExistentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /books', () => {
    let testBook: Book;
    let bookDetails: BookDetails;
    let review: Review;

    beforeEach(async () => {
      // Create test book with relationships
      testBook = await booksService.create({
        title: faker.book.title(),
        author: faker.person.fullName(),
        description: 'A dystopian social science fiction novel.',
        publicationYear: 1949,
        isbn: uuidv4().slice(0, 13),
      });

      // Add book details
      bookDetails = await BookDetails.create({
        bookId: testBook.id,
        pageCount: 328,
        language: 'English',
        publisher: faker.company.name(),
      });

      // Add review
      review = await Review.create({
        bookId: testBook.id,
        reviewerName: faker.person.fullName(),
        rating: 4,
        comment: faker.lorem.paragraph(),
      });
    });

    it('should delete existing book and related entities', async () => {
      const response = await fetch(`${server}/books/${testBook.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);

      // Verify book is deleted
      const bookResponse = await fetch(`${server}/books/${testBook.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(bookResponse.status).toBe(404);

      // Verify book details are deleted (cascade)
      const details = await BookDetails.findOne({
        where: { id: bookDetails.id },
      });
      expect(details).toBeNull();

      // Verify reviews are deleted (cascade)
      const reviewAfterDelete = await Review.findOne({
        where: { id: review.id },
      });
      expect(reviewAfterDelete).toBeNull();
    });

    it('should return 404 when deleting non-existent book', async () => {
      const nonExistentId = uuidv4();
      const response = await fetch(`${server}/books/${nonExistentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      const response = await fetch(`${server}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${server}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"title":', // Malformed JSON
      });

      expect(response.status).toBe(400);
    });

    it('should handle very long text fields', async () => {
      const longText = 'a'.repeat(5000);
      const response = await fetch(`${server}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: faker.book.title(),
          author: faker.person.fullName(),
          publicationYear: 1949,
          isbn: uuidv4().slice(0, 13),
          description: longText,
        }),
      });

      expect(response.status).toBe(201);

      const data = (await response.json()) as Book;
      expect(data.description).toBe(longText);
    });

    it('should handle circular relationships gracefully', async () => {
      // Create book with circular relationship
      const bookData = {
        title: faker.book.title(),
        author: faker.person.fullName(),
        publicationYear: 1949,
        isbn: uuidv4().slice(0, 13),
      };

      const book = await booksService.create(bookData);

      // Add author that refers back to the same book
      const author = await Author.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      });

      await book.$add('authors', author);

      // Test that GET doesn't cause infinite recursion
      const response = await fetch(
        `${server}/books/${book.id}?include=authors,details,reviews`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as Book;
      expect(data).toBeDefined();
      expect(data.id).toBe(book.id);
    });
  });

  describe('Business Logic Tests', () => {
    it('should maintain data consistency after multiple updates', async () => {
      // Create initial book
      const book = await booksService.create({
        title: faker.book.title(),
        author: faker.person.fullName(),
        description: 'A dystopian social science fiction novel.',
        publicationYear: 1949,
        isbn: uuidv4().slice(0, 13),
      });

      // Create book details
      await BookDetails.create({
        bookId: book.id,
        pageCount: 328,
        language: 'English',
        publisher: 'Original Publisher',
      });

      // Perform multiple updates
      const updates = [
        { title: 'Updated Title 1' },
        { author: 'Updated Author 1' },
        {
          title: 'Updated Title 2',
          author: 'Updated Author 2',
          details: { publisher: 'Updated Publisher' },
        },
      ];

      for (const update of updates) {
        const response = await fetch(`${server}/books/${book.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        expect(response.status).toBe(200);
      }

      // Verify final state
      const response = await fetch(
        `${server}/books/${book.id}?include=details`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as Book;

      expect(data).toMatchObject({
        title: 'Updated Title 2',
        author: 'Updated Author 2',
      });

      expect(data.details).toBeDefined();
      expect(data.details.publisher).toBe('Updated Publisher');
      expect(data.details.pageCount).toBe(328); // Original value should be preserved
    });

    it('should handle adding and removing authors correctly', async () => {
      // Create initial book
      const book = await booksService.create({
        title: faker.book.title(),
        author: faker.person.fullName(),
        publicationYear: 1949,
        isbn: uuidv4().slice(0, 13),
      });

      // Create authors
      const author1 = await Author.create({
        firstName: 'First',
        lastName: 'Author',
      });

      const author2 = await Author.create({
        firstName: 'Second',
        lastName: 'Author',
      });

      // Add first author
      let response = await fetch(`${server}/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authors: [{ authorId: author1.id, role: 'Primary' }],
        }),
      });
      expect(response.status).toBe(200);

      // Verify first author added
      response = await fetch(`${server}/books/${book.id}?include=authors`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      let data = (await response.json()) as Book;
      expect(data.authors.length).toBe(1);
      expect(data.authors[0].id).toBe(author1.id);

      // Replace with second author
      response = await fetch(`${server}/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authors: [{ authorId: author2.id, role: 'Primary' }],
        }),
      });
      expect(response.status).toBe(200);

      // Verify author replacement
      response = await fetch(`${server}/books/${book.id}?include=authors`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      data = (await response.json()) as Book;
      expect(data.authors.length).toBe(1);
      expect(data.authors[0].id).toBe(author2.id);

      // Remove all authors
      response = await fetch(`${server}/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authors: [] }),
      });
      expect(response.status).toBe(200);

      // Verify all authors removed
      response = await fetch(`${server}/books/${book.id}?include=authors`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      data = (await response.json()) as Book;
      expect(data.authors.length).toBe(0);
    });
  });

  describe('Search and Filter Tests', () => {
    beforeEach(async () => {
      // Create test data for search/filter tests
      const testBooks = [
        {
          title: 'Search Book 1',
          author: 'Search Author 1',
          publicationYear: 2020,
          isbn: '9780451524935',
        },
        {
          title: 'Search Book 2',
          author: 'Search Author 2',
          publicationYear: 2021,
          isbn: '9780451524936',
        },
        {
          title: 'Different Title',
          author: 'Search Author 1',
          publicationYear: 2022,
          isbn: '9780451524937',
        },
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
        description: 'should filter books by publication year',
        query: { publicationYear: 2021 },
        expectedCount: 1,
      },
      {
        description: 'should filter books by isbn',
        query: { isbn: '9780451524936' },
        expectedCount: 1,
      },
      {
        description: 'should combine multiple filters',
        query: { title: 'Search', publicationYear: 2020 },
        expectedCount: 1,
      },
    ];

    searchTestCases.forEach(({ description, query, expectedCount }) => {
      it(description, async () => {
        const url = new URL(`${server}/books`);
        Object.keys(query).forEach((key) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          url.searchParams.append(key, query[key]),
        );

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        expect(response.status).toBe(200);
        const data = (await response.json()) as Book[];
        expect(data.length).toBe(expectedCount);
      });
    });
  });
});

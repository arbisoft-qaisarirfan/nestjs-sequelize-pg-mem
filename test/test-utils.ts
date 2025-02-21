/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { getConnectionToken } from '@nestjs/sequelize';
import { AppModule } from '../src/app.module';

import { DataType, newDb } from 'pg-mem';
import { User } from '../src/user/user.entity';
import { Product } from '../src/products/product.entity';
import { Book } from '../src/books/entities/book.entity';
import { BookDetails } from '../src/books/entities/bookDetails.entity';
import { Review } from '../src/books/entities/review.entity';
import { Author } from '../src/books/entities/author.entity';
import { BookAuthor } from '../src/books/entities/bookAuthor.entity';
import { QueryInterface } from 'sequelize';

export function createTestingModule(): TestingModuleBuilder {
  return Test.createTestingModule({
    imports: [AppModule], // Importing main app module
  });
}

export async function cleanupTest(app: INestApplication): Promise<void> {
  await app?.close();
}

export async function resetTestingDatabase(
  app: INestApplication,
): Promise<void> {
  const sequelize: Sequelize = await app.resolve(getConnectionToken());

  if (process.env.NODE_ENV === 'test') {
    console.log('Using in-memory pg-mem database...');
  } else {
    console.log('Using real Postgres database...');
  }
  // await usersMigration(sequelize.getQueryInterface());
  // await productsMigration(sequelize.getQueryInterface());
  // await booksMigration(sequelize.getQueryInterface());
}

export async function createAppFrom(
  testingModule: TestingModuleBuilder,
  truncateDatabase: boolean = true,
): Promise<INestApplication> {
  // process.env.NODE_ENV = 'development';
  const moduleRef = await testingModule
    .overrideProvider(Sequelize)
    .useValue(createInMemorySequelize())
    .compile();
  const app = moduleRef.createNestApplication({ logger: ['error', 'warn'] });

  await app.init();

  if (truncateDatabase) {
    await resetTestingDatabase(app);
  }

  return app;
}

export function createInMemorySequelize(): Sequelize {
  const db = newDb();
  db.public.registerFunction({
    name: 'now',
    returns: DataType.timestamp,
    implementation: () => new Date().toISOString(),
  });
  return new Sequelize({
    dialect: 'postgres',
    dialectModule: db.adapters.createPg(),
    logging: false,
    models: [User, Product, Book, BookDetails, Review, Author, BookAuthor],
    dialectOptions: { useUTC: false },
  });
}

export async function productsMigration(
  queryInterface: QueryInterface,
): Promise<void> {
  const migrations = ['../migrations/20250207145740-products.js'];

  try {
    // Drop tables in reverse order (avoiding FK constraints issues)
    for (const migrationPath of migrations.reverse()) {
      const migration = await import(migrationPath);
      await migration.down(queryInterface, Sequelize);
    }

    // Restore order for creation
    migrations.reverse();

    // Create tables
    for (const migrationPath of migrations) {
      const migration = await import(migrationPath);
      await migration.up(queryInterface, Sequelize);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

export async function usersMigration(
  queryInterface: QueryInterface,
): Promise<void> {
  const migrations = ['../migrations/20250203115647-create-users.js'];

  try {
    // Drop tables in reverse order (avoiding FK constraints issues)
    for (const migrationPath of migrations.reverse()) {
      const migration = await import(migrationPath);
      await migration.down(queryInterface, Sequelize);
    }

    // Restore order for creation
    migrations.reverse();

    // Create tables
    for (const migrationPath of migrations) {
      const migration = await import(migrationPath);
      await migration.up(queryInterface, Sequelize);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

export async function booksMigration(
  queryInterface: QueryInterface,
): Promise<void> {
  const migrations = [
    '../migrations/20250214143721-books.js',
    '../migrations/20250218122804-book-details.js',
    '../migrations/20250218122907-authors.js',
    '../migrations/20250218122945-book-authors.js',
    '../migrations/20250218123023-reviews.js',
  ];

  try {
    // Drop tables in reverse order (avoiding FK constraints issues)
    for (const migrationPath of migrations.reverse()) {
      const migration = await import(migrationPath);
      await migration.down(queryInterface, Sequelize);
    }

    // Restore order for creation
    migrations.reverse();

    // Create tables
    for (const migrationPath of migrations) {
      const migration = await import(migrationPath);
      await migration.up(queryInterface, Sequelize);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

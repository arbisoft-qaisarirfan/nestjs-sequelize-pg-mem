import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { getConnectionToken } from '@nestjs/sequelize';
import { AppModule } from '../src/app.module';

// import { down, up } from '../seeders/20250203120536-demo-users';
import { up as userTable } from '../migrations/20250203115647-create-users';
import { DataType, newDb } from 'pg-mem';
import { User } from '../src/user/user.entity';
import { Product } from '../src/products/product.entity';

export function createTestingModule(): TestingModuleBuilder {
  return Test.createTestingModule({
    imports: [AppModule], // Importing main app module
  });
}

export async function cleanupTest(app: INestApplication) {
  await app?.close();
}

export async function resetTestingDatabase(app: INestApplication) {
  const sequelize: Sequelize = await app.resolve(getConnectionToken());

  if (process.env.NODE_ENV === 'test') {
    console.log('Using in-memory pg-mem database...');
  } else {
    console.log('Using real Postgres database...');
  }
  await userTable(sequelize.getQueryInterface(), Sequelize);
  // await up(sequelize.getQueryInterface()); // Run seeders
}

export async function createAppFrom(
  testingModule: TestingModuleBuilder,
  truncateDatabase: boolean = true,
): Promise<INestApplication> {
  const moduleRef = await testingModule
    .overrideProvider(Sequelize)
    .useValue(createInMemorySequelize())
    .compile();
  const app = moduleRef.createNestApplication({
    logger: ['error', 'warn'],
  });

  await app.init();

  if (truncateDatabase) {
    await resetTestingDatabase(app);
  }

  return app;
}

export function createInMemorySequelize() {
  const db = newDb();
  db.public.registerFunction({
    name: 'now',
    returns: DataType.timestamp,
    implementation: () => new Date().toISOString(),
  });
  return new Sequelize({
    dialect: 'postgres',
    dialectModule: db.adapters.createPg(),
    logging: true,
    models: [User, Product],
    dialectOptions: {
      useUTC: false,
    },
  });
}

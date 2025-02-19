import { ProductService } from './products.service';
import { ProductController } from './products.controller';
import {
  cleanupTest,
  createAppFrom,
  createTestingModule,
  productsMigration,
} from '../../test/test-utils';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { getConnectionToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

describe('ProductService', () => {
  let service: ProductService;
  let app: INestApplication;
  let controller: ProductController;

  beforeEach(async () => {
    const module = createTestingModule();

    app = await createAppFrom(module, true);
    const sequelize: Sequelize = await app.resolve(getConnectionToken());

    await productsMigration(sequelize.getQueryInterface());

    service = app.get<ProductService>(ProductService);
    controller = app.get<ProductController>(ProductController);
  });

  afterEach(async () => {
    await cleanupTest(app);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should successfully create a product with valid data', async () => {
    const productData = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 120.5,
      stock: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await service.create(productData);
    expect(result).toHaveProperty('id');
    expect(result.name).toBe(productData.name);
  });

  it('should fail to create a product with missing name', async () => {
    const productData = {
      description: faker.commerce.productDescription(),
      price: 120.5,
      stock: 50,
    };

    await expect(service.create(productData)).rejects.toThrow();
  });

  it('should fail to create a product with negative price', async () => {
    const productData = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: -50,
      stock: 10,
    };

    await expect(service.create(productData)).rejects.toThrow();
  });

  it('should fail to create a product with negative stock', async () => {
    const productData = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 120,
      stock: -10,
    };

    await expect(service.create(productData)).rejects.toThrow();
  });

  it('should create a product with default stock if not provided', async () => {
    const productData = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 120,
    };

    const result = await service.create(productData);
    expect(result.stock).toBe(0);
  });

  it('should ensure created product has timestamps', async () => {
    const productData = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 120.5,
      stock: 50,
    };

    const result = await service.create(productData);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it('should return all products', async () => {
    const result = await service.findAll();
    expect(result).toBeInstanceOf(Array);
  });

  it('should return an empty array when no products exist', async () => {
    const result = await service.findAll();
    console.log(result);
    expect(result).toEqual([]);
  });

  it('should find a product by ID', async () => {
    const newProduct = await service.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 99.99,
      stock: 25,
    });

    const foundProduct = await service.findOne(newProduct.id);
    expect(foundProduct.id).toBe(newProduct.id);
  });

  it('should throw NotFoundException when product is not found', async () => {
    await expect(service.findOne('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update an existing product', async () => {
    const product = await service.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 50,
      stock: 10,
    });

    const updatedProduct = await service.update(product.id, { price: 100 });
    expect(updatedProduct.price).toBe(100);
  });

  it('should not update a non-existent product', async () => {
    await expect(service.update('invalid-id', { price: 100 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should fail to update a product with negative price', async () => {
    const product = await service.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 50,
      stock: 10,
    });

    await expect(service.update(product.id, { price: -10 })).rejects.toThrow();
  });

  it('should update a product and modify updatedAt timestamp', async () => {
    const product = await service.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 50,
      stock: 10,
    });

    const parseDate = (date: unknown): number => {
      if (typeof date === 'string' || date instanceof Date) {
        return new Date(date).getTime();
      }
      throw new Error('Invalid date format');
    };

    const updatedProduct = await service.update(product.id, { stock: 20 });
    expect(parseDate(updatedProduct.updatedAt)).toBeGreaterThan(
      parseDate(product.updatedAt),
    );
  });

  it('should delete an existing product', async () => {
    const product = await service.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 50,
      stock: 10,
    });

    await service.delete(product.id);
    await expect(service.findOne(product.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when deleting a non-existent product', async () => {
    await expect(service.delete('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should properly delete and return undefined', async () => {
    const product = await service.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 50,
      stock: 10,
    });

    const deleteResult = await service.delete(product.id);
    expect(deleteResult).toBeUndefined();
  });

  it('should delete multiple products correctly', async () => {
    const product1 = await service.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 30,
      stock: 5,
    });

    const product2 = await service.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: 80,
      stock: 12,
    });

    await service.delete(product1.id);
    await service.delete(product2.id);

    await expect(service.findOne(product1.id)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.findOne(product2.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});

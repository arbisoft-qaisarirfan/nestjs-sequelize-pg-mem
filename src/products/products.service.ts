import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreationAttributes } from 'sequelize';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(@InjectModel(Product) private productModel: typeof Product) {}

  async create(data: CreationAttributes<Product>): Promise<Product> {
    if (data.price < 0 || data.stock < 0) {
      throw new Error('Price and stock must be non-negative');
    }
    if (!data.stock) {
      data.stock = 0;
    }
    return this.productModel.create(data);
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.findAll();
  }

  async findOne(id: string): Promise<Product> {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new NotFoundException('Invalid Product ID');
    }

    const product = await this.productModel.findByPk(parsedId);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    if (data.price !== undefined && data.price < 0) {
      throw new Error('Price cannot be negative');
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new NotFoundException('Invalid Product ID');
    }

    const product = await this.findOne(id);
    return product.update(data);
  }

  async delete(id: string): Promise<void> {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new NotFoundException('Invalid Product ID');
    }

    const product = await this.findOne(id);
    await product.destroy();
  }
}

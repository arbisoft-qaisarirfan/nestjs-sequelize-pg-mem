import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class Product extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: string;

  @Column
  name: string;

  @Column
  description: string;

  @Column({ type: DataType.FLOAT })
  price: number;

  @Column
  stock: number;
}

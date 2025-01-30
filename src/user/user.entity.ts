import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column
  name: string;

  @Column({ unique: true })
  email: string;
}

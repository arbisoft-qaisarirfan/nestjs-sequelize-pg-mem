import {
  Column,
  Model,
  Table,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Book } from './book.entity';

@Table
export class BookDetails extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  pageCount: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  language: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  publisher: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  edition: string;

  @ForeignKey(() => Book)
  @Column({
    type: DataType.UUID,
    unique: true, // Ensures one-to-one relationship
  })
  bookId: string;

  @BelongsTo(() => Book)
  book: Book;
}

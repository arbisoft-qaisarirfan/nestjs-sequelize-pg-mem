import {
  Column,
  Model,
  Table,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import { Book } from './book.entity';
import { BookAuthor } from './bookAuthor.entity';

@Table
export class Author extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  lastName: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  birthDate: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  biography: string;

  @BelongsToMany(() => Book, () => BookAuthor)
  books: Book[];

  BookAuthor?: BookAuthor;
}

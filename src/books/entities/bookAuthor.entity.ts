import {
  Column,
  Model,
  Table,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Author } from './author.entity';
import { Book } from './book.entity';

@Table
export class BookAuthor extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Book)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  bookId: string;

  @ForeignKey(() => Author)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  authorId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  role: string; // Could be 'Primary', 'Co-author', 'Editor', etc.
}

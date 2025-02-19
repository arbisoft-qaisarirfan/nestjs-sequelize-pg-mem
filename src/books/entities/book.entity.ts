import {
  Column,
  Model,
  Table,
  DataType,
  BelongsToMany,
  HasOne,
  HasMany,
} from 'sequelize-typescript';
import { BookDetails } from './bookDetails.entity';
import { Review } from './review.entity';
import { Author } from './author.entity';
import { BookAuthor } from './bookAuthor.entity';

@Table
export class Book extends Model {
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
  title: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  author: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  publicationYear: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  isbn: string;

  // One-to-One relation with BookDetails
  @HasOne(() => BookDetails)
  details: BookDetails;

  // One-to-Many relation with Reviews
  @HasMany(() => Review)
  reviews: Review[];

  // Many-to-Many relation with Authors through BookAuthor
  @BelongsToMany(() => Author, () => BookAuthor)
  authors: Author[];
}

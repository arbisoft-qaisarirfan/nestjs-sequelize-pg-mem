import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { BookDetails } from './entities/bookDetails.entity';
import { Review } from './entities/review.entity';
import { Author } from './entities/author.entity';
import { BookAuthor } from './entities/bookAuthor.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Book, BookDetails, Review, Author, BookAuthor]),
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}

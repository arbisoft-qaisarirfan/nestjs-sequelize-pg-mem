import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service';
import {
  CreateAuthorDto,
  CreateBookAuthorDto,
  CreateBookDetailsDto,
  CreateBookDto,
  CreateReviewDto,
} from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Op } from 'sequelize';
import { BookDetails } from './entities/bookDetails.entity';
import { Review } from './entities/review.entity';
import { Author } from './entities/author.entity';
import { BookAuthor } from './entities/bookAuthor.entity';
import { Book } from './entities/book.entity';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createBookDto: CreateBookDto): Promise<Book> {
    return this.booksService.create(createBookDto);
  }

  @Get()
  findAll(
    @Query()
    query: {
      title: string;
      author: string;
      publicationYear: string;
      isbn: string;
    },
  ): Promise<Book[]> {
    const { title, author, publicationYear, isbn } = query;

    console.log('query', query);

    const whereCondition = {};

    if (title) {
      whereCondition['title'] = { [Op.iLike]: `%${title}%` }; // Case-insensitive search
    }

    if (author) {
      whereCondition['author'] = { [Op.iLike]: `%${author}%` };
    }

    if (publicationYear) {
      whereCondition['publicationYear'] = { [Op.eq]: publicationYear };
    }

    if (isbn) {
      whereCondition['isbn'] = { [Op.eq]: isbn };
    }

    return this.booksService.findAll(whereCondition);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Book> {
    const book = await this.booksService.findOne(id);
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: Partial<UpdateBookDto>,
  ): Promise<Book> {
    const book = await this.findOne(id);

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Ensure details updates are correctly applied
    if (updateBookDto.details) {
      await book.details.update(updateBookDto.details);
    }

    // Handle author associations as before
    if (Array.isArray(updateBookDto.authors)) {
      const authorIds = updateBookDto.authors.map((a) => a.authorId);

      await BookAuthor.destroy({
        where: { bookId: book.id, authorId: { [Op.notIn]: authorIds } },
      });

      for (const author of updateBookDto.authors) {
        await BookAuthor.upsert({
          bookId: book.id,
          authorId: author.authorId,
          role: author.role,
        });
      }
    }

    await book.update(updateBookDto);

    return this.findOne(id); // Fetch updated book to return correct values
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    const book = await this.findOne(id);
    return book.destroy();
  }

  @Post('details')
  createBookDetails(
    @Body() createBookDetailsDto: CreateBookDetailsDto,
  ): Promise<BookDetails> {
    return this.booksService.createBookDetails(createBookDetailsDto);
  }

  @Get(':id/details')
  findBookDetails(@Param('id') bookId: string): Promise<BookDetails> {
    return this.booksService.findBookDetails(bookId);
  }

  @Post('reviews')
  createReview(@Body() createReviewDto: CreateReviewDto): Promise<Review> {
    return this.booksService.createReview(createReviewDto);
  }

  @Get(':id/reviews')
  findBookReviews(@Param('id') bookId: string): Promise<Review[]> {
    return this.booksService.findBookReviews(bookId);
  }

  @Post('authors')
  createAuthor(@Body() createAuthorDto: CreateAuthorDto): Promise<Author> {
    return this.booksService.createAuthor(createAuthorDto);
  }

  @Get('authors')
  findAllAuthors(): Promise<Author[]> {
    return this.booksService.findAllAuthors();
  }

  @Get('authors/:id')
  findAuthor(@Param('id') id: string): Promise<Author> {
    return this.booksService.findAuthor(id);
  }

  @Post('book-author')
  associateBookWithAuthor(
    @Body() createBookAuthorDto: CreateBookAuthorDto,
  ): Promise<BookAuthor> {
    return this.booksService.associateBookWithAuthor(createBookAuthorDto);
  }

  @Delete(':bookId/authors/:authorId')
  removeAuthorFromBook(
    @Param('bookId') bookId: string,
    @Param('authorId') authorId: string,
  ): Promise<void> {
    return this.booksService.removeAuthorFromBook(bookId, authorId);
  }
}

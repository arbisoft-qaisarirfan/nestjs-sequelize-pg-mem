import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Book } from './entities/book.entity';
import { BookDetails } from './entities/bookDetails.entity';
import { Review } from './entities/review.entity';
import { Author } from './entities/author.entity';
import { BookAuthor } from './entities/bookAuthor.entity';

import {
  CreateAuthorDto,
  CreateBookAuthorDto,
  CreateBookDetailsDto,
  CreateBookDto,
  CreateReviewDto,
} from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { WhereOptions } from 'sequelize';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book)
    private bookModel: typeof Book,
    @InjectModel(BookDetails)
    private bookDetailsModel: typeof BookDetails,
    @InjectModel(Review)
    private reviewModel: typeof Review,
    @InjectModel(Author)
    private authorModel: typeof Author,
    @InjectModel(BookAuthor)
    private bookAuthorModel: typeof BookAuthor,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    return this.bookModel.create({ ...createBookDto });
  }

  async findAll(where: WhereOptions<any> | undefined): Promise<Book[]> {
    return this.bookModel.findAll({
      where,
      include: [
        { model: BookDetails },
        { model: Review },
        // { model: Author, through: { attributes: ['role'] } },
      ],
    });
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.bookModel.findByPk(id, {
      include: [
        { model: BookDetails },
        { model: Review },
        { model: Author, through: { attributes: ['role'] } },
      ],
    });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
  ): Promise<[number, Book[]]> {
    const [affectedCount, updatedBooks] = await this.bookModel.update(
      { ...updateBookDto },
      { where: { id }, returning: true },
    );
    return [affectedCount, updatedBooks];
  }

  async remove(id: string): Promise<number> {
    return this.bookModel.destroy({ where: { id } });
  }

  async createBookDetails(
    createBookDetailsDto: Partial<CreateBookDetailsDto>,
  ): Promise<BookDetails> {
    return this.bookDetailsModel.create(createBookDetailsDto);
  }

  async findBookDetails(bookId: string): Promise<BookDetails> {
    const details = await this.bookDetailsModel.findOne({ where: { bookId } });
    if (!details) {
      throw new NotFoundException(`Details for book ID ${bookId} not found`);
    }
    return details;
  }

  async createReview(
    createReviewDto: Partial<CreateReviewDto>,
  ): Promise<Review> {
    return this.reviewModel.create(createReviewDto);
  }

  async findBookReviews(bookId: string): Promise<Review[]> {
    return this.reviewModel.findAll({ where: { bookId } });
  }

  async createAuthor(
    createAuthorDto: Partial<CreateAuthorDto>,
  ): Promise<Author> {
    return this.authorModel.create(createAuthorDto);
  }

  async findAllAuthors(): Promise<Author[]> {
    return this.authorModel.findAll({
      include: [{ model: Book, through: { attributes: ['role'] } }],
    });
  }

  async findAuthor(id: string): Promise<Author> {
    const author = await this.authorModel.findByPk(id, {
      include: [{ model: Book, through: { attributes: ['role'] } }],
    });
    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }
    return author;
  }

  async associateBookWithAuthor(
    createBookAuthorDto: Partial<CreateBookAuthorDto>,
  ): Promise<BookAuthor> {
    return this.bookAuthorModel.create(createBookAuthorDto);
  }

  async removeAuthorFromBook(bookId: string, authorId: string): Promise<void> {
    const association = await this.bookAuthorModel.findOne({
      where: { bookId, authorId },
    });
    if (!association) {
      throw new NotFoundException(
        `Association between book ${bookId} and author ${authorId} not found`,
      );
    }
    await association.destroy();
  }
}

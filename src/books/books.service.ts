import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book)
    private bookModel: typeof Book,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    return this.bookModel.create({ ...createBookDto });
  }

  async findAll(where: any): Promise<Book[]> {
    return this.bookModel.findAll({ where });
  }

  async findOne(id: string): Promise<Book | null> {
    return this.bookModel.findOne({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
  ): Promise<[number, Book[]]> {
    const [affectedCount, updatedBooks] = await this.bookModel.update(
      { ...updateBookDto },
      {
        where: { id },
        returning: true,
      },
    );
    return [affectedCount, updatedBooks];
  }

  async remove(id: string): Promise<number> {
    return this.bookModel.destroy({
      where: {
        id,
      },
    });
  }
}

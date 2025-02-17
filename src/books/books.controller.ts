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
  BadRequestException,
  ParseUUIDPipe,
  Req,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { Op } from 'sequelize';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  findAll(
    @Query()
    query: {
      title: string;
      author: string;
      minPrice: string;
      maxPrice: string;
    },
  ): Promise<Book[]> {
    const { title, author, minPrice, maxPrice } = query;

    const whereCondition = {};

    if (title) {
      whereCondition['title'] = { [Op.iLike]: `%${title}%` }; // Case-insensitive search
    }

    if (author) {
      whereCondition['author'] = { [Op.iLike]: `%${author}%` };
    }

    if (minPrice || maxPrice) {
      whereCondition['price'] = {};
      if (minPrice) whereCondition['price'][Op.gte] = Number(minPrice);
      if (maxPrice) whereCondition['price'][Op.lte] = Number(maxPrice);
    }

    return this.booksService.findAll(whereCondition);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const book = await this.booksService.findOne(id);
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    const book = await this.findOne(id);
    return book.update(updateBookDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const book = await this.findOne(id);
    return book.destroy();
  }
}

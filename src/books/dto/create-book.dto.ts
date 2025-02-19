import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateBookDetailsDto {
  readonly pageCount: number;
  readonly language: string;
  readonly publisher: string;
  readonly edition: string;
  readonly bookId: string;
}

export class CreateReviewDto {
  readonly reviewerName: string;
  readonly rating: number;
  readonly comment?: string;
  readonly bookId: string;
}

export class CreateAuthorDto {
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate?: Date;
  readonly biography?: string;
}

export class CreateBookAuthorDto {
  readonly bookId: string;
  readonly authorId: string;
  readonly role?: string;
}

export class CreateBookDto {
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @MaxLength(100, { message: 'Title cannot be longer than 100 characters' })
  readonly title: string;

  @IsString()
  @IsNotEmpty({ message: 'Author cannot be empty' })
  @MaxLength(100, { message: 'Author cannot be longer than 100 characters' })
  readonly author: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  readonly description?: string;

  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  readonly publicationYear?: number;

  @IsString()
  readonly isbn?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBookDetailsDto)
  details?: CreateBookDetailsDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateBookAuthorDto) // Ensure authors are validated correctly
  authors?: CreateBookAuthorDto[];
}

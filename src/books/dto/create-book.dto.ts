import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

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

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  readonly price?: number;
}

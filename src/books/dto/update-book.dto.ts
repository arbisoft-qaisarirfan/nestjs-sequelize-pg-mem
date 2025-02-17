import { CreateBookDto } from './create-book.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBookDto extends CreateBookDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly title: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly author: string;
}

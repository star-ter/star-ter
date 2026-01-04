import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  commercialCode: string;

  @IsString()
  @IsNotEmpty()
  commercialName: string;
}

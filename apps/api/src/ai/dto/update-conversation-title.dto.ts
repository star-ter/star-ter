import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateConversationTitleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;
}

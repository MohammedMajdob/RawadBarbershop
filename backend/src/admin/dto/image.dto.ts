import { IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength, IsArray, ArrayMinSize } from 'class-validator';

export class AddImageDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}

export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}

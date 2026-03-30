import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

export class JoinWaitlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^0\d{9}$/, { message: 'מספר טלפון לא תקין' })
  phone: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'פורמט תאריך לא תקין (YYYY-MM-DD)' })
  preferredDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

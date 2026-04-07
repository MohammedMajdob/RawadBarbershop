import { IsString, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class StartBookingDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'נא להזין שם ומשפחה' })
  @Matches(/^[\p{L}]+(\s[\p{L}]+)+$/u, { message: 'נא להזין שם ומשפחה' })
  name: string;

  @IsString()
  @Matches(/^05\d{8}$/, { message: 'מספר טלפון לא תקין' })
  phone: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'פורמט תאריך לא תקין (YYYY-MM-DD)' })
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'פורמט שעה לא תקין (HH:mm)' })
  time: string;
}

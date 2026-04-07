import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class ManualBookingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[\p{L}]+(\s[\p{L}]+)+$/u, { message: 'נא להזין שם ומשפחה' })
  name: string;

  @IsString()
  @Matches(/^0\d{9}$/, { message: 'מספר טלפון לא תקין' })
  phone: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'פורמט תאריך לא תקין (YYYY-MM-DD)' })
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'פורמט שעה לא תקין (HH:mm)' })
  time: string;
}

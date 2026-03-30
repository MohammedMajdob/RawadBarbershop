import { IsString, Matches, Length } from 'class-validator';

export class SendAdminOtpDto {
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'מספר טלפון לא תקין' })
  phone: string;
}

export class VerifyAdminOtpDto {
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'מספר טלפון לא תקין' })
  phone: string;

  @IsString()
  @Length(4, 8)
  code: string;
}

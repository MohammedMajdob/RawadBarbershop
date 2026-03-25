import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @Length(6, 6, { message: 'קוד OTP חייב להיות 6 ספרות' })
  otpCode: string;
}

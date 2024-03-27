import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsEmail, IsOptional, Matches, MaxLength } from "class-validator";

export function transformPhone(value: string) {
    if (!value) {
      return value;
    }

    value = value.replace(/^\+88/, '');

    value = value.replace(/[-\s]/g, '');

    return value;
  }



export class CreatePreRegistrationDto {
    @ApiProperty()
    @IsDefined({message: 'নাম লেখা বাধ্যতামূলক'})
    fullName: string

    @ApiProperty()
    @IsEmail({}, {message: "আপনার সঠিক ইমেইল এড্রেস দিন"})
    email: string

    @ApiProperty()
    @Matches(/^(\+?88)?01\d{9}$/, { message: 'সঠিক মোবাইল নম্বর বাধ্যতামূলক' }) 
    mobileNumber: string;
  
    @ApiPropertyOptional()
    @IsOptional()
    @MaxLength(3000, {message: "মন্তব্য 3000 অক্ষরের বেশি হওয়া যাবে না"})
    comment: string

}

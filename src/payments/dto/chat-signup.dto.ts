import {  ApiProperty } from "@nestjs/swagger";

export class ChatSignupDto {
    @ApiProperty()
    userId: number

    @ApiProperty()
    batchTitle: any

    @ApiProperty()
    supportBoard: string

}


export class ChatSignUpForAllStudentDto {
    @ApiProperty()
    courseId: number

    @ApiProperty()
    supportBoard: string
}
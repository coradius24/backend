import { ApiProperty } from "@nestjs/swagger";

export class UpsertPageDto {
    @ApiProperty()
    id: string;

    @ApiProperty({default: {}})
    content: any;
}

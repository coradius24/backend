import { ApiPropertyOptional } from "@nestjs/swagger";


export class FileUploadQueryDto {
    @ApiPropertyOptional({
        description: 'File Id to delete',
    })
    deleteFile?: number
}
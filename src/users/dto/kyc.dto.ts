import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsEnum } from 'class-validator';
import { KYC_DOCUMENT_TYPE } from "../enums/user.enums";

export class KycDocumentDto {

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary', description: 'Document front photo', required: false
    })
    frontPhoto?: any;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary', description: 'Document back photo', required: false
    })
    backPhoto?: any;


    @ApiProperty({ default: KYC_DOCUMENT_TYPE.NID })
    @IsDefined()
    @IsEnum(KYC_DOCUMENT_TYPE)
    documentType?: KYC_DOCUMENT_TYPE;

    @ApiProperty()
    @IsDefined()
    meta: string
}


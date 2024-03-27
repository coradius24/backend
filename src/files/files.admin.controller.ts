import { FileInterceptor } from '@nestjs/platform-express';
import {  Controller, Put, Query, Req, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { FileUploadDto } from './dto/file-upload.dto';
import { FileUploadQueryDto } from './dto/file-upload-query.dto';

@ApiTags('Files')
@Controller('admin/files')
export class FilesAdminController {
  constructor(private readonly filesService: FilesService) {}

  @Put()
  @ApiConsumes('multipart/form-data') 
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file'),
  )
  @UseGuards(AuthGuard) 
  @ApiBody({
    description: 'Any kind of file upload',
    type: FileUploadDto,
  })
  async uploadFile(@Req() request: any, @Query() fileUploadQuery: FileUploadQueryDto , @UploadedFile() file) {
    return await this.filesService.uploadPublicFile(file?.buffer, file?.originalname, fileUploadQuery);
  }
}

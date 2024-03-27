import { FileUploadQueryDto } from './dto/file-upload-query.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import PublicFile from 'src/files/entities/publicFile.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(PublicFile)
    private publicFilesRepository: Repository<PublicFile>,
    private configService : ConfigService
  ) {}
 
  async uploadPublicFile(dataBuffer: Buffer, filename: string, extraQuery?: FileUploadQueryDto, extraHeader?: any) {
    
    const s3 = new S3();
    const uploadResult = await s3.upload({
      Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
      Body: dataBuffer,
      Key: `${uuid()}-${filename}`,
      ...(extraHeader||{})
    })
      .promise();
 
    const newFile = this.publicFilesRepository.create({
      key: uploadResult.Key,
      url: `https://${this.configService.get('AWS_CLOUDFRONT')}/${uploadResult.Key}`,
    });
    await this.publicFilesRepository.save(newFile);
    if(extraQuery?.deleteFile) {
      try {
        await this.deletePublicFile(extraQuery.deleteFile)
      } catch (error) {
        console.log("Failed to delete file: ", extraQuery.deleteFile)
      }
     }
    return newFile;
  }

  async uploadMultiplePublicFile(files: { buffer: Buffer, originalname: string }[]) {
    const s3 = new S3();
  
    // Upload all files in parallel using Promise.all
    const uploadPromises = files.map(async (file) => {
      const uploadResult = await s3.upload({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
        Body: file.buffer,
        Key: `${uuid()}-${file.originalname}`
      }).promise();
  
      const newFile = this.publicFilesRepository.create({
        key: uploadResult.Key,
        url: `https://${this.configService.get('AWS_CLOUDFRONT')}/${uploadResult.Key}`,
      });
  
      await this.publicFilesRepository.save(newFile);
  
      return newFile;
    });
  
    const uploadedFiles = await Promise.all(uploadPromises);
  
  
    return uploadedFiles;
  }
  
  async deletePublicFile(fileId: number) {
    const file = await this.publicFilesRepository.findOne({ where: { id: fileId} });
    const s3 = new S3();
    await s3.deleteObject({
      Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
      Key: file.key,
    }).promise();
    await this.publicFilesRepository.delete(fileId);
  }
  
  async deletePublicFiles(fileIds: number[]) {
    const s3 = new S3();
    
    const fileDeletionPromises = fileIds.map(async (fileId) => {
      const file = await this.publicFilesRepository.findOne({ where: { id: fileId } });
  
      if (file) {
        await s3.deleteObject({
          Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
          Key: file.key,
        }).promise();
  
        await this.publicFilesRepository.delete(fileId);
      }
    });
  
    // Wait for all file deletions to complete in parallel
    await Promise.all(fileDeletionPromises);
  }
  
  getFileById(fileId: number) {
    return this.publicFilesRepository.findOneBy({id: fileId})
  }
}

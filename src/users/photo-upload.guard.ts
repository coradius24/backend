import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class PhotoUploadGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    // Check if a file was uploaded
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    // Check if the uploaded file is an image (you can add more image types as needed)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException('Only image files are allowed', HttpStatus.BAD_REQUEST);
    }

    // Check if the file size is within the allowed limit (1 MB)
    if (file.size > 1024 * 1024) {
      throw new HttpException('File size exceeds the limit of 1 MB', HttpStatus.BAD_REQUEST);
    }

    return true;
  }
}

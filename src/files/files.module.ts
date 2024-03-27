import { Global, Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import PublicFile from './entities/publicFile.entity';
import { FilesAdminController } from './files.admin.controller';

@Global()
@Module({
  controllers: [FilesAdminController],
  providers: [FilesService],
  imports: [TypeOrmModule.forFeature([PublicFile])], 
  exports: [FilesService],
})
export class FilesModule {}

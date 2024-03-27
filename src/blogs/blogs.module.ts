import { BlogCategory } from './entities/blog-category.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { Blog } from './entities/blog.entity';
import { BlogsAdminController } from './blogs.admin.controller';
import { BlogComment } from './entities/blog-comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog, BlogCategory, BlogComment])],
  controllers: [BlogsController, BlogsAdminController],
  providers: [BlogsService],
})
export class BlogsModule {}

import { FeatureGuard } from './../auth/feature.guard';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { BlogsService } from './blogs.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@ApiTags('Blogs')
@Controller('admin/blogs')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)
export class BlogsAdminController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogsService.create(createBlogDto);
  }

  @Get()
  findAll(@Query() paginationQuery: PaginationDto) {
    return this.blogsService.findAll(paginationQuery);
  }


  @Post('/categories')
  createCategory(@Body() createBlogCategoryDto: CreateBlogCategoryDto) {
    return this.blogsService.createCategory(createBlogCategoryDto);
  }

  @Get('/categories')
  findAllCategory() {
    return this.blogsService.findAllCategories();
  }

  @Delete('/categories/:id')
  deleteCategory(@Param('id')  id: number) {
    return this.blogsService.deleteCategory( id);
  }

  @Patch('/categories/:id')
  updateCategory(@Param('id')  id: number,  @Body() createBlogCategoryDto: CreateBlogCategoryDto) {
    return this.blogsService.updateCategory(id, createBlogCategoryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogsService.update(+id, updateBlogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogsService.remove(+id);
  }
}

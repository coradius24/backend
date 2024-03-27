import { BlogCommentStatus } from './enums/blog.enum';
import { AuthGuard } from './../auth/auth.guard';
import { Body, Controller, Get,  Param, Post, Query, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { BlogsService } from './blogs.service';
import { CreateBlogCommentDto } from './dto/create-comment.dto';
// import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get('/popular') 
  getPopularBlogs() {
    return this.blogsService.getPopularBlogs()
  }
  @Get()
  // @UseInterceptors(CacheInterceptor)
  findAll(@Query() paginationQuery: PaginationDto) {
    return this.blogsService.findAll(paginationQuery, 'active');
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.blogsService.findOneBySlug(slug);
  }

  @Get('comments/:blogSlug') 
  getCommentsOfABlog(@Param('blogSlug') blogSlug: string, @Query() paginationDto: PaginationDto) 
  {
    return this.blogsService.commentsOfABlog(blogSlug, paginationDto, BlogCommentStatus.APPROVED);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('comment')
  createComment(@Request() req, @Body() createCommentDto: CreateBlogCommentDto) {
    return this.blogsService.createComment(req.user.sub , createCommentDto);
  }



  updateComment(@Param('id') id: number, @Request() req, @Body() createCommentDto: CreateBlogCommentDto) {
    return this.blogsService.updateComment(req.user.sub ,  id, createCommentDto);
  }

  deleteComment(@Param('id') id: number, @Request() req) {
    return this.blogsService.deleteComment(req.user.sub ,  id);
  }
}

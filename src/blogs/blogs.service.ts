import { CreateBlogCommentDto } from './dto/create-comment.dto';
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { customAlphabet, urlAlphabet } from 'nanoid';
import slugify from 'slugify';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogCategory } from './entities/blog-category.entity';
import { Blog } from './entities/blog.entity';
import { BlogComment } from './entities/blog-comment.entity';
import { sanitizeAndTruncateString } from 'src/common/utils/utils';

@Injectable()
export class BlogsService {
  constructor(@InjectRepository(Blog) private blogsRepository: Repository<Blog>,
    @InjectRepository(BlogCategory) private blogCategoryRepository: Repository<BlogCategory>,
    @InjectRepository(BlogComment) private blogCommentRepository: Repository<BlogComment>,

  ) { }
  async create(createBlogDto: CreateBlogDto) {
    let slug = createBlogDto.title?.replace('&', 'and')
    slug = slugify(slug, {
      lower: true,
      strict: true,
      trim: true
    })

    const blogWithSlug = await this.blogsRepository.findOneBy({
      slug: slug,
    })

    if (blogWithSlug) {
      const nanoid = customAlphabet(urlAlphabet, 5)
      slug += '-' + nanoid()?.toLowerCase()
    }
    const category = await this.blogCategoryRepository.findOneBy({ id: createBlogDto.categoryId })
    if (createBlogDto.thumbnailId === 0) {
      delete createBlogDto.thumbnailId
    }
    if (!category) {
      throw new BadRequestException('The Blog category does not found')
    }
    return this.blogsRepository.insert({ ...createBlogDto, slug });
  }

  async createCategory(createBlogCategoryDto) {
    return this.blogCategoryRepository.insert(createBlogCategoryDto);
  }


  async getPopularBlogs() {
    // TODO popular blogs  

    const blogs = await this.blogCommentRepository.createQueryBuilder('blogComment')
    .select(['blogComment.blogId', 'COUNT(blogComment.blogId) as commentCount'])
    .leftJoinAndSelect('blogComment.blog', 'blog')
    .leftJoinAndSelect('blog.category', 'blogCategory')
    .select([
      'blogComment.blogId as blogComment_blogId',
      'blog.id as blog_id',
      'blog.title as blog_title',
      'blog.slug as blog_slug',
      'blog.body as blog_body',
      'blog.categoryId as blog_categoryId',
      'blog.authorId as blog_authorId',
      'blog.thumbnailId as blog_thumbnailId',
      'blog.status as blog_status',
      'blog.createdAt as blog_createdAt',
      'blog.updatedAt as blog_updatedAt',
      'blogCategory.id as blogCategory_id',
      'blogCategory.name as blogCategory_name',
      'blogCategory.colorCode as blogCategory_colorCode',
      'COUNT(blogComment.blogId) as commentCount',
    ])
  
    .groupBy('blogComment.blogId')
    .orderBy('commentCount', 'DESC')
    .take(4)
    .getRawMany();
   return  blogs.map((blog) => {
      blog.blog_body = sanitizeAndTruncateString(blog.blog_body, 100);
      return blog;
    });


  }

  async findOneBySlug(slug: string) {
    try {
      const blog = await this.blogsRepository.findOneOrFail({
        where: {
          slug
        },
        relations: {
          author: {
            profile: true
          }
        }
      })
      return {
        id: blog.id,
        title: blog.title,
        metaDescription: blog.metaDescription,
        metaKeywords: blog.metaKeywords,
        body: blog.body,
        slug: blog.slug,
        thumbnail: blog?.thumbnail?.url || null,
        status: blog?.status,
        category: blog?.category,
        createdAt: blog?.createdAt,
        author: {
          id: blog?.author?.id, 
          fullName: blog?.author?.fullName,
          photo: blog?.author?.photo?.url || null,
          biography: blog?.author?.profile?.biography || '',
          socialLinks: blog?.author?.profile?.socialLinks,  
        },
      }
    } catch (error) {
      throw new NotFoundException('Blog not found by this slug')
    }
    

  }

  async  findAllCategories() {
    return this.blogCategoryRepository.find()
  }


  async findAll({limit = 10, page = 1}: PaginationDto, status?) {
    const skip = (page - 1) * limit;
    const take = limit;
    
    const query: any = {
    }
    const order: any = {
      id: 'DESC',
    }

    if(status) {
      query.status = status
    }

    const [blogs, totalCount] = await this.blogsRepository.findAndCount({
      where: query,
      order,
      skip,
      take,
      relations: {
        author: false     
      },
    });
    const formattedBlogs = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      body: sanitizeAndTruncateString(blog?.body, 100),
      slug: blog.slug,
      category: blog?.category,
      createdAt: blog?.createdAt,
      thumbnail: blog?.thumbnail?.url || null,
      status: blog?.status,
     
    }));
    
    return  {
      results : formattedBlogs,
      totalCount,
      page,
      limit,
    }

  }

  findOne(id: number) {
    return `This action returns a #${id} blog`;
  }

  update(id: number, updateBlogDto: UpdateBlogDto) {
    return this.blogsRepository.update(id, updateBlogDto);
  }

  remove(id: number) {
    return this.blogsRepository.delete(id);
  }

  deleteCategory(id: number) {
    return this.blogCategoryRepository.delete(id);
  }

  updateCategory(id: number, updateDto) {
    return this.blogCategoryRepository.update(id, updateDto);
  }

  async createComment(userId, createCommentDto: CreateBlogCommentDto) {
    const blog = await this.blogsRepository.findOneBy({id: createCommentDto.blogId})
    if(!blog) {
      throw new NotFoundException('No Blog with this id')
    }
    return this.blogCommentRepository.insert({...createCommentDto, userId})
  }

  async commentsOfABlog(slug, {limit = 10, page = 1}: PaginationDto, status?) {
    const skip = (page - 1) * limit;
    const take = limit;
    const blog = await this.blogsRepository.findOneBy({slug})
    if(!blog) {
      throw new NotFoundException('No Blog with this slug')
    }
    const query:any = {
      blogId: blog.id
    }
    if(status) {
      query.status = status
    }

    const order: any= {
      id: 'DESC',
    }
    const [comments, totalCount] = await this.blogCommentRepository.findAndCount({
      where: query,
      order,
      skip,
      take,
     
    });
    const formattedComments = comments.map((comment) => ({
      title: comment.comment,
      createdAt: comment?.createdAt,
      commenter: {
        fullName: comment?.user?.fullName,
        photo: comment?.user?.photo?.url,
      },
    }));
    
    return  {
      results : formattedComments,
      totalCount,
      page,
      limit,
    }

  }
  updateComment(userId, id, createCommentDto: CreateBlogCommentDto) {
    const comment = this.blogCommentRepository.findBy({userId, id})
    if(!comment) {
      throw new ForbiddenException('The comment not owned by you');
    }
    return this.blogCommentRepository.update(id, createCommentDto)
  }

  deleteComment(userId, id) {
    const comment = this.blogCommentRepository.findBy({userId, id})
    if(!comment) {
      throw new ForbiddenException('The comment not owned by you');
    }
    return this.blogCommentRepository.delete(id)
  }
}

import {  Controller, Get  } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { CourseCategoryService } from './course-category.service';
import CategoryDto from './dto/course-categories.dto';

@ApiTags('CourseCategory')
@Controller('categories')
export class CourseCategoryController {
  constructor(private readonly courseCategoryService: CourseCategoryService) {}

  @Get('/')
  @ApiOkResponse({ status: 200, type: [CategoryDto]})
  getCourses() {
    return this.courseCategoryService.getNestedCategories()
  }
  
 
}

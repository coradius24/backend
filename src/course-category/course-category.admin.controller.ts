import { UpdateCourseCategoryDto } from './dto/update-course-category.dto';
import { FeatureGuard } from 'src/auth/feature.guard';
import { Body, Param, Controller, Delete, Post, UseGuards, Patch  } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CourseCategoryService } from './course-category.service';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { AuthGuard } from 'src/auth/auth.guard';
@ApiTags('CourseCategory')
@Controller('admin/categories')
@UseGuards(AuthGuard, FeatureGuard)
@ApiBearerAuth()
export class CourseCategoryAdminController {
  constructor(private readonly courseCategoryService: CourseCategoryService) {}

  @Post('/')
  createCategory(@Body() payload: CreateCourseCategoryDto) {
    return this.courseCategoryService.createCategory(payload)
  }

  @Patch(':id')
  updateCategory(@Param('id') id: number, @Body() payload: UpdateCourseCategoryDto) {
    return this.courseCategoryService.updateCategory(id, payload)
  }
  
  @Delete(':id')
  deleteCategory(@Param('id') id: number) {
    return this.courseCategoryService.deleteCategory(id)
  }
  
  
}

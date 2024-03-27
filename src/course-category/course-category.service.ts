import { CourseCategory } from 'src/course-category/entities/course-category.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { customAlphabet, urlAlphabet } from 'nanoid'

@Injectable()
export class CourseCategoryService {
    constructor(@InjectRepository(CourseCategory) private categoryRepository: Repository<CourseCategory>) {}

    async createCategory(payload) {
        // eslint-disable-next-line prefer-const
        let {name, parent, icon, colorCode} = payload;
        let slug  = name?.replace('&', 'and')
        slug = slugify(name, {
            lower: true,
            strict: true,    
            trim: true         
        })
        if(await this.categoryRepository.findBy({slug})) {
            const nanoid = customAlphabet(urlAlphabet, 5)
            slug += '-' + nanoid()?.toLowerCase()
        }
        return await this.categoryRepository.insert({
            name,
            slug,
            parent,
            icon, 
            colorCode
        })
    }
    async getCategories() {
        return await this.categoryRepository.find({});
    }

    updateCategory(id:number, payload) {
        return this.categoryRepository.update(id, payload)
    }

    deleteCategory(id: number) {
        return this.categoryRepository.delete(id)
    }

    async getCategoriesAndSubCategoriesBySlug(slug: string) {
        const category = await this.categoryRepository.findOneBy({slug});
        let categories = [category]
        if(!category?.parent) {
          const subCategories : any =  await this.categoryRepository.findBy({parent: category?.id})
          categories = [category, ...subCategories]
        }

        return categories
    }
    async getNestedCategories(): Promise<any[]> {
        const topLevelCategories = await this.categoryRepository.find({ where: { parent: 0 } });

        const categoriesWithCounts = [];

        for (const category of topLevelCategories) {
            const subCategories = await this.getSubCategories(category);
            // const courseCount = await this.calculateCourseCount(category);
            
            const categoryWithCounts = {
                id: category.id,
                name: category.name,
                slug: category.slug,
                thumbnail: category.thumbnail,
                icon: category.icon,
                colorCode: category.colorCode,
                courseCount: subCategories.reduce((acc, crr) => acc + crr?.courseCount ,0),
                subCategory: subCategories,
            };

            categoriesWithCounts.push(categoryWithCounts);
        }

        return categoriesWithCounts;
    }

    async getSubCategories(parentCategory: CourseCategory): Promise<any[]> {
        const subCategories = await this.categoryRepository.find({ where: { parent: parentCategory.id } });

        const subCategoriesWithCounts = await Promise.all(
            subCategories.map(async (subCategory) => {
                const courseCount = await this.calculateCourseCount(subCategory);
                return {
                    id: subCategory.id,
                    name: subCategory.name,
                    slug: subCategory.slug,
                    thumbnail: subCategory.thumbnail,
                    icon: subCategory.icon,
                    colorCode: subCategory.colorCode,
                    courseCount,
                };
            })
        );

        return subCategoriesWithCounts;
    }

    async calculateCourseCount(category: CourseCategory): Promise<number> {
        const query = this.categoryRepository
            .createQueryBuilder('course_categories')
            .leftJoin('course_categories.courses', 'courses')
            .where('course_categories.id = :categoryId', { categoryId: category.id })
            .andWhere('courses.status = :courseStatus', { courseStatus: 'active' })

            .select('COUNT(courses.id) as courseCount');

        

        const result = await query.getRawOne();
        return parseInt(result.courseCount);
    }
}

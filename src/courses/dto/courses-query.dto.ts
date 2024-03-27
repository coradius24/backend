import { ContentType, CourseLevel } from './../enums/course.enums';
import {  ApiPropertyOptional } from "@nestjs/swagger";
enum PriceOption {
    FREE = 'free',
    PAID = 'paid',
    ALL = 'all',
}


enum SortBy {
    NEWEST= 'newest',
    FEATURED= 'featured',
    HIGHEST_RATINGS= 'highest-rating',
    DISCOUNTED='discounted',
    LOWEST_PRICE = 'lowest-price',
    HIGHEST_PRICE = 'highest-price'
}
export class CoursesQuery   {
    @ApiPropertyOptional({
        type: 'enum',
        enum: PriceOption,
        default: PriceOption.ALL
    })
    price: string;


    @ApiPropertyOptional({
        type: 'enum',
        enum: CourseLevel,
        default: 'all'
    })
    level: string;

    @ApiPropertyOptional(
        {
            default: 'all'
        }
    )
    rating: string;

    @ApiPropertyOptional({
        default: 'all'
    })
    category: string;

    @ApiPropertyOptional({
        type: 'enum',
        enum: SortBy,
        default: SortBy.NEWEST
    })   
    sort_by: string;

    @ApiPropertyOptional({
        type: 'enum',
        enum: ContentType,
        default: 'all'
    })   
    contentType: string;

    @ApiPropertyOptional()   
    search: string;
}
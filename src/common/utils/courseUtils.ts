export function pruneCourse(course){
    return ({
        id: course.id,
        title: course.title,
        contentType: course.contentType,
        price: course.price,
        discountedPrice: course.discountedPrice,
        rating: course.rating,
        totalLessons: course.totalLessons,
        totalLessonsInMinute: course.totalLessonsInMinute,
        discountFlag: course.discountFlag,
        isFeaturedCourse: course.isFeaturedCourse,
        isTopCourse: course.isTopCourse,
        thumbnail: course.thumbnail ? course.thumbnail.url : null,
        parentCourseId: course.parentCourseId,
        allowSmartLinkGeneration: course.allowSmartLinkGeneration, 
        enableDripContent: course.enableDripContent,
        category: {
          id: course.category ? course.category.id : null,
          slug: course.category ? course.category.slug : null,
          name: course.category ? course.category.name : null,
          colorCode: course.category ? course.category.colorCode : null,
        },
        instructor: {
          id: course?.instructor?.id,
          fullName: course?.instructor?.fullName,
          photo: course?.instructor?.photo?.url || null,
          title: course?.instructor?.profile?.title || ''
        }  ,
        batchTitle: course?.batchTitle,
        ...(course?.isFeaturedCourse ? {shortDescription: course?.shortDescription || ""} : {}),
      })
}
export function pruneCourses (courses)  {
    return courses.map((course) => (pruneCourse(course)))
}
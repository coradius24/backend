export enum CourseLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
}
  
export enum ContentType {
    RECORDED = 'recorded',
    LIVE = 'live',
}

export enum CourseSupportDepartment {
    cpa = 'cpa-beta',
    data = 'data-beta',
}

export enum CourseStatus {
    ACTIVE = 'active',
    PRIVATE = 'private',
    // ARCHIVED = 'archived',
    COMPLETED = 'completed'
}

  
export enum VideoType {
    YOUTUBE = 'YouTube',
    VIMEO = 'vimeo',
    CUSTOM_URL = 'customUrl',
}

export enum LessonType {
    VIDEO = 'video',
    UPCOMING_LIVE_CLASS = 'upcomingLiveClass',
    LIVE_CLASS_RECORD = 'liveClassRecord',
    ARTICLE = 'article',
    FEEDBACK = 'feedback'
}

export enum AttachmentType {
    ID = 'id',
    URL = 'url',
}
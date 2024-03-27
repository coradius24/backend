export enum  NotificationRoomPrefix  {
    specificCourse  = 'specificCourse:',
    batchCourseParent  = 'batchCourseParent:',
    courseCategory  = 'courseCategory:',
    enrollment_updates_notification = 'enrollment_updates_notification',
    fullPaidCourses = 'fullPaidCourses:',
    coursesWithDues = 'coursesWithDues:',
    // payment_updates_notification  = 'payment_updates_notification:',
    // all_assignment_submission_updates_notification  = 'all_assignment_submission_updates_notification:',
    // my_assignment_submission_updates_notification  = 'my_assignment_submission_updates_notification:',
    // withdraw_updates_notification  = 'withdraw_updates_notification:',
    // refund_updates_notification  = 'refund_updates_notification:',

}

export const  SOCKET_USER_CACHE_HASH_MAP = `activeUsers`
export const  ACTIVE_SOCKET_USER_ID_MAP = `socketUserIdMap`
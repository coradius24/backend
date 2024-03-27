export enum NotificationReceiver {
    ALL = 'all',
    INDIVIDUAL_USERS = 'individualUsers',
    SPECIFIC_COURSES = 'specificCourses',
    BATCH_COURSE_PARENTS = 'batchCourseParents',
    COURSE_CATEGORIES = 'courseCategories',
    HAVING_DUES_OF_SPECIFIC_COURSES = 'havingDuesOfSpecifCourses',
    FULL_PAID_COURSES = 'fullPaidCourses',
    // specials
    PAYMENT_UPDATES_ADMIN_RECEIVER  = 'payment_updates_notification_admin_receiver',
    ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER  = 'all_assignment_submission_updates_notification_admin_receiver',
    MY_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER  = 'my_assignment_submission_updates_notification_admin_receiver',
    // WITHDRAW_UPDATES_ADMIN_RECEIVER  = 'withdraw_updates_notification_admin_receiver',
    PENDING_WITHDRAW_UPDATES_ADMIN_RECEIVER  = 'pending_withdraw_updates_notification_admin_receiver',
    AWAITING_WITHDRAW_UPDATES_ADMIN_RECEIVER  = 'awaiting_withdraw_updates_notification_admin_receiver',
    REFUND_UPDATES_ADMIN_RECEIVER = 'refund_updates_notification_admin_receiver',

}

export enum NotificationType {
    SYSTEM_GENERATED = 'systemGenerated',
    MANUAL_NOTIFICATION = 'manualNotification',
    CLASS_NOTIFICATION = 'classNotification',
    ADMIN_NOTIFICATION = 'adminNotification',
    NOTICE = 'notice',
}

export enum AdminNotificationChannel {
    PaymentUpdates = 'payment_updates_notification',
    AllAssignmentSubmissionUpdates = 'all_assignment_submission_updates_notification',
    MyAssignmentSubmissionUpdates = 'my_assignment_submission_updates_notification',
    AwaitingWithdrawUpdates = 'awaiting_withdraw_updates_notification',
    PendingWithdrawUpdates = 'pending_withdraw_updates_notification',
    RefundUpdates = 'refund_updates_notification',
}

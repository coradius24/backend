import { FEATURES } from './features.constants';
import { ROLE } from './../../users/enums/user.enums';
const ADMIN_FEATURES = [
  FEATURES['student_portal'],
  // Notice
  FEATURES['send_notification'],
  FEATURES['notice_board'],
  FEATURES['create_notice'],
  FEATURES['update_notice'],
  FEATURES['delete_notice'],
  FEATURES['create_notice_dept'],
  FEATURES['delete_notice_dpt'],
  FEATURES['get_notice_dpt'],
  // Charts
  FEATURES['payouts_pie_chart'],
  FEATURES['payments_line_chart'],
  FEATURES['payments_pie_chart'],
  FEATURES['enrollments_line_chart'],
  FEATURES['clicks_line_chart'],
  // User management
  FEATURES['user_management'],
  FEATURES['students'],
  FEATURES['admins'],
  FEATURES['instructors'],
  FEATURES['create_user'],
  FEATURES['update_user'],
  FEATURES['user_selected'],
  FEATURES['user_select'],
  FEATURES['get_user_by_id'],
  FEATURES['enrollments_of_a_user'],
  FEATURES['get_kyc_documents_of_a_user'],
  FEATURES['change_user_password_by_admin'],
  
  // course management
  FEATURES['course_management'],
  FEATURES['courses'],
  FEATURES['create_course'],
  FEATURES['update_course'],
  FEATURES['delete_course'],
  FEATURES['course_categories'],
  FEATURES['create_course_category'],
  FEATURES['update_course_category'],
  FEATURES['delete_course_category'],
  FEATURES['create_lesson'],
  FEATURES['update_lesson'],
  FEATURES['delete_lesson'],

  FEATURES['create_section'],
  FEATURES['update_section'],
  FEATURES['delete_section'],
  FEATURES['live_class_of_a_course'],
  FEATURES['update_live_class'],
  FEATURES['delete_live_class'],
  
  // assignment 
  FEATURES['get_assignments_with_stats'],
  FEATURES['create_assignment'],
  FEATURES['update_assignment'],
  FEATURES['delete_assignment'],
  FEATURES['evaluate_assignment'],
  FEATURES['assignment_submissions_of_a_course'],
  // Payments
  FEATURES['payments'],
  FEATURES['download_payments'],
  FEATURES['create_payment_by_admin'],
  FEATURES['payments_of_a_user'],
  FEATURES['payment_histories'],
  FEATURES['payment_dues'],
  FEATURES['remove_payment'],
  FEATURES['payment_dues_download'],
  FEATURES['bulk_unenroll_dues_selected'],
  FEATURES['bulk_unenroll_all_dues'],
  
  
  // Pre Registrations
  FEATURES['pre_registrations'],
  FEATURES['download_pre_registrations_data'],
  FEATURES['archive_pre_registrations'],
  FEATURES['archive_single_pre_registration'],
  // Enrollments
  FEATURES['enrollments'],
  FEATURES['create_enrollment_by_admin'],
  FEATURES['remove_enrollment'],
  FEATURES['earning_reports'],
  FEATURES['bulk_enroll'],
  // Earning Reports
  FEATURES['earning_reports_list'],
  FEATURES['earning_reports_users_balances'],
  FEATURES['earning_reports_daily'],
  FEATURES['balance_of_a_user'],
  FEATURES['earning_report_of_a_user'],
  FEATURES['smartlinks_of_a_user'],
  FEATURES['generate_smart_link_for_user'],
  FEATURES['change_smart_link_status'],
  FEATURES['add_extra_click_to_shortner'],
  
  // Payouts
  FEATURES['students_payouts'],
  FEATURES['payouts_of_a_user'],
  FEATURES['make_payout_of_a_user_by_admin'],
  FEATURES['students_payouts_under_review'],
  FEATURES['students_payouts_waiting_for_payment'],
  FEATURES['students_payouts_histories'],
  FEATURES['students_rejected_payouts_histories'],
  FEATURES['update_payout_reviewer_status'],
  FEATURES['update_payout_status'],
  
  
  // Reviews
  FEATURES['reviews'],
  FEATURES['update_review'],
  FEATURES['delete_review'],
  // Tools
  FEATURES['tools_and_resources'],
  FEATURES['tools'],
  FEATURES['tool_access_list'],
  FEATURES['give_tools_access'],
  FEATURES['give_tools_access_in_bulk'],
  
  FEATURES['add_tool'],
  FEATURES['delete_tool'],
  FEATURES['update_tool'],
  // Coupons
  FEATURES['coupons'],
  FEATURES['create_coupon'],
  FEATURES['delete_coupon'],
  FEATURES['update_coupon'],
  // Blog
  FEATURES['blogs'],
  FEATURES['blog_posts'],
  FEATURES['blog_categories'],
  FEATURES['blog_category_create'],
  FEATURES['blog_category_update'],
  FEATURES['blog_category_delete'],


  FEATURES['blog_create'],
  FEATURES['blog_update'],
  FEATURES['blog_delete'],
  // Album and Gallery
  FEATURES['gallery_albums'],
  FEATURES['created_album'],
  FEATURES['update_album'],
  FEATURES['delete_album'],
  FEATURES['upload_gallery_image'],
  FEATURES['update_gallery_image'],
  FEATURES['delete_gallery_image'],
  // Generate Certificate
  FEATURES['generate_certificate'],
  FEATURES['remove_tool_access'],
  FEATURES['tools_access_list_of_user'],
  // student specific feature
  FEATURES['student_earning_report'],
  FEATURES['student_wallet'],
  // sms
  FEATURES['send_bulk_sms'],
  FEATURES['check_sms_balance'],,
  FEATURES['admin_notifications'],
  
  // cms
  FEATURES['cms'],
  FEATURES['settings'],
  FEATURES['terms_and_conditions'],
  FEATURES['privacy_policy'],
  FEATURES['refund_policy'],
  
  // FEATURES['featured-instructors'],
  // FEATURES['add_featured_instructor'],
  // FEATURES['reorder_featured_instructors'],
  // FEATURES['remove_featured_instructor'],
  FEATURES['team'],
  FEATURES['add_team_member'],
  FEATURES['update_team_member'],
  FEATURES['remove_team_member'],
  FEATURES['reorder_team_members'],

  FEATURES['upsert_page_data'],
  FEATURES['all_features'], 
  FEATURES['features_of_a_user'], 
  FEATURES['update_features_of_user']
  ,
  FEATURES['chat_signup'],
  FEATURES['bulk_chat_signup'],
  
  
]


export const FEATURE_ROLE_MAP = {
  [ROLE.admin]: [
    FEATURES['student_portal'],
    FEATURES['admin_notifications'], 
    FEATURES['all_features'], 
    FEATURES['chat_signup'],
    FEATURES['bulk_chat_signup'],


  ],
  [ROLE.instructor]: [
    FEATURES['student_portal'],
    FEATURES['admin_notifications'],     
    FEATURES['all_features'], 
    FEATURES['chat_signup'],
    FEATURES['bulk_chat_signup'],
  ],
  [ROLE.superAdmin]: ADMIN_FEATURES,

}
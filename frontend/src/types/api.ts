export interface School {
  id: string;
  name: string;
  code: string;
  city?: string;
  province?: string;
  currency: string;
  timezone: string;
  is_active: boolean;
}

export interface UserContext {
  user_id: string;
  email: string;
  full_name: string;
  is_superadmin: boolean;
  active_school_id?: string;
  active_role?: "admin" | "teacher" | "accountant" | "staff";
  permissions: string[];
  available_schools: School[];
}

export interface TrendPoint {
  label: string;
  value: number;
  secondary_value?: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  user_name?: string;
  created_at: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  category: string;
  date: string;
  is_urgent: boolean;
}

export interface DashboardStatsResponse {
  school_id: string;
  school_name: string;
  currency: string;
  total_students: number;
  total_teachers: number;
  total_staff: number;
  total_classes: number;
  total_sections: number;
  student_attendance_percentage: number;
  students_present_today: number;
  students_absent_today: number;
  students_leave_today: number;
  staff_attendance_percentage: number;
  staff_present_today: number;
  staff_absent_today: number;
  today_fee_collection: number;
  month_fee_collection: number;
  total_outstanding_balance: number;
  overdue_students_count: number;
  attendance_trend: TrendPoint[];
  fee_collection_trend: TrendPoint[];
  recent_activities: ActivityItem[];
  recent_notices: NoticeItem[];
}

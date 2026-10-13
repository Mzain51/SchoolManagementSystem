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

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  sort_order: number;
}

export interface SchoolSection {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  capacity: number | null;
}

export interface SchoolSubject {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  code: string;
}

export type StudentStatus = "active" | "inactive" | "transferred" | "graduated";

export interface Student {
  id: string;
  school_id: string;
  academic_year_id: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  admission_number: string;
  full_name: string;
  date_of_birth: string | null;
  gender: "female" | "male" | "other" | "prefer_not_to_say" | null;
  admission_date: string;
  guardian_name: string;
  guardian_relationship: string | null;
  guardian_phone: string;
  address: string | null;
  previous_school: string | null;
  emergency_contact: string | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface StudentInput {
  academic_year_id: string;
  class_id: string;
  section_id: string;
  admission_number: string;
  full_name: string;
  date_of_birth?: string | null;
  gender?: Student["gender"];
  admission_date: string;
  guardian_name: string;
  guardian_relationship?: string;
  guardian_phone: string;
  address?: string;
  previous_school?: string;
  emergency_contact?: string;
  status?: StudentStatus;
}

export interface StudentListResponse {
  items: Student[];
  total: number;
  page: number;
  page_size: number;
}

export interface Department {
  id: string
  name: string
}

export interface School {
  id: string
  name: string
  departmentId: string
}

// This represents a semester (S1, S2)
export interface Semester {
  id: string
  name: string
  schoolId: string
}

// This represents a class group (A, B, C)
export interface Class {
  id: string
  name: string
  semesterId: string
}

// This represents a subclass (A1, A2, B1, B2, C1, C2)
export interface Subclass {
  id: string
  name: string
  classId: string
}

export interface ScheduleEvent {
  id: string
  title: string
  start: Date
  end: Date
  location: string
  professor?: string
  type?: string
  description?: string
  allDay?: boolean
}

export interface ApiError {
  message: string
  code?: string
} 
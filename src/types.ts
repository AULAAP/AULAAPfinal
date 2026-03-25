export interface Section {
  id: string;
  name: string;
  tutorName?: string;
  schedule: {
    days: number[]; // 0-6 (Sun-Sat)
    time: string; // "HH:MM"
  };
  ownerId: string;
  churchId: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  projectCode?: string;
  status: 'Active' | 'Inactive';
  registrationDate: string;
  lastAttendance?: string;
  section?: string; // This will be the section name or ID
  photoUrl?: string;
  ownerId: string;
  churchId: string;
}

export interface User {
  uid: string;
  username: string;
  email: string;
  role: 'tutor' | 'admin' | 'director' | 'pastor';
  churchId: string;
  mustChangePassword?: boolean;
}

export interface ApprovedEmail {
  id: string;
  email: string;
  name: string;
  churchId: string;
  role: 'tutor' | 'admin' | 'director' | 'pastor';
}

export interface AttendanceRecord {
  id?: string;
  classId: string;
  date: string; // YYYY-MM-DD
  records: Record<string, boolean>; // beneficiaryId -> present
  ownerId: string;
  churchId: string;
}

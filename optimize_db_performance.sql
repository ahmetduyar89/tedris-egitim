-- Indexes for Private Lessons
CREATE INDEX IF NOT EXISTS idx_private_lessons_tutor_id ON private_lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_private_lessons_student_id ON private_lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_private_lessons_start_time ON private_lessons(start_time);
CREATE INDEX IF NOT EXISTS idx_private_lessons_status ON private_lessons(status);

-- Indexes for Students
CREATE INDEX IF NOT EXISTS idx_students_tutor_id ON students(tutor_id);

-- Indexes for Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- Indexes for Lesson Attendance
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_lesson_id ON lesson_attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_student_id ON lesson_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_tutor_id ON lesson_attendance(tutor_id);

-- Indexes for Diagnosis Test Assignments (Corrected table name)
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_assignments_student_id ON diagnosis_test_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_test_assignments_test_id ON diagnosis_test_assignments(test_id);

-- Indexes for PDF Test Submissions
CREATE INDEX IF NOT EXISTS idx_pdf_test_submissions_student_id ON pdf_test_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_pdf_test_submissions_pdf_test_id ON pdf_test_submissions(pdf_test_id);

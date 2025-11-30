---
description: How to use the Private Lesson Schedule feature
---

# Private Lesson Schedule Feature

This feature allows tutors to manage their private lesson schedule.

## Setup

1.  **Run Migration**: Ensure the database migration is applied.
    ```bash
    supabase db push
    ```
    Or run the SQL in `supabase/migrations/20251130_private_lesson_schedule.sql` via the Supabase Dashboard SQL Editor.

## Usage

1.  **Access**: Log in as a Tutor.
2.  **Navigate**: Click on "Özel Ders Programı" in the sidebar.
3.  **View Schedule**: You will see a weekly calendar view.
4.  **Add Lesson**: Click on any empty slot in the grid.
    -   Select a student from the list or enter a name for an external student.
    -   Select subject, topic, date, and time.
    -   Add notes if needed.
    -   Click "Kaydet".
5.  **Edit/Delete Lesson**: Click on an existing lesson card.
    -   Update details and click "Kaydet".
    -   Or click "Sil" to remove the lesson.

## Technical Details

-   **Table**: `private_lessons`
-   **RLS**: Tutors can manage their own lessons. Students can view lessons assigned to them.
-   **Component**: `components/PrivateLessonSchedule.tsx`

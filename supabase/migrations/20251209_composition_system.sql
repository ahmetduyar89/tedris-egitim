-- Composition Writing System Migration
-- Creates tables for composition topics, assignments, and evaluations

-- ============================================================================
-- COMPOSITIONS TABLE
-- ============================================================================
-- Stores composition topics created by teachers

CREATE TABLE IF NOT EXISTS compositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  guidelines TEXT[] DEFAULT '{}',
  min_word_count INTEGER DEFAULT 100,
  max_word_count INTEGER DEFAULT 500,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
  grade_level INTEGER,
  category VARCHAR(50) DEFAULT 'general',
  rubric JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for compositions
CREATE INDEX IF NOT EXISTS idx_compositions_teacher ON compositions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_compositions_active ON compositions(is_active);
CREATE INDEX IF NOT EXISTS idx_compositions_category ON compositions(category);

-- ============================================================================
-- COMPOSITION ASSIGNMENTS TABLE
-- ============================================================================
-- Stores composition assignments to students with submissions and evaluations

CREATE TABLE IF NOT EXISTS composition_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  composition_id UUID NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'draft', 'submitted', 'ai_evaluated', 'teacher_reviewed')),
  is_mandatory BOOLEAN DEFAULT true,
  
  -- Submission data
  student_text TEXT,
  word_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- AI Evaluation
  ai_score INTEGER CHECK (ai_score IS NULL OR (ai_score BETWEEN 0 AND 100)),
  ai_feedback JSONB,
  ai_evaluated_at TIMESTAMP WITH TIME ZONE,
  
  -- Teacher Evaluation
  teacher_score INTEGER CHECK (teacher_score IS NULL OR (teacher_score BETWEEN 0 AND 100)),
  teacher_feedback TEXT,
  teacher_reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(composition_id, student_id)
);

-- Indexes for composition_assignments
CREATE INDEX IF NOT EXISTS idx_comp_assignments_student ON composition_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_comp_assignments_teacher ON composition_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_comp_assignments_composition ON composition_assignments(composition_id);
CREATE INDEX IF NOT EXISTS idx_comp_assignments_status ON composition_assignments(status);
CREATE INDEX IF NOT EXISTS idx_comp_assignments_due_date ON composition_assignments(due_date);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE composition_assignments ENABLE ROW LEVEL SECURITY;

-- Compositions Policies
-- Teachers can manage their own compositions
CREATE POLICY "Teachers can manage own compositions"
  ON compositions FOR ALL
  USING (auth.uid() = teacher_id);

-- Students can view compositions assigned to them
CREATE POLICY "Students can view assigned compositions"
  ON compositions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM composition_assignments
      WHERE composition_assignments.composition_id = compositions.id
      AND composition_assignments.student_id = auth.uid()
    )
  );

-- Composition Assignments Policies
-- Students can view their own assignments
CREATE POLICY "Students can view own composition assignments"
  ON composition_assignments FOR SELECT
  USING (auth.uid() = student_id);

-- Students can update their own assignments (for submissions)
CREATE POLICY "Students can update own composition assignments"
  ON composition_assignments FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Teachers can view assignments they created
CREATE POLICY "Teachers can view composition assignments"
  ON composition_assignments FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can insert new assignments
CREATE POLICY "Teachers can create composition assignments"
  ON composition_assignments FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update assignments they created
CREATE POLICY "Teachers can update composition assignments"
  ON composition_assignments FOR UPDATE
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can delete assignments they created
CREATE POLICY "Teachers can delete composition assignments"
  ON composition_assignments FOR DELETE
  USING (auth.uid() = teacher_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on compositions
CREATE OR REPLACE FUNCTION update_compositions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compositions_updated_at_trigger
  BEFORE UPDATE ON compositions
  FOR EACH ROW
  EXECUTE FUNCTION update_compositions_updated_at();

-- Update updated_at timestamp on composition_assignments
CREATE OR REPLACE FUNCTION update_composition_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER composition_assignments_updated_at_trigger
  BEFORE UPDATE ON composition_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_composition_assignments_updated_at();

-- Auto-update word count when student_text changes
CREATE OR REPLACE FUNCTION update_composition_word_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_text IS NOT NULL THEN
    NEW.word_count = array_length(regexp_split_to_array(trim(NEW.student_text), '\s+'), 1);
  ELSE
    NEW.word_count = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER composition_word_count_trigger
  BEFORE INSERT OR UPDATE OF student_text ON composition_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_composition_word_count();

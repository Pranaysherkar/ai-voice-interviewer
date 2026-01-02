-- ============================================
-- AI Voice Interviewer Database Schema
-- ============================================
-- Database: PostgreSQL
-- Tables: job_descriptions, candidates, interviews, question_banks, feedback
-- ============================================

-- ============================================
-- 1. JOB DESCRIPTIONS TABLE
-- ============================================
CREATE TABLE job_descriptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Raw Content (for AI context)
  content TEXT NOT NULL,  -- Full extracted text from PDF
  
  -- Structured Fields (extracted via GPT-4o)
  position VARCHAR(255),  -- Job title/role name
  department VARCHAR(255),
  experience_min INTEGER,  -- Min years (e.g., 4, 5, 8)
  experience_max INTEGER,  -- Max years (e.g., 6, 7, 10)
  experience_level VARCHAR(50),  -- "4-6 years", "8-10 years"
  
  -- Tech Stack (extracted array)
  tech_stack JSONB DEFAULT '[]',  -- ["Java", "Spring Boot", "REST", "Oracle"]
  skills JSONB DEFAULT '[]',  -- ["API Development", "Microservices", "Security"]
  
  -- Structured Data (flexible JSONB for dynamic structure)
  structured_data JSONB DEFAULT '{}',  -- Store any structured content
  
  -- Metadata
  recruiter_id VARCHAR(100),  -- NULL allowed if not provided
  source_file VARCHAR(255),  -- Original PDF filename
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for job_descriptions
CREATE INDEX idx_jd_tech_stack ON job_descriptions USING GIN (tech_stack);
CREATE INDEX idx_jd_skills ON job_descriptions USING GIN (skills);
CREATE INDEX idx_jd_position ON job_descriptions (position);
CREATE INDEX idx_jd_experience ON job_descriptions (experience_min, experience_max);
CREATE INDEX idx_jd_recruiter ON job_descriptions (recruiter_id) WHERE recruiter_id IS NOT NULL;

-- ============================================
-- 2. CANDIDATES TABLE (includes resume text)
-- ============================================
CREATE TABLE candidates (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  
  -- Resume Content (extracted from PDF)
  resume_text TEXT NOT NULL,  -- Full extracted text from resume PDF
  
  -- Structured Resume Data (extracted via GPT-4o)
  position VARCHAR(255),  -- Current/desired position
  years_experience INTEGER,  -- Total years of experience
  current_company VARCHAR(255),
  current_role VARCHAR(255),
  tech_stack JSONB DEFAULT '[]',  -- ["Java", "Spring Boot", "REST"]
  skills JSONB DEFAULT '[]',  -- ["API Development", "Microservices"]
  education VARCHAR(255),
  
  -- Structured Resume Data (flexible JSONB)
  structured_data JSONB DEFAULT '{}',  -- Store any structured content
  
  -- Relationships
  jd_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  question_bank_id VARCHAR(100),  -- Reference to Qdrant collection
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',  -- pending, scheduled, interviewed, qualified, rejected
  
  -- Metadata
  source_file VARCHAR(255),  -- Original resume PDF filename
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for candidates
CREATE INDEX idx_candidates_email ON candidates (email);
CREATE INDEX idx_candidates_jd ON candidates (jd_id);
CREATE INDEX idx_candidates_status ON candidates (status);
CREATE INDEX idx_candidates_tech_stack ON candidates USING GIN (tech_stack);
CREATE INDEX idx_candidates_skills ON candidates USING GIN (skills);
CREATE INDEX idx_candidates_position ON candidates (position);
CREATE INDEX idx_candidates_experience ON candidates (years_experience);

-- ============================================
-- 3. INTERVIEWS TABLE
-- ============================================
CREATE TABLE interviews (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships (Links to other tables)
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  jd_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  
  -- Scheduling Information
  scheduled_date TIMESTAMP,  -- When interview is scheduled
  scheduled_time TIME,  -- Specific time (optional, can use scheduled_date)
  timezone VARCHAR(50) DEFAULT 'UTC',  -- Timezone for scheduled_date
  
  -- Interview Status & Tracking
  status VARCHAR(50) DEFAULT 'scheduled',  
  -- Values: scheduled, in_progress, completed, cancelled, rescheduled
  
  -- Meeting Information
  meeting_link VARCHAR(500),  -- Teams meeting link
  meeting_id VARCHAR(255),  -- Teams meeting ID
  meeting_password VARCHAR(100),  -- Meeting password (if any)
  
  -- Interview Execution
  interview_done BOOLEAN DEFAULT FALSE,  -- Has interview been conducted?
  interview_started_at TIMESTAMP,  -- When interview actually started
  interview_ended_at TIMESTAMP,  -- When interview ended
  interview_duration_minutes INTEGER,  -- Duration in minutes
  
  -- Results & Qualification
  is_qualified BOOLEAN,  -- true/false/null (null = not evaluated yet)
  qualification_score DECIMAL(3,1),  -- Overall score (0.0 to 10.0)
  
  -- Additional Metadata
  notes TEXT,  -- Any additional notes
  rescheduled_from UUID REFERENCES interviews(id),  -- If rescheduled, link to original
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for interviews
CREATE INDEX idx_interviews_candidate ON interviews (candidate_id);
CREATE INDEX idx_interviews_jd ON interviews (jd_id);
CREATE INDEX idx_interviews_status ON interviews (status);
CREATE INDEX idx_interviews_scheduled_date ON interviews (scheduled_date);
CREATE INDEX idx_interviews_done ON interviews (interview_done);
CREATE INDEX idx_interviews_qualified ON interviews (is_qualified);
CREATE INDEX idx_interviews_date_status ON interviews (scheduled_date, status);

-- ============================================
-- 4. QUESTION BANKS TABLE
-- ============================================
CREATE TABLE question_banks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,  -- Question bank name
  description TEXT,  -- Description of question bank
  
  -- Relationships
  jd_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,  -- Link to job description
  
  -- Tech Stack & Metadata
  tech_stack JSONB DEFAULT '[]',  -- ["Java", "Spring Boot", "REST"]
  difficulty_levels JSONB DEFAULT '[]',  -- ["beginner", "intermediate", "advanced"]
  
  -- Vector Database Reference
  qdrant_collection VARCHAR(100),  -- Collection name in Qdrant
  qdrant_namespace VARCHAR(100),  -- Namespace in Qdrant (optional)
  
  -- Statistics
  question_count INTEGER DEFAULT 0,  -- Total number of questions
  beginner_count INTEGER DEFAULT 0,
  intermediate_count INTEGER DEFAULT 0,
  advanced_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,  -- Is this question bank active?
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for question_banks
CREATE INDEX idx_question_banks_tech_stack ON question_banks USING GIN (tech_stack);
CREATE INDEX idx_question_banks_name ON question_banks (name);
CREATE INDEX idx_question_banks_active ON question_banks (is_active);
CREATE INDEX idx_question_banks_jd ON question_banks (jd_id);  -- Index for fast JD lookups

-- ============================================
-- 5. FEEDBACK TABLE
-- ============================================
CREATE TABLE feedback (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  jd_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  
  -- Overall Scores
  overall_score DECIMAL(3,1),  -- Overall score (0.0 to 10.0)
  technical_score DECIMAL(3,1),  -- Technical skills score
  communication_score DECIMAL(3,1),  -- Communication skills score
  problem_solving_score DECIMAL(3,1),  -- Problem-solving score
  
  -- Detailed Feedback
  detailed_feedback JSONB DEFAULT '{}',  -- Detailed feedback per question
  strengths JSONB DEFAULT '[]',  -- Array of strengths
  weaknesses JSONB DEFAULT '[]',  -- Array of weaknesses
  recommendations TEXT,  -- Improvement recommendations
  
  -- Question-wise Feedback
  question_feedback JSONB DEFAULT '[]',  -- Feedback for each question
  -- Structure: [{"question_id": "q1", "score": 8.5, "feedback": "..."}, ...]
  
  -- Additional Analysis
  response_time_avg DECIMAL(5,2),  -- Average response time in seconds
  total_questions_asked INTEGER,  -- Total questions asked
  questions_answered_correctly INTEGER,  -- Questions answered correctly
  
  -- Metadata
  feedback_generated_at TIMESTAMP DEFAULT NOW(),  -- When feedback was generated
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for feedback
CREATE INDEX idx_feedback_interview ON feedback (interview_id);
CREATE INDEX idx_feedback_candidate ON feedback (candidate_id);
CREATE INDEX idx_feedback_jd ON feedback (jd_id);
CREATE INDEX idx_feedback_score ON feedback (overall_score);
CREATE INDEX idx_feedback_technical_score ON feedback (technical_score);
CREATE INDEX idx_feedback_communication_score ON feedback (communication_score);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_banks_updated_at BEFORE UPDATE ON question_banks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE job_descriptions IS 'Stores job descriptions with extracted text and structured data';
COMMENT ON TABLE candidates IS 'Stores candidate information including resume text and structured data';
COMMENT ON TABLE interviews IS 'Tracks interview sessions, scheduling, and results';
COMMENT ON TABLE question_banks IS 'Metadata for question banks stored in Qdrant vector database';
COMMENT ON TABLE feedback IS 'Stores detailed interview feedback and analysis';

COMMENT ON COLUMN job_descriptions.content IS 'Full extracted text from JD PDF - used directly for AI context';
COMMENT ON COLUMN job_descriptions.tech_stack IS 'Array of technologies extracted from JD - used for RAG question selection';
COMMENT ON COLUMN candidates.resume_text IS 'Full extracted text from resume PDF - used directly for AI context';
COMMENT ON COLUMN candidates.tech_stack IS 'Array of technologies from resume - used for matching';
COMMENT ON COLUMN interviews.status IS 'Interview status: scheduled, in_progress, completed, cancelled, rescheduled';
COMMENT ON COLUMN interviews.interview_done IS 'Boolean flag indicating if interview was completed';
COMMENT ON COLUMN interviews.is_qualified IS 'Qualification result: true, false, or null (not evaluated)';
COMMENT ON COLUMN question_banks.qdrant_collection IS 'Reference to Qdrant collection name where question embeddings are stored';
COMMENT ON COLUMN question_banks.jd_id IS 'Foreign key linking question bank to job description. Used to fetch questions for specific JD during interviews.';
COMMENT ON COLUMN feedback.detailed_feedback IS 'JSONB object containing detailed feedback per question and category';

-- ============================================
-- END OF SCHEMA
-- ============================================


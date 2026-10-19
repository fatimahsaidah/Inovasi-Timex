BEGIN;

-- 1. Student records
CREATE TABLE students (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX students_full_name_unique
ON students (LOWER(TRIM(full_name)));

-- 2. Student login history
CREATE TABLE login_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    logged_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Topics
CREATE TABLE topics (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    icon VARCHAR(30) NOT NULL DEFAULT '📘',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Reading progress
CREATE TABLE reading_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    topic_id VARCHAR(100) NOT NULL,
    progress_percentage INTEGER NOT NULL DEFAULT 0
        CHECK (progress_percentage BETWEEN 0 AND 100),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_at TIMESTAMPTZ,
    UNIQUE (student_id, topic_id)
);

-- 5. Quizzes
CREATE TABLE quizzes (
    id VARCHAR(100) PRIMARY KEY,
    topic_id VARCHAR(100) NOT NULL UNIQUE
        REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL DEFAULT 'Topic Quiz',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Quiz questions
CREATE TABLE quiz_questions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quiz_id VARCHAR(100) NOT NULL
        REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer VARCHAR(20) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Quiz attempts: one attempt per student per quiz
CREATE TABLE quiz_attempts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    quiz_id VARCHAR(100) NOT NULL,
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    score_percentage NUMERIC(5,2) NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (correct_answers >= 0),
    CHECK (total_questions > 0),
    CHECK (correct_answers <= total_questions),
    UNIQUE (student_id, quiz_id)
);

-- 8. Activities
CREATE TABLE activities (
    id VARCHAR(100) PRIMARY KEY,
    topic_id VARCHAR(100) NOT NULL UNIQUE
        REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL DEFAULT 'Topic Activity',
    instructions TEXT NOT NULL DEFAULT '',
    drive_url TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Activity submission confirmations
CREATE TABLE activity_submissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_id VARCHAR(100) NOT NULL,
    is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    UNIQUE (student_id, activity_id),
    CHECK (
        (is_submitted = FALSE AND confirmed_at IS NULL)
        OR
        (is_submitted = TRUE AND confirmed_at IS NOT NULL)
    )
);

-- 10. Teacher login 
CREATE TABLE IF NOT EXISTS teachers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Indexes for faster queries
CREATE INDEX topics_published_order_idx
ON topics(is_published, display_order);

CREATE INDEX quiz_questions_quiz_order_idx
ON quiz_questions(quiz_id, display_order);

CREATE INDEX reading_progress_student_topic_idx
ON reading_progress(student_id, topic_id);

CREATE INDEX activity_submissions_student_activity_idx
ON activity_submissions(student_id, activity_id);

COMMIT;

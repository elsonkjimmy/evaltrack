-- Profils utilisateurs (extension de auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Salles (espace de gestion principal)
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  academic_year   TEXT,
  cc_coefficient  NUMERIC(4,2) DEFAULT 1.0,
  tp_coefficient  NUMERIC(4,2) DEFAULT 2.0,
  pass_threshold  NUMERIC(5,2) DEFAULT 50.0,
  rounding_rule   TEXT DEFAULT 'tenth' CHECK (rounding_rule IN ('tenth','hundredth','integer')),
  special_rule_25 BOOLEAN DEFAULT FALSE,
  is_locked       BOOLEAN DEFAULT FALSE,
  invite_token    TEXT UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions déléguées
CREATE TABLE room_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  can_add_students    BOOLEAN DEFAULT FALSE,
  can_edit_notes      BOOLEAN DEFAULT FALSE,
  can_view_stats      BOOLEAN DEFAULT FALSE,
  can_view_exports    BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Étudiants
CREATE TABLE students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  matricule   TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  first_name  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, matricule)
);

-- Composantes d'évaluation (CC et TP)
CREATE TABLE evaluations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('CC','TP')),
  label       TEXT NOT NULL,         -- "CC1", "CC2", "TP1", etc.
  weight      NUMERIC(5,2) NOT NULL, -- Pondération en %
  max_score   NUMERIC(5,2) DEFAULT 20,
  position    INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Notes par étudiant par évaluation
CREATE TABLE grades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  evaluation_id   UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  score           NUMERIC(5,2),
  absence_status  TEXT DEFAULT 'present' CHECK (absence_status IN ('present','absent_justified','absent_unjustified')),
  updated_by      UUID REFERENCES profiles(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, evaluation_id)
);

-- Session Normale (SN)
CREATE TABLE session_normale (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  score           NUMERIC(5,2),
  absence_status  TEXT DEFAULT 'present' CHECK (absence_status IN ('present','absent_justified','absent_unjustified')),
  updated_by      UUID REFERENCES profiles(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, room_id)
);

-- Bonus et malus
CREATE TABLE bonus_malus (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  value       NUMERIC(5,2) NOT NULL,
  reason      TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_full_access" ON rooms FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "public_read_rooms" ON rooms FOR SELECT TO anon USING (TRUE);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_access_students" ON students FOR ALL
  USING (EXISTS (
    SELECT 1 FROM rooms WHERE rooms.id = students.room_id AND (rooms.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM room_members WHERE room_id = rooms.id AND user_id = auth.uid()))
  ));
CREATE POLICY "public_read_students" ON students FOR SELECT TO anon USING (TRUE);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_access_evaluations" ON evaluations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM rooms WHERE rooms.id = evaluations.room_id AND (rooms.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM room_members WHERE room_id = rooms.id AND user_id = auth.uid()))
  ));
CREATE POLICY "public_read_evaluations" ON evaluations FOR SELECT TO anon USING (TRUE);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_access_grades" ON grades FOR ALL
  USING (EXISTS (
    SELECT 1 FROM students s JOIN rooms r ON s.room_id = r.id WHERE s.id = grades.student_id AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM room_members WHERE room_id = r.id AND user_id = auth.uid()))
  ));
CREATE POLICY "public_read_grades" ON grades FOR SELECT TO anon USING (TRUE);

ALTER TABLE session_normale ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_access_sn" ON session_normale FOR ALL
  USING (EXISTS (
    SELECT 1 FROM rooms WHERE rooms.id = session_normale.room_id AND (rooms.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM room_members WHERE room_id = rooms.id AND user_id = auth.uid()))
  ));
CREATE POLICY "public_read_sn" ON session_normale FOR SELECT TO anon USING (TRUE);

ALTER TABLE bonus_malus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_access_bm" ON bonus_malus FOR ALL
  USING (EXISTS (
    SELECT 1 FROM rooms WHERE rooms.id = bonus_malus.room_id AND (rooms.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM room_members WHERE room_id = rooms.id AND user_id = auth.uid()))
  ));
CREATE POLICY "public_read_bm" ON bonus_malus FOR SELECT TO anon USING (TRUE);

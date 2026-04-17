# EvalTrack — Prompt Maître de Génération
> Compatible : Lovable · Bolt.new · Cursor · Windsurf · Claude Code · v0
> Stack : React + TypeScript + Tailwind CSS + Supabase · i18n FR/EN

---

## 🎯 CONTEXTE GLOBAL

Tu es un expert senior en développement full-stack et en design UX/UI premium.
Tu vas créer **EvalTrack**, une application web de gestion académique des notes,
belle, moderne, professionnelle et agréable à utiliser.

Le projet sera construit avec :
- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : Tailwind CSS (utility-first, liquid class approach)
- **Backend** : Supabase (Auth + PostgreSQL + RLS + Realtime + Storage)
- **State management** : Zustand + React Query (TanStack Query v5)
- **Routing** : React Router v6
- **i18n** : i18next + react-i18next (Français + Anglais)
- **Charts** : Recharts
- **Export** : SheetJS (xlsx) + Papa Parse (CSV)
- **Animations** : Framer Motion
- **UI Primitives** : Radix UI (accessibilité)
- **Icons** : Lucide React
- **Toasts** : Sonner

---

## 🎨 DESIGN SYSTEM — DIRECTION VISUELLE

### Concept
**"Intelligence calme"** — Un outil que les enseignants *désirent* utiliser.
Ni froid ni scolaire : élégant, précis, chaleureux.

### Palette de couleurs (CSS variables dans tailwind.config.ts)
```
--color-navy:     #1A1A2E   (primaire, sidebar, headers)
--color-terra:    #E8623A   (accent principal, CTA, highlights)
--color-forest:   #2D6A4F   (succès, validation)
--color-cream:    #F8F7F4   (fond général)
--color-surface:  #FFFFFF   (cartes, modales)
--color-muted:    #6B7280   (texte secondaire)
--color-border:   #E5E7EB   (séparateurs)
--color-danger:   #DC2626   (erreurs, échec)
--color-warning:  #D97706   (alertes)
```

### Typographie (Google Fonts — importer dans index.html)
- **Display / Titres** : `Playfair Display` (serif élégant — noms de salles, headings H1-H2)
- **Interface / Body** : `DM Sans` (sans-serif moderne — labels, paragraphes, boutons)
- **Données / Notes** : `JetBrains Mono` (monospace — affichage des notes, scores, stats)

### Tailwind Config Extensions
```ts
// tailwind.config.ts
extend: {
  fontFamily: {
    display: ['Playfair Display', 'serif'],
    sans:    ['DM Sans', 'sans-serif'],
    mono:    ['JetBrains Mono', 'monospace'],
  },
  colors: {
    navy:    '#1A1A2E',
    terra:   { DEFAULT: '#E8623A', light: '#F4A07A', dark: '#C44E28' },
    forest:  '#2D6A4F',
    cream:   '#F8F7F4',
  },
  boxShadow: {
    card:   '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    modal:  '0 8px 32px rgba(0,0,0,0.12)',
    terra:  '0 4px 14px rgba(232,98,58,0.25)',
  },
  borderRadius: {
    xl2: '1rem',
    xl3: '1.5rem',
  }
}
```

### Composants signature (à implémenter avec soin)
- **ScoreCell** : cellule de note avec fond coloré selon performance (vert/orange/rouge), font-mono, hover sur détail
- **CircularProgress** : indicateur circulaire SVG pour la moyenne d'un étudiant
- **StatusBadge** : badge Présent/Absent justifié/Absent non justifié avec couleurs distinctives
- **LockBanner** : bannière horizontale animée indiquant que les notes sont verrouillées
- **NumberRoller** : animation de compteur qui "roule" quand une note est calculée (Framer Motion)
- **BonusMalusBadge** : badge avec signe +/- et tooltip affichant le motif au survol

---

## 🗄️ SCHÉMA BASE DE DONNÉES SUPABASE

### Instructions Supabase
- Activer **Row Level Security (RLS)** sur toutes les tables
- Utiliser **UUID** comme clé primaire (gen_random_uuid())
- Créer les **policies RLS** pour chaque table selon les rôles

### Tables SQL à créer

```sql
-- Profils utilisateurs (extension de auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
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
  -- Paramètres de calcul (configurables)
  cc_coefficient  NUMERIC(4,2) DEFAULT 1.5,   -- CC brut × coeff → sur 30
  tp_coefficient  NUMERIC(4,2) DEFAULT 2.0,   -- TP brut × coeff → sur 40
  pass_threshold  NUMERIC(5,2) DEFAULT 50.0,  -- Seuil de réussite (sur 100)
  rounding_rule   TEXT DEFAULT 'tenth'        -- 'tenth' | 'hundredth' | 'integer'
                  CHECK (rounding_rule IN ('tenth','hundredth','integer')),
  special_rule_25 BOOLEAN DEFAULT FALSE,      -- Règle spéciale 25% bonus/malus
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
  weight      NUMERIC(5,2) NOT NULL, -- Pondération en % (ex: 33.33)
  max_score   NUMERIC(5,2) DEFAULT 20,
  position    INT DEFAULT 0,         -- Ordre d'affichage
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Notes par étudiant par évaluation
CREATE TABLE grades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  evaluation_id   UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  score           NUMERIC(5,2),      -- NULL = non noté
  absence_status  TEXT DEFAULT 'present'
                  CHECK (absence_status IN ('present','absent_justified','absent_unjustified')),
  updated_by      UUID REFERENCES profiles(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, evaluation_id)
);

-- Session Normale (SN) — note unique sur 40 par étudiant
CREATE TABLE session_normale (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  score           NUMERIC(5,2),      -- sur 40
  absence_status  TEXT DEFAULT 'present'
                  CHECK (absence_status IN ('present','absent_justified','absent_unjustified')),
  updated_by      UUID REFERENCES profiles(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, room_id)
);

-- Bonus et malus (appliqués uniquement au CC)
CREATE TABLE bonus_malus (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  value       NUMERIC(5,2) NOT NULL, -- Positif = bonus, négatif = malus
  reason      TEXT NOT NULL,         -- Motif obligatoire
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Historique des modifications (audit trail)
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id),
  action        TEXT NOT NULL,        -- 'note_updated', 'student_added', etc.
  table_name    TEXT NOT NULL,
  record_id     UUID,
  old_value     JSONB,
  new_value     JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Règles RLS (Row Level Security)

```sql
-- RLS sur rooms : propriétaire voit ses salles, membres voient les salles où ils sont invités
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_full_access" ON rooms FOR ALL
  USING (auth.uid() = owner_id);
CREATE POLICY "member_read_access" ON rooms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = rooms.id AND user_id = auth.uid()
  ));

-- RLS sur students : accès si propriétaire ou membre de la salle
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_access_students" ON students FOR ALL
  USING (EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = students.room_id
    AND (rooms.owner_id = auth.uid()
      OR EXISTS (SELECT 1 FROM room_members WHERE room_id = rooms.id AND user_id = auth.uid()))
  ));

-- (Appliquer la même logique pour grades, evaluations, bonus_malus, session_normale, audit_log)
```

---

## ⚙️ MOTEUR DE CALCUL (TypeScript pur — fichier lib/calculations.ts)

```typescript
// lib/calculations.ts

export type RoundingRule = 'tenth' | 'hundredth' | 'integer';

export interface EvaluationInput {
  score: number | null;
  weight: number; // en pourcentage (somme des poids d'un type = 100)
  absenceStatus: 'present' | 'absent_justified' | 'absent_unjustified';
}

export interface BonusMalus {
  value: number; // positif = bonus, négatif = malus
}

export interface GradeCalculationResult {
  ccBrut: number;         // Somme pondérée des CC (sur 20 max)
  ccTotal: number;        // CC brut × coefficient, sur 30
  ccBeforeAdjust: number; // CC total avant bonus/malus
  bonusMalusSum: number;  // Cumul des bonus/malus
  ccFinal: number;        // CC total après ajustement (= ccTotal + bonusMalusSum)
  tpBrut: number;         // Somme pondérée des TP (sur 20 max)
  tpTotal: number;        // TP brut × coefficient, sur 40
  sn: number;             // Session normale, sur 40
  finalGrade: number;     // CC final + TP total + SN, sur 100
  isPassing: boolean;     // finalGrade >= passThreshold
}

/**
 * Applique la règle d'arrondi configurée pour la salle.
 */
export function applyRounding(value: number, rule: RoundingRule): number {
  switch (rule) {
    case 'integer':    return Math.round(value);
    case 'hundredth':  return Math.round(value * 100) / 100;
    case 'tenth':
    default:           return Math.round(value * 10) / 10;
  }
}

/**
 * Calcule toutes les notes d'un étudiant.
 * Les absences non justifiées donnent 0. Les absences justifiées excluent
 * la note du calcul (la pondération est redistribuée sur les notes saisies).
 */
export function calculateStudentGrades(params: {
  ccInputs: EvaluationInput[];
  tpInputs: EvaluationInput[];
  sn: number | null;
  bonusMalusList: BonusMalus[];
  ccCoefficient: number;
  tpCoefficient: number;
  passThreshold: number;
  roundingRule: RoundingRule;
}): GradeCalculationResult {
  const {
    ccInputs, tpInputs, sn,
    bonusMalusList, ccCoefficient, tpCoefficient,
    passThreshold, roundingRule
  } = params;

  // ── CC brut ──────────────────────────────────────────────────────────────
  const ccBrut = computeWeightedScore(ccInputs);

  // ── CC total ──────────────────────────────────────────────────────────────
  const ccTotalRaw = ccBrut * ccCoefficient;
  const ccTotal = applyRounding(Math.min(ccTotalRaw, 30), roundingRule);

  // ── Bonus / Malus ─────────────────────────────────────────────────────────
  const bonusMalusSum = bonusMalusList.reduce((acc, bm) => acc + bm.value, 0);

  // ── CC final (après ajustement) ───────────────────────────────────────────
  const ccFinal = applyRounding(
    Math.min(Math.max(ccTotal + bonusMalusSum, 0), 30),
    roundingRule
  );

  // ── TP brut ───────────────────────────────────────────────────────────────
  const tpBrut = computeWeightedScore(tpInputs);

  // ── TP total ──────────────────────────────────────────────────────────────
  const tpTotalRaw = tpBrut * tpCoefficient;
  const tpTotal = applyRounding(Math.min(tpTotalRaw, 40), roundingRule);

  // ── Session Normale ───────────────────────────────────────────────────────
  const snScore = applyRounding(Math.min(sn ?? 0, 40), roundingRule);

  // ── Note finale ───────────────────────────────────────────────────────────
  const finalGrade = applyRounding(
    Math.min(ccFinal + tpTotal + snScore, 100),
    roundingRule
  );

  return {
    ccBrut:         applyRounding(ccBrut, roundingRule),
    ccTotal,
    ccBeforeAdjust: ccTotal,
    bonusMalusSum:  applyRounding(bonusMalusSum, roundingRule),
    ccFinal,
    tpBrut:         applyRounding(tpBrut, roundingRule),
    tpTotal,
    sn:             snScore,
    finalGrade,
    isPassing:      finalGrade >= passThreshold,
  };
}

/**
 * Calcule la moyenne pondérée en gérant les absences.
 * Les absences justifiées sont exclues (la pondération est redistribuée).
 * Les absences non justifiées donnent 0.
 */
function computeWeightedScore(inputs: EvaluationInput[]): number {
  const active = inputs.filter(i => i.absenceStatus !== 'absent_justified');
  if (active.length === 0) return 0;

  const totalWeight = active.reduce((acc, i) => acc + i.weight, 0);
  if (totalWeight === 0) return 0;

  const weighted = active.reduce((acc, i) => {
    const score = i.absenceStatus === 'absent_unjustified' ? 0 : (i.score ?? 0);
    return acc + (score * i.weight);
  }, 0);

  return weighted / totalWeight;
}
```

---

## 🏗️ ARCHITECTURE DOSSIERS

```
src/
├── components/
│   ├── ui/                      # Composants atomiques
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── ScoreCell.tsx        # Cellule note colorée
│   │   ├── CircularProgress.tsx # Indicateur circulaire
│   │   ├── StatusBadge.tsx      # Présent/Absent
│   │   ├── NumberRoller.tsx     # Animation compteur
│   │   └── BonusMalusBadge.tsx  # Badge +/- avec tooltip
│   ├── layout/
│   │   ├── AppLayout.tsx        # Layout principal (sidebar + main)
│   │   ├── Sidebar.tsx          # Navigation gauche
│   │   └── TopBar.tsx           # Barre du haut
│   ├── rooms/
│   │   ├── RoomCard.tsx
│   │   ├── RoomForm.tsx
│   │   └── RoomSettings.tsx
│   ├── students/
│   │   ├── StudentTable.tsx
│   │   ├── StudentForm.tsx
│   │   └── ImportModal.tsx
│   ├── grades/
│   │   ├── GradeGrid.tsx        # Tableau principal de saisie des notes
│   │   ├── GradeCell.tsx        # Cellule éditable
│   │   ├── EvaluationSetup.tsx  # Config CC/TP
│   │   └── LockBanner.tsx       # Bandeau verrouillage
│   ├── bonus/
│   │   ├── BonusMalusPanel.tsx
│   │   └── BonusMalusForm.tsx
│   ├── stats/
│   │   ├── StatsPanel.tsx
│   │   ├── DistributionChart.tsx
│   │   └── SummaryCards.tsx
│   └── export/
│       └── ExportMenu.tsx
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── DashboardPage.tsx        # Liste des salles
│   ├── RoomPage.tsx             # Détail d'une salle
│   ├── GradesPage.tsx           # Saisie des notes
│   ├── StatsPage.tsx            # Statistiques
│   ├── AuditPage.tsx            # Historique
│   └── InvitePage.tsx           # Accès via lien d'invitation
│
├── lib/
│   ├── supabase.ts              # Client Supabase
│   ├── calculations.ts          # Moteur de calcul (voir ci-dessus)
│   ├── exportUtils.ts           # CSV + Excel
│   └── importParser.ts          # Parsing import étudiants
│
├── hooks/
│   ├── useRoom.ts
│   ├── useStudents.ts
│   ├── useGrades.ts
│   ├── useCalculations.ts
│   └── usePermissions.ts
│
├── store/
│   └── useAppStore.ts           # Zustand store global
│
├── i18n/
│   ├── index.ts                 # Config i18next
│   ├── locales/
│   │   ├── fr.json              # Traductions françaises
│   │   └── en.json              # Traductions anglaises
│
└── types/
    └── index.ts                 # Types TypeScript globaux
```

---

## 🌍 I18N — STRUCTURE DES TRADUCTIONS

```json
// i18n/locales/fr.json (extrait des clés principales)
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "loading": "Chargement...",
    "error": "Une erreur est survenue",
    "success": "Succès",
    "confirm": "Confirmer",
    "search": "Rechercher",
    "export": "Exporter",
    "import": "Importer",
    "lock": "Verrouiller",
    "unlock": "Déverrouiller",
    "add": "Ajouter",
    "back": "Retour"
  },
  "auth": {
    "login": "Connexion",
    "register": "Créer un compte",
    "logout": "Déconnexion",
    "email": "Adresse e-mail",
    "password": "Mot de passe",
    "fullName": "Nom complet",
    "loginTitle": "Bon retour sur EvalTrack",
    "registerTitle": "Commencer avec EvalTrack",
    "noAccount": "Pas encore de compte ?",
    "hasAccount": "Déjà un compte ?"
  },
  "dashboard": {
    "title": "Mes salles",
    "createRoom": "Nouvelle salle",
    "emptyState": "Aucune salle pour l'instant. Créez votre première salle !",
    "students": "{{count}} étudiant",
    "students_plural": "{{count}} étudiants"
  },
  "room": {
    "settings": "Paramètres de la salle",
    "name": "Nom de la salle",
    "description": "Description",
    "academicYear": "Année académique",
    "ccCoefficient": "Coefficient CC",
    "tpCoefficient": "Coefficient TP",
    "passThreshold": "Seuil de réussite (/100)",
    "roundingRule": "Règle d'arrondi",
    "rounding": {
      "tenth": "Au dixième",
      "hundredth": "Au centième",
      "integer": "À l'entier"
    },
    "specialRule25": "Activer la règle spéciale 25%",
    "inviteLink": "Lien d'invitation",
    "copyLink": "Copier le lien",
    "locked": "Notes verrouillées",
    "unlocked": "Notes déverrouillées"
  },
  "students": {
    "title": "Étudiants",
    "addStudent": "Ajouter un étudiant",
    "importStudents": "Importer une liste",
    "lastName": "Nom",
    "firstName": "Prénom",
    "matricule": "Matricule",
    "notFound": "Aucun étudiant trouvé",
    "deleteConfirm": "Supprimer cet étudiant ? Cette action est irréversible.",
    "absence": {
      "present": "Présent",
      "absent_justified": "Absent justifié",
      "absent_unjustified": "Absent non justifié"
    }
  },
  "grades": {
    "title": "Notes",
    "ccSection": "Contrôle Continu",
    "tpSection": "Travaux Pratiques",
    "snSection": "Session Normale",
    "ccTotal": "CC Total (/30)",
    "tpTotal": "TP Total (/40)",
    "finalGrade": "Note finale (/100)",
    "addCC": "Ajouter un CC",
    "addTP": "Ajouter un TP",
    "weight": "Pondération (%)",
    "weightHint": "La somme des pondérations doit être égale à 100%",
    "savingNote": "Enregistrement...",
    "noteSaved": "Note enregistrée",
    "lockNotes": "Verrouiller les notes",
    "unlockNotes": "Réouvrir les notes",
    "lockConfirm": "Verrouiller les notes empêchera toute modification. Continuer ?"
  },
  "bonus": {
    "title": "Bonus / Malus",
    "add": "Ajouter",
    "value": "Valeur",
    "reason": "Motif (obligatoire)",
    "reasonHint": "Décrivez la raison du bonus ou du malus",
    "history": "Historique",
    "bonusLabel": "Bonus",
    "malusLabel": "Malus",
    "ccBefore": "CC avant ajustement",
    "ccAfter": "CC après ajustement",
    "hoverToSeeReason": "Survolez pour voir le motif"
  },
  "stats": {
    "title": "Statistiques",
    "classAverage": "Moyenne de classe",
    "passRate": "Taux de réussite",
    "failRate": "Taux d'échec",
    "distribution": "Distribution des notes",
    "studentsAtRisk": "Étudiants en difficulté",
    "highest": "Note la plus haute",
    "lowest": "Note la plus basse"
  },
  "export": {
    "title": "Exporter",
    "fullResults": "Résultats complets",
    "studentList": "Liste des étudiants",
    "statsReport": "Rapport statistique",
    "detailedByComponent": "Détail par composante",
    "formatCSV": "Format CSV",
    "formatExcel": "Format Excel (.xlsx)"
  },
  "audit": {
    "title": "Historique des modifications",
    "action": "Action",
    "user": "Utilisateur",
    "date": "Date",
    "oldValue": "Ancienne valeur",
    "newValue": "Nouvelle valeur",
    "actions": {
      "note_updated": "Note modifiée",
      "student_added": "Étudiant ajouté",
      "student_removed": "Étudiant supprimé",
      "bonus_added": "Bonus ajouté",
      "malus_added": "Malus ajouté",
      "room_locked": "Salle verrouillée",
      "room_unlocked": "Salle déverrouillée",
      "room_created": "Salle créée"
    }
  },
  "permissions": {
    "title": "Permissions",
    "addDelegate": "Ajouter un délégué",
    "canAddStudents": "Peut ajouter des étudiants",
    "canEditNotes": "Peut saisir des notes",
    "canViewStats": "Peut voir les statistiques",
    "canViewExports": "Peut exporter",
    "removeDelegate": "Retirer l'accès"
  }
}
```

```json
// i18n/locales/en.json (extrait — mêmes clés, valeurs en anglais)
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Something went wrong",
    "success": "Success",
    "confirm": "Confirm",
    "search": "Search",
    "export": "Export",
    "import": "Import",
    "lock": "Lock",
    "unlock": "Unlock",
    "add": "Add",
    "back": "Back"
  },
  "auth": {
    "login": "Sign In",
    "register": "Create Account",
    "logout": "Sign Out",
    "email": "Email address",
    "password": "Password",
    "fullName": "Full name",
    "loginTitle": "Welcome back to EvalTrack",
    "registerTitle": "Get started with EvalTrack",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?"
  },
  "dashboard": {
    "title": "My Rooms",
    "createRoom": "New Room",
    "emptyState": "No rooms yet. Create your first room!",
    "students": "{{count}} student",
    "students_plural": "{{count}} students"
  }
}
```

---

## 📱 PAGES ET COMPOSANTS DÉTAILLÉS

### 1. Page de connexion / inscription (AuthPage)
```
Layout split-screen :
- Gauche (40%) : fond navy, logo EvalTrack en Playfair Display, tagline, illustration minimaliste
- Droite (60%) : fond cream, formulaire centré
Formulaire : email + password + (full_name si inscription)
Bouton CTA : fond terra (#E8623A), arrondi-xl, shadow-terra
Animation : fade-in slide-up (Framer Motion) au chargement
Switcher Langue FR/EN : petit toggle en haut à droite
```

### 2. Dashboard (DashboardPage)
```
Header : "Mes salles" en Playfair Display, bouton "Nouvelle salle" terra
Grille de RoomCards (3 colonnes sur desktop, 1 sur mobile) :
  - RoomCard : fond blanc, shadow-card, border-radius-xl2
  - Contient : nom de la salle, année académique, nb étudiants, bouton "Ouvrir"
  - Indicateur verrouillage : icône cadenas si is_locked = true
  - Hover : légère élévation (translateY -2px, shadow plus forte)
État vide : illustration SVG + texte + bouton création
```

### 3. Page de salle (RoomPage)
```
Layout : 
- Sidebar secondaire à gauche avec tabs : Notes | Statistiques | Étudiants | Paramètres | Historique
- Zone principale à droite

TopBar de la salle :
  - Nom de la salle en Playfair Display H2
  - Badge "Verrouillé" ou "Actif" (LockBanner si verrouillé)
  - Bouton Exporter
  - Bouton Paramètres
  - Switcher langue FR/EN
```

### 4. Tableau de notes (GradeGrid) — Composant central
```
Structure du tableau :
Colonnes fixes : Matricule | Nom | Prénom
Colonnes CC : CC1 | CC2 | ... | CCn | CC Total /30
Colonnes TP : TP1 | TP2 | ... | TPn | TP Total /40
Colonnes finales : SN /40 | Bonus/Malus | NOTE /100 | Statut

Comportement des cellules (GradeCell) :
- Double-clic pour éditer (input numérique, bornes validées)
- Clic droit → menu contextuel : Marquer absent justifié / Absent non justifié / Réinitialiser
- Sauvegarde auto au blur (onBlur) avec indication "enregistrement..." en spinner
- Fond coloré dynamique :
  * Blanc = non saisi
  * Vert clair = ≥ seuil/2 (performance correcte)
  * Orange clair = en dessous de la moyenne
  * Rouge clair = absent non justifié ou note très basse

Colonne NOTE /100 :
- Affichage en JetBrains Mono, taille plus grande
- Fond vert foncé si ≥ seuil, fond rouge si < seuil
- Animation NumberRoller au recalcul
- Tooltip avec le détail : CC brut / CC total / TP brut / TP total / SN

Colonne Bonus/Malus :
- BonusMalusBadge : "+2.5" en vert ou "-1.0" en rouge
- Tooltip : liste chronologique des bonus/malus avec motifs et dates

Header du tableau :
- Ligne de configuration au-dessus : pour chaque CC/TP, afficher la pondération
- Boutons + CC et + TP en bout de ligne
- Validation que la somme des poids = 100% avant de sauvegarder

Performance :
- Virtualisation des lignes si > 50 étudiants (react-virtual ou @tanstack/react-virtual)
- Saisie rapide : Tab passe à la cellule suivante dans la même colonne
```

### 5. Panel Statistiques (StatsPage)
```
SummaryCards (4 cartes en ligne) :
  [Moyenne /100] [Taux de réussite %] [Taux d'échec %] [Étudiants en difficulté]
  Chaque carte : fond blanc, icône lucide, chiffre en JetBrains Mono, label en DM Sans

DistributionChart (Recharts BarChart) :
  - Axe X : tranches de notes (0-10, 10-20, ..., 90-100)
  - Axe Y : nombre d'étudiants
  - Couleur des barres : rouge si < seuil, vert si ≥ seuil
  - Tooltip personnalisé avec la liste des étudiants dans la tranche

Tableau classement (optionnel, configurable) :
  - Liste des étudiants triés par note décroissante
  - Rang, nom, note finale, statut (succès/échec)
  - Mise en évidence des 3 premiers (médaille)
```

### 6. Import étudiants (ImportModal)
```
Modal en 3 étapes (stepper) :
  Étape 1 — Télécharger le template
    - Bouton "Télécharger le modèle CSV"
    - Bouton "Télécharger le modèle Excel"
  Étape 2 — Uploader le fichier
    - Zone drag & drop
    - Formats acceptés : .csv, .xlsx, .xls
    - Validation des colonnes (nom, prénom, matricule obligatoires)
  Étape 3 — Prévisualisation et confirmation
    - Tableau des étudiants détectés
    - Alertes sur doublons de matricule
    - Alertes sur lignes invalides
    - Bouton "Confirmer l'import"
```

### 7. Page historique / audit (AuditPage)
```
Tableau chronologique (ordre décroissant) :
  - Date et heure
  - Utilisateur (avatar + nom)
  - Action (badge coloré selon le type)
  - Détail (ancienne → nouvelle valeur)
Filtres :
  - Par type d'action
  - Par date (date picker)
  - Par utilisateur
Export du log disponible
```

---

## 🔒 LOGIQUE DE PERMISSIONS

```typescript
// hooks/usePermissions.ts
export function usePermissions(room: Room, currentUser: Profile) {
  const isOwner = room.owner_id === currentUser.id;

  return {
    canManageRoom:      isOwner,
    canLockNotes:       isOwner,
    canDeleteRoom:      isOwner,
    canManageMembers:   isOwner,
    canEditNotes:       isOwner || member?.can_edit_notes,
    canAddStudents:     isOwner || member?.can_add_students,
    canViewStats:       isOwner || member?.can_view_stats,
    canViewExports:     isOwner || member?.can_view_exports,
    canViewRoom:        isOwner || !!member,   // ou accès via invite token
    isOwner,
  };
}
```

---

## 📤 EXPORT (lib/exportUtils.ts)

```typescript
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export function exportToExcel(data: ExportRow[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV(data: ExportRow[], filename: string) {
  const csv = Papa.unparse(data, { delimiter: ';' }); // ; pour Excel FR
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// Format d'export minimal
export interface ExportRow {
  Matricule: string;
  Nom: string;
  Prénom: string;
  'CC Total /30': number;
  'TP Total /40': number;
  'SN /40': number;
  'Note Finale /100': number;
  Statut: 'Réussi' | 'Échoué';
}
```

---

## ✅ RÈGLES DE VALIDATION DANS LES FORMULAIRES

```
Étudiant :
- Matricule : unique dans la salle, non vide, alphanumériques
- Nom / Prénom : non vides, 2 caractères min

Note :
- CC/TP : entre 0 et 20 (inclus)
- SN : entre 0 et 40 (inclus)
- Valeur numérique uniquement (pas de lettres)

Pondérations :
- Chaque poids : entre 0 et 100
- Somme des poids d'un même type (CC ou TP) = 100% exactement

Bonus/Malus :
- Motif : obligatoire, minimum 5 caractères
- Valeur : numérique, peut être négatif (malus)

Salle :
- Nom : non vide, 3 caractères min
- cc_coefficient : entre 1.0 et 3.0
- tp_coefficient : entre 1.0 et 3.0
- pass_threshold : entre 0 et 100
```

---

## 🎭 ANIMATIONS (Framer Motion)

```tsx
// Variants réutilisables
export const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } }
};

export const cardHover = {
  whileHover: { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' },
  transition: { duration: 0.2 }
};

// NumberRoller : anime les chiffres d'une note lors du recalcul
// Utiliser useSpring de Framer Motion pour interpoler entre ancienne et nouvelle valeur
```

---

## 🚦 USER STORIES PRIORITAIRES (Phase 1 — MVP)

### Priorité MUST (à implémenter en premier)

**US1** — Inscription / Connexion (Supabase Auth)
**US4** — Créer une salle
**US5** — Configurer les paramètres d'une salle (coefficients, seuil, arrondi)
**US9** — Ajouter un étudiant manuellement
**US10** — Importer une liste d'étudiants (CSV / Excel)
**US13** — Définir les CC (nombre + pondérations)
**US14** — Définir les TP (nombre + pondérations)
**US16-18** — Saisir les notes CC, TP, SN
**US19-23** — Calcul automatique (moteur de calcul)
**US34-37** — Statistiques de base
**US39** — Export CSV / Excel
**US44** — Verrouiller les notes

### Priorité SHOULD (Phase 2)

**US6** — Lien d'invitation
**US7-8** — Délégation de permissions
**US25-26** — Bonus / Malus avec motif
**US42-43** — Historique des modifications

---

## 📋 INSTRUCTIONS FINALES À L'IA GÉNÉRATRICE

1. **Commence par créer la structure du projet** complète avec Vite + React + TypeScript + Tailwind.

2. **Configure Supabase** : crée le fichier `lib/supabase.ts` et les variables d'environnement (`.env.local` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`).

3. **Crée le fichier `lib/calculations.ts`** exactement comme spécifié — c'est le coeur du système.

4. **Implémente le design system** : configure `tailwind.config.ts` avec les couleurs, fonts et ombres définis, puis importe Playfair Display et DM Sans depuis Google Fonts dans `index.html`.

5. **Crée les composants UI atomiques** (`ScoreCell`, `CircularProgress`, `StatusBadge`, `BonusMalusBadge`) avant de construire les pages.

6. **Implémente i18next** avec les fichiers `fr.json` et `en.json`, et place le switcher de langue dans la TopBar.

7. **Les formulaires** ne doivent jamais utiliser la balise `<form>` HTML — utilise des divs avec `onClick` et `onChange` handlers.

8. **La validation des notes** doit se faire au niveau du composant `GradeCell` : pas de valeur hors bornes acceptée.

9. **Le moteur de calcul** doit être appelé côté client, en temps réel, à chaque modification d'une note.

10. **Les animations Framer Motion** sont sur les transitions de page, l'apparition des cartes (staggered), et le NumberRoller sur les notes calculées.

11. **L'interface est entièrement responsive** : sidebar collapsible sur mobile, tableau de notes avec scroll horizontal sur petits écrans.

12. **Vise un résultat production-ready, beau et sans erreurs** — chaque composant doit être typé TypeScript strictement.

---

*Prompt généré pour le projet EvalTrack · Stack : React + TypeScript + Tailwind + Supabase · i18n FR/EN*
*Design : "Intelligence calme" · Palette Navy / Terra / Forest · Typo : Playfair Display + DM Sans + JetBrains Mono*

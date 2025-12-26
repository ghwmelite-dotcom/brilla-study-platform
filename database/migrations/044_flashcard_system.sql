-- Flashcard System Migration
-- Create tables for flashcard decks, cards, and review tracking

-- Flashcard decks (user-created or system-generated)
CREATE TABLE IF NOT EXISTS flashcard_decks (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    subject_id TEXT REFERENCES subjects(id),
    topic_id TEXT REFERENCES topics(id),
    is_public INTEGER DEFAULT 0,
    card_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_demo_data INTEGER DEFAULT 0,
    expires_at TEXT
);

-- Individual flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    image_url TEXT,
    hint TEXT,
    difficulty INTEGER DEFAULT 1 CHECK (difficulty IN (1, 2, 3, 4, 5)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- User's review history for spaced repetition
CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    ease_rating INTEGER CHECK (ease_rating IN (1, 2, 3, 4, 5)),
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_at TEXT,
    reviewed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, flashcard_id, reviewed_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_subject ON flashcard_decks(subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_topic ON flashcard_decks(topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_public ON flashcard_decks(is_public);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next ON flashcard_reviews(user_id, next_review_at);

-- Create system flashcard decks from topics with formulas
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, created_at)
SELECT
    'deck_sys_' || t.id,
    NULL,
    t.name || ' - Key Concepts',
    'Important formulas and concepts for ' || t.name,
    t.subject_id,
    t.id,
    1,
    datetime('now')
FROM topics t
WHERE t.key_formulas IS NOT NULL AND t.key_formulas != '[]';

-- Seed some initial flashcards for Mathematics
INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, is_public, created_at)
VALUES
    ('deck_math_formulas', NULL, 'Essential Math Formulas', 'Key mathematical formulas for NSMQ/WASSCE', 'subj_math', 1, datetime('now')),
    ('deck_physics_formulas', NULL, 'Physics Formulas', 'Important physics equations and laws', 'subj_physics', 1, datetime('now')),
    ('deck_chemistry_formulas', NULL, 'Chemistry Essentials', 'Chemical equations and constants', 'subj_chemistry', 1, datetime('now')),
    ('deck_biology_terms', NULL, 'Biology Key Terms', 'Important biological terms and definitions', 'subj_biology', 1, datetime('now'));

-- Mathematics flashcards
INSERT OR IGNORE INTO flashcards (id, deck_id, front, back, difficulty) VALUES
    ('fc_math_1', 'deck_math_formulas', 'What is the quadratic formula?', 'x = (-b ± √(b²-4ac)) / 2a', 2),
    ('fc_math_2', 'deck_math_formulas', 'What is the formula for the area of a circle?', 'A = πr²', 1),
    ('fc_math_3', 'deck_math_formulas', 'What is the Pythagorean theorem?', 'a² + b² = c²', 1),
    ('fc_math_4', 'deck_math_formulas', 'What is the formula for compound interest?', 'A = P(1 + r/n)^(nt)', 3),
    ('fc_math_5', 'deck_math_formulas', 'What is the distance formula between two points?', 'd = √[(x₂-x₁)² + (y₂-y₁)²]', 2),
    ('fc_math_6', 'deck_math_formulas', 'What is the sum of angles in a triangle?', '180°', 1),
    ('fc_math_7', 'deck_math_formulas', 'What is the formula for the volume of a sphere?', 'V = (4/3)πr³', 2),
    ('fc_math_8', 'deck_math_formulas', 'What is sin²θ + cos²θ equal to?', '1 (Pythagorean identity)', 1),
    ('fc_math_9', 'deck_math_formulas', 'What is the derivative of xⁿ?', 'nxⁿ⁻¹ (Power rule)', 3),
    ('fc_math_10', 'deck_math_formulas', 'What is the slope-intercept form of a line?', 'y = mx + b', 1);

-- Physics flashcards
INSERT OR IGNORE INTO flashcards (id, deck_id, front, back, difficulty) VALUES
    ('fc_phys_1', 'deck_physics_formulas', 'What is Newton''s Second Law?', 'F = ma (Force = mass × acceleration)', 1),
    ('fc_phys_2', 'deck_physics_formulas', 'What is the formula for kinetic energy?', 'KE = ½mv²', 1),
    ('fc_phys_3', 'deck_physics_formulas', 'What is the formula for potential energy?', 'PE = mgh', 1),
    ('fc_phys_4', 'deck_physics_formulas', 'What is Ohm''s Law?', 'V = IR (Voltage = Current × Resistance)', 1),
    ('fc_phys_5', 'deck_physics_formulas', 'What is the speed of light?', 'c = 3 × 10⁸ m/s', 1),
    ('fc_phys_6', 'deck_physics_formulas', 'What is the formula for momentum?', 'p = mv', 1),
    ('fc_phys_7', 'deck_physics_formulas', 'What is the formula for work done?', 'W = Fd cos θ', 2),
    ('fc_phys_8', 'deck_physics_formulas', 'What is the equation for wave speed?', 'v = fλ (speed = frequency × wavelength)', 2),
    ('fc_phys_9', 'deck_physics_formulas', 'What is the acceleration due to gravity on Earth?', 'g ≈ 9.8 m/s² or 10 m/s²', 1),
    ('fc_phys_10', 'deck_physics_formulas', 'What is the ideal gas equation?', 'PV = nRT', 2);

-- Chemistry flashcards
INSERT OR IGNORE INTO flashcards (id, deck_id, front, back, difficulty) VALUES
    ('fc_chem_1', 'deck_chemistry_formulas', 'What is Avogadro''s number?', '6.02 × 10²³ mol⁻¹', 1),
    ('fc_chem_2', 'deck_chemistry_formulas', 'What is the molar gas volume at STP?', '22.4 L/mol', 2),
    ('fc_chem_3', 'deck_chemistry_formulas', 'What is the formula for moles?', 'n = mass/molar mass', 1),
    ('fc_chem_4', 'deck_chemistry_formulas', 'What is the pH formula?', 'pH = -log[H⁺]', 2),
    ('fc_chem_5', 'deck_chemistry_formulas', 'What is the ideal gas constant R?', '8.314 J/(mol·K) or 0.0821 L·atm/(mol·K)', 3),
    ('fc_chem_6', 'deck_chemistry_formulas', 'What is the molecular formula for water?', 'H₂O', 1),
    ('fc_chem_7', 'deck_chemistry_formulas', 'What is the atomic number of carbon?', '6', 1),
    ('fc_chem_8', 'deck_chemistry_formulas', 'What is the concentration formula?', 'C = n/V (moles per liter)', 1),
    ('fc_chem_9', 'deck_chemistry_formulas', 'What is the electron configuration of oxygen?', '1s² 2s² 2p⁴ or [He] 2s² 2p⁴', 2),
    ('fc_chem_10', 'deck_chemistry_formulas', 'What is the molar mass of H₂SO₄?', '98 g/mol', 2);

-- Biology flashcards
INSERT OR IGNORE INTO flashcards (id, deck_id, front, back, difficulty) VALUES
    ('fc_bio_1', 'deck_biology_terms', 'What organelle is the "powerhouse of the cell"?', 'Mitochondria', 1),
    ('fc_bio_2', 'deck_biology_terms', 'What is the process by which plants make food?', 'Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', 1),
    ('fc_bio_3', 'deck_biology_terms', 'What are the four DNA nucleotide bases?', 'Adenine (A), Thymine (T), Guanine (G), Cytosine (C)', 1),
    ('fc_bio_4', 'deck_biology_terms', 'What is the central dogma of molecular biology?', 'DNA → RNA → Protein (Transcription → Translation)', 2),
    ('fc_bio_5', 'deck_biology_terms', 'What is the function of ribosomes?', 'Protein synthesis', 1),
    ('fc_bio_6', 'deck_biology_terms', 'What is ATP?', 'Adenosine Triphosphate - the energy currency of cells', 1),
    ('fc_bio_7', 'deck_biology_terms', 'What is osmosis?', 'Movement of water from high to low concentration through a semi-permeable membrane', 2),
    ('fc_bio_8', 'deck_biology_terms', 'What are the phases of mitosis?', 'PMAT: Prophase, Metaphase, Anaphase, Telophase', 2),
    ('fc_bio_9', 'deck_biology_terms', 'What is the function of the cell membrane?', 'Controls what enters and exits the cell (selectively permeable)', 1),
    ('fc_bio_10', 'deck_biology_terms', 'What is the difference between prokaryotes and eukaryotes?', 'Prokaryotes lack a nucleus; Eukaryotes have a membrane-bound nucleus', 2);

-- Update card counts for seeded decks
UPDATE flashcard_decks SET card_count = (
    SELECT COUNT(*) FROM flashcards WHERE deck_id = flashcard_decks.id
) WHERE id IN ('deck_math_formulas', 'deck_physics_formulas', 'deck_chemistry_formulas', 'deck_biology_terms');

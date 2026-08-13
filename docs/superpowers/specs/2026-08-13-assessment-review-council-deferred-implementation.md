# BrillaPrep Assessment Review Council

## Deferred Implementation Specification for Kimi Code

**Document status:** Approved future-development specification

**Implementation status:** Not implemented

**Priority:** Post-pilot

**Feature flag:** `ASSESSMENT_REVIEW_COUNCIL_ENABLED=false` by default

**Prepared:** 13 August 2026

**Product owner:** Osborn M. D. K. Hodges

**Recruitment companion:** [Team Recruitment and Onboarding Playbook](./2026-08-13-assessment-review-council-recruitment-playbook.md)

---

## 1. Instructions to the Implementation Agent

This document describes a future BrillaPrep capability. Do not implement it until the product owner explicitly activates this work after the main platform pilot.

When implementation is authorized:

1. Read the repository, current migrations, active feature conventions and uncommitted changes before editing.
2. Preserve all unrelated work. Do not reset, revert or reformat unrelated files.
3. Treat the current repository as the source of truth when it differs from file references in this document.
4. Use React, strict TypeScript, Hono, Cloudflare Workers, D1 and existing project conventions.
5. Use prepared D1 statements only. Do not concatenate SQL.
6. Do not introduce `any` without a written justification.
7. Keep all Council routes in a focused API module rather than further expanding `workers/api/index.ts`.
8. Implement additive, forward-only migrations. Never mutate a deployed migration.
9. Keep the entire capability unavailable unless the server-side feature flag is enabled.
10. Do not claim WAEC affiliation, approval or endorsement.
11. Do not enable active WAEC examiners without recorded written WAEC clearance.
12. Do not mark the feature production-ready without migration, API, authorization, workflow, payout and browser-level evidence.

This is not a request to ingest examination papers. Question-paper licensing and the Council review workflow are separate gates.

---

## 2. Product Decision

BrillaPrep will eventually add an invitation-only **Assessment Review Council** inside the tutor portal.

The Council will independently vet former examiners and experienced subject teachers, assign two independent reviewers to each question or solution, escalate disagreements to a subject adjudicator and publish only content that passes all rights, academic and editorial checks.

The operating model is deliberately lean:

- Two permanent operators when the feature is active.
- Contracted subject experts are activated only when a subject enters review.
- Each active subject requires two independent reviewers and one adjudicator.
- Subjects are introduced sequentially instead of staffing every subject at launch.

The first recommended subject pilot is one subject only, preferably Mathematics. Expansion is conditional on measured quality, turnaround time and unit cost.

---

## 3. Why This Is Deferred

The core BrillaPrep platform has not completed its primary user pilot. Building a complex expert-governance system now would distract from validating student learning, tutor workflows, parent value, administration and commercial demand.

Implementation must not begin until the following trigger gates are satisfied:

1. The main BrillaPrep pilot has completed.
2. Pilot findings demonstrate that reviewed question content is a material user need.
3. A content-rights route has been documented for the intended source material.
4. The product owner has approved a Council operating budget.
5. A Head of Assessment candidate and at least three suitable experts for the first subject have been identified.
6. BrillaPrep has a production-capable payout and reconciliation process.
7. A privacy review has approved credential-document handling.

Failure to satisfy a trigger gate keeps the feature disabled.

---

## 4. Goals and Non-Goals

### 4.1 Goals

- Establish a defensible, evidence-backed question and solution verification process.
- Separate tutor access from editorial authority.
- Admit former examiners and experienced teachers through independent vetting.
- Require written WAEC clearance before admitting an active WAEC examiner.
- Provide double-blind subject review and independent adjudication.
- Maintain item-level provenance, licences, versions and review history.
- Reward experts with a hybrid of honoraria, quality bonuses and professional recognition.
- Make every published verification status explainable and auditable.
- Use post-publication learner data to trigger revalidation without allowing popularity to override academic correctness.

### 4.2 Non-Goals

- Recruiting every BECE and WASSCE subject at launch.
- Giving every tutor the right to review or approve content.
- Creating or implying a formal WAEC partnership without a signed agreement.
- Accepting confidential scripts, unreleased questions or non-public marking information.
- Paying reviewers merely for agreeing with each other.
- Automatically publishing AI-generated solutions.
- Replacing human academic judgment with model confidence scores.
- Converting Council participation into NTC CPD points without NTC approval.
- Supporting multi-country examination boards in the first implementation.

---

## 5. Governance and Staffing

### 5.1 Permanent operating roles

#### Head of Assessment and Standards

Responsibilities:

- Own review policy, calibration and editorial standards.
- Select and supervise subject adjudicators.
- Approve calibration sets.
- Decide exceptional academic appeals.
- Recommend suspension or removal of reviewer accreditation.
- Report quality, turnaround and defect metrics to the product owner.

The Head of Assessment must not act as both Reviewer A and Reviewer B on the same item. The Head may adjudicate only where no conflict exists and the action is recorded.

#### Content Quality and Reviewer Operations Manager

Responsibilities:

- Manage applications, identity checks and evidence requests.
- Maintain rights records, conflicts and embargoes.
- Create review batches and assignments.
- Monitor service-level deadlines.
- Prepare honoraria and quality-bonus statements.
- Operate correction and complaint workflows.
- Maintain the Council audit trail.

This operator cannot unilaterally approve academic content.

### 5.2 Contracted subject network

Each activated subject requires:

- Reviewer A.
- Reviewer B.
- One Subject Adjudicator.

These are contracted, assignment-based positions, not permanent staff roles.

The same expert may serve different subjects only when separately accredited for each subject. Subject authority is never inferred from a generic reviewer level.

### 5.3 Accreditation levels

1. **Associate Reviewer**

   Independently vetted teacher completing supervised calibration. May submit probation reviews but cannot cast a publication vote.

2. **Accredited Reviewer**

   Passed subject calibration and probation. May serve as Reviewer A or Reviewer B.

3. **Senior Reviewer**

   Demonstrated a sustained high-quality record and may mentor Associates.

4. **Subject Adjudicator**

   Resolves disagreements and recommends final publication or rejection.

5. **Council Fellow**

   Recognition status for exceptional service. It does not grant cross-subject authority.

### 5.4 Examiner classifications

- `not_claimed`
- `former_unverified`
- `former_verified`
- `active_clearance_pending`
- `active_cleared`
- `active_clearance_expired`
- `claim_rejected`

An active examiner may not receive assignments unless status is `active_cleared`, the clearance document has not expired and its permitted scope includes BrillaPrep review activity.

---

## 6. Eligibility and Vetting

Operational recruitment, sourcing, scorecards, interview guides, calibration, references, contracting, onboarding and recruitment-portal requirements are defined in the companion [Team Recruitment and Onboarding Playbook](./2026-08-13-assessment-review-council-recruitment-playbook.md). The requirements below remain mandatory governance gates.

### 6.1 Minimum evidence

Council admission is invitation-only. An administrator creates an invitation scoped to the intended examination, subject and candidate email. Invitations must expire, be single-use and be revocable before acceptance. An invitation starts vetting; it does not confer reviewer authority.

All candidates must provide:

- Government-issued identity evidence.
- Academic and professional qualifications.
- NTC licence or registration status when applicable.
- Teaching history and subjects taught.
- Two professional references.
- A signed confidentiality agreement.
- A signed intellectual-property and work-product agreement.
- A conflict-of-interest declaration.
- An examination-integrity pledge.
- Consent for credential verification and retention.

Former-examiner applicants must provide independently verifiable evidence of prior examining work. Public profiles must never reveal confidential appointment details.

### 6.2 Active WAEC examiners

Active examiners remain ineligible until BrillaPrep has written WAEC clearance covering:

- The individual or permitted examiner category.
- The subject and examination scope.
- Permitted review activities.
- Confidentiality boundaries.
- Effective and expiry dates.
- Any reporting, attribution or conflict conditions.

The platform must fail closed when clearance is absent, expired, revoked or ambiguous.

### 6.3 Prohibited material

Applicants and reviewers must not upload or reproduce:

- Unreleased examination questions.
- Confidential candidate scripts.
- Candidate-identifiable information.
- Internal or non-public marking instructions.
- Materials obtained through a breach of examiner obligations.
- Content for which BrillaPrep has no review or processing right.

An upload suspected to contain prohibited material must be quarantined, hidden from other reviewers and escalated to the Rights and Integrity function.

### 6.4 Calibration

Each subject has a versioned calibration set containing deliberately constructed defects across:

- Correct answer.
- Marking points.
- Alternative valid methods.
- Syllabus alignment.
- Command-word interpretation.
- Difficulty.
- Ambiguity.
- Diagram completeness.
- Bias and accessibility.
- Source and rights metadata.

Candidates must pass a configured threshold and then complete ten supervised probation reviews before accreditation. The threshold and probation count must be configuration values, not UI constants.

---

## 7. Permissions Model

Do not add `reviewer` to the existing `users.role` enum. The repository currently uses `student`, `teacher`, `admin` and `parent`; reviewer authority is an additional capability attached to an approved teacher or administrator account.

Required capabilities:

- `council.apply`
- `council.view_own_application`
- `council.review_assigned`
- `council.view_own_rewards`
- `council.adjudicate_subject`
- `council.manage_assignments`
- `council.verify_credentials`
- `council.manage_rights`
- `council.approve_publication`
- `council.manage_rewards`
- `council.manage_policy`
- `council.view_audit`

Authorization must be checked server-side for every route. Hiding navigation is not authorization.

Subject scope must also be enforced server-side. A Mathematics reviewer must not fetch or mutate an English review merely by guessing its identifier.

---

## 8. Review Unit and State Machine

### 8.1 Review unit

A review unit is an immutable snapshot of one question and its associated solution, marking points, diagrams and metadata. Editing the underlying question after review begins creates a new snapshot and invalidates incomplete decisions for the older version.

### 8.2 Content lifecycle

`draft` → `rights_check` → `ready_for_assignment` → `under_review` → `consensus_check` → (`adjudication_required` or `approved`) → `publication_ready` → `published`

Terminal or exceptional states:

- `rejected`
- `withdrawn`
- `quarantined`
- `superseded`
- `revalidation_required`
- `unpublished`

No state may be skipped by a client request. The server validates all transitions.

### 8.3 Assignment rules

- Reviewer A and Reviewer B are selected independently.
- Reviewers cannot select their counterpart.
- Reviewers cannot review their own submitted or edited content.
- Reviewers cannot be assigned where a declared conflict applies.
- Reviewers cannot see the counterpart's identity or review until both reviews are locked.
- An adjudicator cannot be an original reviewer of that item.
- Assignment acceptance includes a fresh conflict declaration.
- Assignments expire and return to the queue after the configured service level.

### 8.4 Review dimensions

Each reviewer must decide and evidence:

- Source and rights status.
- Question-text accuracy.
- Answer correctness.
- Completeness of marking points.
- Alternative valid responses or methods.
- Syllabus and topic alignment.
- Marks and difficulty appropriateness.
- Clarity and ambiguity.
- Diagram, table, map or media integrity.
- Language and accessibility.
- Potential cultural, gender or regional bias.
- Recommended disposition: accept, accept with corrections, major revision or reject.

Free-text notes alone are insufficient. Use structured fields plus evidence notes.

### 8.5 Consensus and adjudication

Automatic consensus is allowed only when both reviewers submit compatible structured decisions and no critical dimension conflicts.

Critical conflicts include:

- Different correct answers.
- Different maximum marks.
- A rights or source objection.
- A safety, bias or accessibility blocker.
- One reviewer recommending rejection.
- A material difference in marking points.

Critical conflicts move to adjudication. The adjudicator must record a reasoned decision and cannot silently overwrite reviewer records.

### 8.6 Publication

Publication requires:

- Rights-cleared content snapshot.
- Two locked qualifying reviews.
- Consensus or completed adjudication.
- No unresolved integrity flags.
- Recorded final approver.
- Version identifier and verification timestamp.

Student-facing labels:

- `Brilla Verified`
- `Verified on <date>`
- `Reviewed by two accredited subject specialists`
- `BrillaPrep reviewed model answer`

Do not display `WAEC Verified`, `Official WAEC Solution` or similar wording unless a signed licence expressly permits it.

---

## 9. Post-Publication Quality

Revalidation may be triggered by:

- A substantiated learner or teacher error report.
- An abnormal response distribution.
- Strong evidence of multiple valid answers.
- A syllabus change.
- A corrected source or marking scheme.
- Rights expiry or revocation.
- A configured annual review date.

Statistical difficulty does not prove an answer is wrong. Item analytics may open a review but cannot automatically change academic content.

Corrections must create a new version, preserve prior decisions and identify the reason for change. If learner scoring was affected, queue a separate remediation process rather than silently modifying historical results.

---

## 10. Hybrid Reward System

### 10.1 Reward components

1. **Base honorarium**

   Paid for a complete qualifying review, weighted by content complexity and assignment type.

2. **Quarterly quality pool**

   Distributed using calibration accuracy, evidence quality, defect rate and reliability.

3. **Professional recognition**

   Signed contribution statements, portable credentials and optional public profiles.

4. **Career progression**

   Promotion through accreditation levels and eligibility for adjudication work.

5. **Professional development**

   Council training and, only after formal approval, NTC-recognized CPD opportunities.

### 10.2 Quality score

Initial configurable weighting:

- 40% hidden calibration accuracy.
- 25% post-publication defect-free record.
- 20% evidence completeness and reasoning quality.
- 15% timeliness and assignment reliability.

Do not reward raw consensus rate. Agreement is easy to game and can punish justified dissent.

### 10.3 Payment controls

- Store money as integer pesewas, never floating-point Cedi values.
- Separate `earned`, `approved`, `payable`, `paid`, `reversed` and `disputed` states.
- A reviewer cannot approve their own payout.
- Operations prepares a statement; an authorized administrator approves it.
- Every payout must carry an idempotency key and reconciliation reference.
- Never store raw MoMo or bank credentials in audit logs.
- Do not make an external payout in the initial technical phase. First implement an auditable payable ledger and manual-payment reconciliation.

Recommended launch policy: honorarium values remain administrator-configurable and are not hard-coded in the client or this document. Rates should be set after measuring the first subject pilot.

---

## 11. Data Architecture

### 11.1 Storage boundaries

- **D1:** profiles, capabilities, subject accreditation, workflows, decisions, ledger entries and audit metadata.
- **Private R2:** credential evidence, signed agreements and clearance documents.
- **Workers:** authorization, state transitions, signed/private document delivery and redaction.
- **Client:** no direct R2 or D1 access.

Credential objects must use opaque object keys and must not be publicly addressable. Retrieval must pass an authenticated Worker route with capability and record-scope checks.

### 11.2 Additive tables

Use the next available migration number at implementation time. The following logical tables are required; exact names may be adapted to current conventions.

#### `reviewer_invitations`

- `id`
- `email_normalized`
- `exam_type_id`
- `subject_id`
- `intended_level`
- `token_hash` unique
- `status` (`pending`, `accepted`, `expired`, `revoked`)
- `invited_by`
- `expires_at`
- `accepted_by_user_id` nullable
- `accepted_at` nullable
- timestamps

Store only a cryptographic hash of the invitation token. Acceptance requires the authenticated account email to match the invitation unless an administrator completes a separately audited reassignment.

#### `reviewer_profiles`

- `id`
- `user_id` unique FK to `users`
- `application_status`
- `examiner_classification`
- `public_display_consent`
- `bio`
- `ntc_status`
- `years_experience`
- `appointed_at`
- `appointment_expires_at`
- `suspended_at`
- `suspension_reason`
- timestamps

#### `reviewer_evidence`

- `id`
- `reviewer_profile_id`
- `evidence_type`
- `r2_object_key`
- `sha256`
- `verification_status`
- `verified_by`
- `verified_at`
- `expires_at`
- `notes`
- timestamps

Never store a public document URL.

#### `reviewer_subject_accreditations`

- `id`
- `reviewer_profile_id`
- `exam_type_id`
- `subject_id`
- `level`
- `status`
- `calibration_version`
- `calibration_score`
- `probation_reviews_required`
- `probation_reviews_completed`
- `effective_at`
- `expires_at`
- `approved_by`
- timestamps

Unique active accreditation per reviewer, examination and subject.

#### `reviewer_clearances`

- `id`
- `reviewer_profile_id`
- `authority_name`
- `clearance_type`
- `scope_json`
- `r2_object_key`
- `sha256`
- `effective_at`
- `expires_at`
- `verification_status`
- `verified_by`
- timestamps

#### `reviewer_conflicts`

- `id`
- `reviewer_profile_id`
- `conflict_type`
- `subject_id` nullable
- `institution_name` nullable
- `applies_from`
- `applies_until`
- `details`
- `status`
- timestamps

#### `question_review_snapshots`

- `id`
- `question_id` FK to `questions`
- `version`
- immutable content JSON or normalized immutable fields
- `content_sha256`
- `rights_status`
- `source_reference`
- `created_by`
- timestamps

Snapshots must include the reviewed answer, explanation, options, marking points, diagrams and metadata, not only a pointer to mutable question data.

#### `question_review_cases`

- `id`
- `snapshot_id`
- `exam_type_id`
- `subject_id`
- `state`
- `priority`
- `rights_gate_status`
- `opened_by`
- `final_approver_id`
- `published_version`
- `verified_at`
- timestamps

#### `question_review_assignments`

- `id`
- `case_id`
- `reviewer_profile_id`
- `assignment_role` (`reviewer_a`, `reviewer_b`, `adjudicator`, `probation_observer`)
- `status`
- `due_at`
- `accepted_at`
- `locked_at`
- `conflict_declared_at`
- timestamps

Use constraints to prevent duplicate active roles. Enforce self-review and subject-scope rules in the service layer within a transaction.

#### `question_review_decisions`

- `id`
- `assignment_id` unique
- structured decision fields
- `evidence_notes`
- `proposed_corrections_json`
- `decision`
- `decision_sha256`
- `submitted_at`
- `locked_at`

Locked decisions are append-only. Corrections require a replacement record linked to the previous decision and an audit event.

#### `review_integrity_flags`

- `id`
- `case_id`
- `flag_type`
- `severity`
- `description`
- `status`
- `raised_by`
- `resolved_by`
- timestamps

#### `review_reward_ledger`

- `id`
- `reviewer_profile_id`
- `assignment_id` nullable
- `period`
- `entry_type`
- `amount_pesewas`
- `status`
- `calculation_version`
- `idempotency_key` unique
- `approved_by`
- `approved_at`
- `payment_reference`
- `paid_at`
- timestamps

#### `review_audit_log`

- `id`
- `actor_user_id`
- `action`
- `target_type`
- `target_id`
- redacted metadata JSON
- `ip_hash` nullable
- `created_at`

Never place credential contents, bank/MoMo details, candidate information or clearance-document bodies in audit metadata.

### 11.3 Required indexes

Include indexes for:

- Reviewer profile by `user_id` and status.
- Accreditation by reviewer, exam type, subject, level and status.
- Clearance expiry.
- Review cases by state, subject and priority.
- Assignments by reviewer, status and due date.
- Open integrity flags.
- Reward ledger by reviewer, period and status.
- Audit events by target and creation date.

---

## 12. API Architecture

Create `workers/api/assessment-review.ts` and mount it under:

`/api/assessment-review`

Use `requireAuth`, then capability and subject-scope middleware. Keep administrator endpoints in the same bounded module unless the file becomes too large; split by applications, reviews, governance and rewards when necessary.

### 12.1 Reviewer endpoints

- `GET /invitations/:token/eligibility`
- `POST /invitations/:token/accept`
- `GET /eligibility`
- `POST /applications`
- `GET /applications/me`
- `POST /applications/:id/evidence-upload-url`
- `GET /profile/me`
- `GET /accreditations/me`
- `GET /assignments`
- `GET /assignments/:id`
- `POST /assignments/:id/accept`
- `POST /assignments/:id/decline`
- `POST /assignments/:id/conflict`
- `PUT /assignments/:id/draft`
- `POST /assignments/:id/submit`
- `GET /rewards/me`
- `GET /credentials/me`

### 12.2 Adjudicator endpoints

- `GET /adjudications`
- `GET /adjudications/:caseId`
- `POST /adjudications/:caseId/decision`

Only after both primary reviews are locked may the adjudicator see them.

### 12.3 Operations and administration endpoints

- `POST /admin/invitations`
- `GET /admin/invitations`
- `POST /admin/invitations/:id/revoke`
- `GET /admin/applications`
- `GET /admin/applications/:id`
- `POST /admin/applications/:id/verify-evidence`
- `POST /admin/applications/:id/decision`
- `POST /admin/accreditations`
- `PUT /admin/accreditations/:id`
- `POST /admin/calibrations`
- `POST /admin/cases`
- `POST /admin/cases/:id/assign`
- `POST /admin/cases/:id/transition`
- `GET /admin/cases`
- `GET /admin/cases/:id`
- `POST /admin/cases/:id/publication-decision`
- `POST /admin/cases/:id/revalidation`
- `GET /admin/integrity-flags`
- `POST /admin/integrity-flags/:id/resolve`
- `GET /admin/rewards`
- `POST /admin/rewards/calculate`
- `POST /admin/rewards/:id/approve`
- `POST /admin/rewards/:id/reconcile-payment`
- `GET /admin/audit`
- `GET /admin/metrics`

### 12.4 API rules

- Use runtime request validation for every body, path and query parameter.
- Reject application creation unless it is linked to an accepted, unexpired invitation for the authenticated account.
- Return standard `{ success, data?, error? }` envelopes matching repository conventions.
- Rate-limit evidence upload and review submission routes.
- Require idempotency keys for submission, transition and financial mutation routes.
- Reject request bodies on read-only routes where the project policy requires it.
- Use transactions for assignments, state changes, decision locking and ledger creation.
- Return generic authorization errors without revealing whether an inaccessible record exists.
- Do not accept user role or capability from request headers.

---

## 13. Tutor Portal Experience

Council navigation appears only when the feature flag is enabled and the authenticated account is eligible, invited, applying or accredited.

Recommended route group:

- `/teacher/review-council`
- `/teacher/review-council/apply`
- `/teacher/review-council/calibration`
- `/teacher/review-council/assignments`
- `/teacher/review-council/assignments/:id`
- `/teacher/review-council/rewards`
- `/teacher/review-council/credentials`

### 13.1 Council home

Show:

- Accreditation level and subjects.
- Application or clearance status.
- Active assignments and deadlines.
- Probation progress.
- Quality indicators with sufficient sample-size warnings.
- Earned, approved and paid rewards.
- Integrity and confidentiality reminders.

Do not expose a simplistic public leaderboard. Quality work should not be turned into a speed competition.

### 13.2 Review workspace

The workspace must provide:

- Immutable snapshot identifier.
- Source and rights status.
- Question, options, answer, explanation, diagrams and marking points.
- Structured review checklist.
- Evidence notes.
- Proposed corrections.
- Draft autosave.
- Conflict declaration.
- Final review and lock confirmation.
- Keyboard navigation and accessible field descriptions.

The counterpart's identity and review remain hidden before both decisions lock.

### 13.3 Rewards

Display separate values for:

- Pending review work.
- Earned honoraria.
- Approved payable amount.
- Paid amount.
- Quality-pool estimates, clearly labelled non-guaranteed.
- Calculation explanation and dispute action.

### 13.4 Credentials and recognition

Allow reviewers to download a signed contribution statement and optionally expose a public BrillaPrep expert profile containing:

- Verified display name.
- Approved subjects.
- Accreditation level.
- Contribution counts in broad bands.
- Appointment period.

Never publish exact confidential review history, examiner appointment evidence or Council disagreements.

---

## 14. Administrator Experience

Recommended route group:

- `/admin/review-council`
- `/admin/review-council/applications`
- `/admin/review-council/reviewers`
- `/admin/review-council/cases`
- `/admin/review-council/assignments`
- `/admin/review-council/integrity`
- `/admin/review-council/rewards`
- `/admin/review-council/audit`
- `/admin/review-council/settings`

The operations dashboard should prioritize:

- Applications awaiting evidence verification.
- Clearances nearing expiry.
- Assignments nearing or exceeding deadlines.
- Cases needing adjudication.
- Rights-blocked or quarantined cases.
- Open integrity flags.
- Rewards awaiting approval or reconciliation.
- Subject-level capacity and throughput.

All sensitive actions require explicit confirmation and a reason.

---

## 15. Feature Flags and Configuration

Server-side configuration must include:

- Master enable/disable flag.
- Enabled exam types and subjects.
- Application open/closed state.
- Calibration pass threshold.
- Probation-review count.
- Assignment service levels by type.
- Honorarium rates by complexity and assignment role.
- Quality-score weights.
- Quality-pool budget.
- Clearance-expiry warning window.
- Revalidation interval.
- Maximum active assignments per reviewer.

Client flags are for presentation only. The Worker must enforce every configuration boundary.

Emergency kill switches:

- Stop new applications.
- Stop new assignments.
- Stop publication transitions.
- Stop reward calculation.
- Suspend a subject while preserving evidence and history.

---

## 16. Security, Privacy and Integrity

### 16.1 Threat controls

- **Credential forgery:** manual verification, reference checks and stored verification evidence.
- **Reviewer collusion:** blind assignment, randomized pairing, anomaly monitoring and restricted communication.
- **Self-review:** submitter/editor relationship checks and assignment constraints.
- **Unauthorized subject access:** capability plus subject-scope checks on every query.
- **IDOR:** authorize record scope before returning any resource.
- **Document leakage:** private R2, short-lived authenticated delivery and download audit.
- **Content tampering:** immutable snapshots and SHA-256 hashes.
- **Reward fraud:** idempotency, separation of duties and append-only ledger entries.
- **Active-examiner conflict:** clearance status checked at assignment acceptance and submission.
- **Confidential-content upload:** quarantine workflow and restricted investigation access.
- **AI leakage:** do not send credential evidence, unpublished content or confidential reviews to an external model.

### 16.2 Data minimization

- Collect only evidence necessary for identity, qualifications and authority.
- Define retention periods before launch.
- Redact national identifiers from normal operations views.
- Do not place sensitive evidence in application logs or analytics.
- Support credential-evidence deletion after the legal retention period while preserving non-sensitive verification facts and required financial records.

### 16.3 AI use

AI may assist with formatting, duplicate detection, missing-field detection and suggested metadata only where content rights and confidentiality allow it.

AI must not:

- Cast a publication vote.
- Replace either independent human review.
- View confidential credentials.
- Train on Council material by default.
- Generate a supposedly official marking scheme.

Any AI assistance visible to a reviewer must be labelled and recorded.

---

## 17. Notifications

Use existing in-app notification patterns first. Email may be added for time-sensitive events.

Required events:

- Application received.
- Additional evidence requested.
- Application approved or rejected.
- Accreditation granted, suspended or nearing expiry.
- Assignment offered, accepted, due soon, expired or cancelled.
- Adjudication requested.
- Review returned for procedural correction.
- Honorarium earned, approved, paid or disputed.
- Clearance nearing expiry.
- Policy or confidentiality agreement changed.

Do not include question text, confidential review details or credential data in email notifications.

---

## 18. Metrics and Success Gates

### 18.1 Quality metrics

- Post-publication confirmed defect rate.
- Revalidation rate and cause.
- Calibration accuracy.
- Percentage of cases requiring adjudication.
- Rights or integrity incidents.
- Learner error reports confirmed as valid.

### 18.2 Operating metrics

- Median time to accept assignment.
- Median review turnaround.
- Median adjudication turnaround.
- Cost per verified objective item.
- Cost per verified theory or structured item.
- Reviewer acceptance and completion rates.
- Reviewer retention.

### 18.3 Expansion gate

Do not activate a second subject until the first subject has completed at least one full-paper-equivalent batch and the product owner has reviewed:

- Defect evidence.
- Turnaround.
- Unit economics.
- Reviewer workload.
- User value.
- Rights compliance.

Numerical pass/fail targets must be set immediately before the pilot based on budget and baseline data; they must not be invented during implementation.

---

## 19. Implementation Phases

### Phase 0: Revalidation and technical discovery

- Confirm post-pilot authorization.
- Re-read current schema and route conventions.
- Confirm content licensing and privacy boundaries.
- Select the first subject.
- Produce threat model and migration plan.
- Confirm honorarium operating policy.

Exit evidence: approved implementation plan, rights memo, privacy decision and subject-pilot charter.

### Phase 1: Governance foundation

- Feature flag and server-side configuration.
- Reviewer profiles, evidence, accreditation, clearance and conflict tables.
- Private evidence upload and retrieval.
- Application and administrative vetting screens.
- Audit events and authorization tests.

Exit evidence: an independently vetted applicant can progress through application, evidence verification and subject accreditation in staging, while unauthorized users cannot access any Council data.

### Phase 2: Review workflow

- Immutable question snapshots.
- Cases, assignments and structured decisions.
- Blind Reviewer A and B workflow.
- Consensus and adjudication engine.
- Publication decision and verification metadata.
- Correction and revalidation flow.

Exit evidence: a staged question completes double review, disagreement, adjudication, publication and versioned correction with a complete audit trail.

### Phase 3: Rewards and recognition

- Complexity configuration.
- Honorarium and quality-score calculation.
- Payable ledger, approval and manual reconciliation.
- Reviewer statements and credentials.
- Dispute workflow.

Exit evidence: a qualifying review produces exactly one ledger entry, separation-of-duties approval works and duplicate calculation or reconciliation is rejected.

### Phase 4: One-subject controlled pilot

- Invite the two operators.
- Vet two reviewers and one adjudicator.
- Calibrate and appoint them.
- Review one full-paper-equivalent batch.
- Measure cost, time, disagreement and confirmed defects.
- Collect reviewer and administrator feedback.

Exit evidence: signed pilot report with a decision to expand, revise or stop.

### Phase 5: Conditional scale

- Add subjects one at a time.
- Introduce reviewer-pairing optimization.
- Seek NTC discussion about professional-development recognition.
- Add public expert profiles only with consent.
- Consider automated payout rails only after manual reconciliation is stable.

---

## 20. Testing Requirements

### 20.1 Unit tests

- Capability evaluation.
- Subject-scope evaluation.
- Active-examiner clearance rules.
- Conflict matching.
- State-transition validation.
- Consensus comparison.
- Critical-conflict detection.
- Quality-score calculation.
- Money calculations in integer pesewas.
- Reward idempotency.
- Snapshot hashing.

### 20.2 API integration tests

- Tutor without an accepted invitation cannot create a Council application.
- Expired, revoked, reused or email-mismatched invitations are rejected.
- Ordinary tutor cannot access Council assignments.
- Accredited reviewer sees only assigned subject records.
- Reviewer cannot access counterpart review before both lock.
- Reviewer cannot review own content.
- Expired clearance blocks active examiner assignment.
- Adjudicator cannot adjudicate a case they reviewed.
- Client cannot skip workflow states.
- Locked decision cannot be overwritten.
- Publication fails when rights status is not cleared.
- Duplicate reward calculation creates no second ledger entry.
- Payout approver cannot be the reviewer receiving payment.
- Private credential document cannot be retrieved with a guessed ID.

### 20.3 Migration tests

- Apply all migrations to an empty D1 database.
- Apply the new migration to a representative pre-feature schema.
- Validate foreign keys and indexes.
- Verify existing question, tutor, content-management and bonus routes remain functional.
- Confirm the feature flag defaults to disabled.

### 20.4 Browser tests

- Application and evidence flow.
- Administrative vetting.
- Reviewer assignment acceptance and conflict declaration.
- Blind double review.
- Adjudication.
- Rewards statement and dispute.
- Feature-hidden behavior for ineligible users.
- Keyboard navigation, focus order, screen-reader labels and error announcements.
- Mobile and low-bandwidth behavior.

### 20.5 Security tests

- IDOR across applications, assignments, decisions and documents.
- Capability and subject escalation.
- Upload content-type and size validation.
- Stored and reflected XSS in evidence notes and review text.
- SQL injection attempts against filters and search.
- Replay of submission and financial mutations.
- Log inspection for PII or financial data.

---

## 21. Acceptance Criteria

The feature is acceptable only when all of the following are true:

1. It is disabled by default and invisible to ordinary pilot users.
2. An ordinary tutor cannot apply without an invitation or self-promote into the Council.
3. Reviewer authority is subject-specific and independently accredited.
4. Active WAEC examiners are blocked without valid recorded clearance.
5. Each publication requires two independent locked reviews.
6. Material disagreement requires independent adjudication.
7. No reviewer approves their own submitted or edited content.
8. Credential evidence is private and authorization-protected.
9. Every reviewed item has immutable content and decision hashes.
10. Every publication and correction is versioned and auditable.
11. The reward ledger uses integer pesewas and idempotent entries.
12. Reviewers cannot approve their own payouts.
13. Student-facing wording does not imply WAEC endorsement.
14. Existing BrillaPrep features pass regression tests.
15. The one-subject pilot produces measured quality, turnaround and unit-cost evidence before expansion.

---

## 22. Rollback and Incident Response

Because migrations are additive, rollback means disabling operations, not deleting evidence.

Emergency sequence:

1. Disable new assignments or the master feature flag.
2. Freeze affected subject cases.
3. Revoke or suspend compromised accreditation.
4. Unpublish affected content versions while preserving audit history.
5. Quarantine suspected confidential material.
6. Notify authorized internal stakeholders.
7. Investigate and record the incident.
8. Reconcile any affected reviewer payments.
9. Revalidate affected content before re-enabling publication.

Do not hard-delete review history, financial records or integrity evidence during an incident.

---

## 23. Existing Repository Integration Points

The implementation agent should verify these paths before editing:

- `src/App.tsx` for teacher and administrator route groups.
- `src/components/layout/Sidebar.tsx` for conditional tutor navigation.
- `src/components/admin/layout/AdminSidebar.tsx` for administrator navigation.
- `src/pages/ContentManagement.tsx` for existing content-management patterns.
- `src/pages/TeacherBonusStatus.tsx` for current teacher reward presentation patterns.
- `src/lib/services.ts` for API service conventions.
- `src/types/index.ts` and `src/types/tutoring.ts` for strict shared types.
- `workers/api/auth-middleware.ts` for verified JWT identity.
- `workers/api/teacher-bonuses.ts` for financial workflow lessons, but do not copy floating-point money behavior into the Council ledger.
- `workers/api/index.ts` for route mounting only.
- `database/schema.sql` and the latest `database/migrations/` files for current schema state.
- Existing `questions`, `users`, `subjects`, `exam_types`, audit and notification tables.

Prefer new focused files:

- `workers/api/assessment-review.ts`
- `workers/api/assessment-review/` submodules if the route grows.
- `src/pages/review-council/`
- `src/pages/admin/review-council/`
- `src/stores/assessmentReviewStore.ts`
- `src/types/assessmentReview.ts`
- `src/lib/assessmentReviewService.ts`

These are recommendations, not permission to ignore better-established patterns found at implementation time.

---

## 24. Policy Copy Required Before Launch

Prepare and obtain review of:

- Council charter.
- Reviewer code of conduct.
- Confidentiality and examination-integrity agreement.
- Intellectual-property and work-product agreement.
- Conflict-of-interest policy.
- Active-examiner clearance policy.
- Credential privacy notice and retention schedule.
- Honorarium, quality bonus and dispute policy.
- Correction, appeal and revalidation policy.
- Public terminology and non-endorsement guidance.

---

## 25. Final Build Directive

This feature is a **post-pilot investment**, not current MVP work.

When authorized, build the smallest valid vertical slice:

> One subject, two permanent operators, two accredited reviewers, one adjudicator, one rights-cleared batch, double-blind review, versioned publication and an auditable manual-payment ledger.

Do not begin with every subject, public reviewer recruitment, automatic payouts, NTC points or active WAEC examiner participation.

The feature succeeds when BrillaPrep can prove why a question is trusted, who was authorized to assess it, what evidence supported the decision, what changed over time and how the experts were fairly rewarded.

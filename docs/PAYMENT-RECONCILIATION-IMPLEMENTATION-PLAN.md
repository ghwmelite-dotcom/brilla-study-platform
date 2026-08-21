# Payment Reconciliation Implementation Plan

## Objective

Make subscription payment settlement correct when the browser callback is lost,
webhooks are replayed, or the six-hour maintenance job encounters an old pending
checkout. A provider-confirmed successful payment must apply the subscription,
credits, trial conversion, referral commission, and receipt at most once.

## Safety invariants

1. Never trust client totals or a webhook amount without matching the stored
   transaction amount and currency.
2. Verify every stale transaction and every `charge.success` reference with
   Paystack before changing payment state.
3. Never fail a transaction merely because it is old. Only provider-terminal
   non-success statuses may move a row to `failed`.
4. Settlement entitlement writes and the settlement marker run in one D1 batch.
   D1 batches are transactional; a failed statement rolls back the batch.
5. Duplicate callbacks, duplicate webhooks, and callback/webhook races must not
   add subscription credits, affiliate earnings, or points more than once.
6. Persist only a sanitized Paystack summary. Do not store customer email,
   authorization data, IP addresses, or full webhook payloads.
7. Ignore unrelated Paystack references at the subscription webhook boundary.
8. Do not mutate the 51 historical pending rows until the deployed reconciler
   has verified each reference against Paystack.

## Implementation

1. Add migration 099 with settlement/reconciliation timestamps, webhook
   transaction references, affiliate effect markers, and uniqueness/indexes.
   Backfill existing successful payments and existing commissions as already
   applied so they cannot be re-credited.
2. Extract a shared settlement module used by authenticated callback verification,
   `charge.success`, and scheduled reconciliation.
3. Apply subscription and trial effects in a guarded D1 batch. Apply referral
   commission, earnings, conversion points, and house points in a second guarded
   D1 batch with an explicit effects marker, then mark affiliate processing done.
4. Make initialization failures transition their locally created pending row to
   failed with a sanitized provider summary.
5. Process signed `charge.success` events only for `SUB_` references, re-verify
   with Paystack, settle, and record an idempotent webhook receipt.
6. Every six hours, inspect at most 25 stale subscription payments ordered by
   least-recent reconciliation. Settle verified successes, fail only verified
   terminal failures, and leave provider-pending or transient failures pending.
7. Retry successful payments whose affiliate side effects remain incomplete.

## Verification gates

- Migration test preserves rows, backfills legacy markers, and rejects duplicate
  commission transaction IDs.
- Unit tests cover amount/currency/reference mismatch, exact-once settlement,
  webhook replay, callback/webhook race, terminal/non-terminal reconciliation,
  Paystack outages, initialization failure, and sanitized persistence.
- Focused payment tests, API typecheck, API lint, full test suite, production
  build, canonical-schema verification, and `git diff --check` pass.
- Apply migration to isolated staging, deploy the staging Worker, and run signed
  fixture QA without touching production payment data.
- After review, merge, apply migration 099 to production, deploy the Worker, and
  run read-only health/auth/payment aggregate checks. No synthetic production
  webhook and no forced historical status changes.


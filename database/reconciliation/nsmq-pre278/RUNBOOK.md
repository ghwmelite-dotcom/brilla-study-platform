# NSMQ pre-278 one-row reconciliation

This flight is ordered **after canonical migration 267 (and 268-270) and before immutable migration 278**. It may not be skipped or reordered. The runner stops on the first failed SQL file.

1. Run `run-flight.cjs --env <production|staging> --confirm <env>:<pinned-uuid>`.
2. Confirm `90_postflight.sql` passed.
3. Run unchanged canonical migrations 278, 279, 280, 281, and 282 in exact order, followed by their canonical postflight.
4. Run `99_cleanup_after_release.sql` explicitly only after the canonical release passes.

`rollback/01_restore_legacy_topic.sql` is separate and valid only before migration 278. Neither rollback nor cleanup is in the forward runner.

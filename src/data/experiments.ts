// The experiment corpus now lives in shared/ so the worker grades against the
// same definitions the frontend renders. This shim keeps `@/data/experiments`
// imports working.
export * from '../../shared/experiments';

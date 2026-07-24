import { PlatformError } from '@gei/shared';

export type Result<T> = Success<T> | Failure;

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Failure {
  readonly ok: false;
  readonly error: PlatformError;
}

export const Result = {
  success<T>(value: T): Result<T> {
    return { ok: true, value };
  },

  failure(error: PlatformError): Result<never> {
    return { ok: false, error };
  },
};
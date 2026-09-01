import "server-only";
import { ApiError } from "@/lib/db/handle-prisma-error";

function badRequest(message: string): never {
  throw new ApiError(400, "Bad Request", message);
}

export function asNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "")
    badRequest(`${field} must be a non-empty string.`);
  return value;
}

export function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") badRequest(`${field} must be a string.`);
  return value;
}

export function asIn<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    badRequest(`${field} must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}

export function asOptionalIn<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T | undefined {
  if (value === undefined || value === null) return undefined;
  return asIn(value, allowed, field);
}

export function asPositiveInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) {
    badRequest(`${field} must be a positive integer.`);
  }
  return n;
}

export function asOptionalInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value))
    badRequest(`${field} must be an integer.`);
  return value;
}

export function asOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") badRequest(`${field} must be a boolean.`);
  return value;
}

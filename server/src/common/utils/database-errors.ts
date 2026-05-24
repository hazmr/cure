import { ConflictException } from '@nestjs/common';

type DatabaseError = {
  code?: string;
  constraint?: string;
  detail?: string;
};

export function isUniqueViolation(error: unknown): error is DatabaseError {
  return typeof error === 'object' && error !== null && (error as DatabaseError).code === '23505';
}

export function throwConflictForUniqueViolation(error: unknown, message: string): never {
  if (isUniqueViolation(error)) {
    throw new ConflictException(message);
  }

  throw error;
}


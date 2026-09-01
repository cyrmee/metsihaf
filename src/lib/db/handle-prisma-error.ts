import "server-only";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    message: string,
  ) {
    super(message);
  }

  toBody() {
    return { statusCode: this.status, error: this.error, message: this.message };
  }
}

/** Maps a thrown value (Prisma errors in particular) to an HTTP status + JSON error body. */
export function toApiError(exception: unknown): ApiError {
  if (exception instanceof ApiError) return exception;

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case "P2002":
        return new ApiError(409, "Conflict", "A record with this value already exists.");
      case "P2025":
        return new ApiError(404, "Not Found", "The requested record was not found.");
      default:
        return new ApiError(500, "Internal Server Error", "A database error occurred.");
    }
  }

  if (exception instanceof Prisma.PrismaClientInitializationError) {
    return new ApiError(
      503,
      "Service Unavailable",
      "Database is unavailable. Please try again shortly.",
    );
  }

  if (exception instanceof Prisma.PrismaClientValidationError) {
    return new ApiError(400, "Bad Request", "Invalid request data.");
  }

  return new ApiError(500, "Internal Server Error", "An unexpected error occurred.");
}

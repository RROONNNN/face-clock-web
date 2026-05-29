import { Request, Response } from 'express';
import { Types } from 'mongoose';

// ── Authenticated user attached by JWT middleware ──────────
export interface AuthUser {
  id: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// ── Generic API response shape ─────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field: string; message: string }[];
}

// ── Pagination ─────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination?: PaginationMeta;
}

// ── Socket user (attached by socket auth middleware) ────────
export interface SocketUser {
  id: string;
  role: string;
}

// ── Type helper: make Express handler compatible with async
export type AsyncHandler = (
  req: Request,
  res: Response,
) => Promise<Response | void>;

export type AuthAsyncHandler = (
  req: AuthenticatedRequest,
  res: Response,
) => Promise<Response | void>;

// ── Mongoose ObjectId helper ───────────────────────────────
export type ObjectId = Types.ObjectId;

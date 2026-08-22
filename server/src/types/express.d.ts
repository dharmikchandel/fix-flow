export interface AuthUser {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` once the request's JWT has been verified. */
      user?: AuthUser;
    }
  }
}

export {};

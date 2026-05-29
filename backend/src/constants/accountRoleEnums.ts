const ACCOUNT_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[keyof typeof ACCOUNT_ROLES];

export default ACCOUNT_ROLES;

import { baseAPI } from './base.api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export type LoginResult =
  | { success: true; token: string }
  | { success: false; message: string };

export async function loginApi(credentials: LoginCredentials): Promise<LoginResult> {
  const result = await baseAPI('/user/login', 'POST', credentials);
  if (!result.success) return result;
  const token = result.payload.token;
  if (typeof token !== 'string' || !token.trim()) {
    return { success: false, message: 'Login response is missing a token.' };
  }
  return { success: true, token };
}

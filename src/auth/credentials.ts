import { getAuthClient } from "./client";
import { emailConfirmRedirectTo, passwordResetRedirectTo } from "./urls";

export async function signInWithPassword(input: {
  email: string;
  password: string;
}) {
  return getAuthClient().auth.signInWithPassword(input);
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName?: string;
  emailRedirectTo?: string;
}) {
  return getAuthClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: input.emailRedirectTo ?? emailConfirmRedirectTo(),
      data: input.fullName ? { full_name: input.fullName } : undefined,
    },
  });
}

export async function resetPasswordForEmail(
  email: string,
  redirectTo?: string,
) {
  return getAuthClient().auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? passwordResetRedirectTo(),
  });
}

export async function updatePassword(password: string) {
  return getAuthClient().auth.updateUser({ password });
}

export async function signInWithOtpPhone(phone: string) {
  return getAuthClient().auth.signInWithOtp({ phone });
}

export async function verifyOtpSms(input: { phone: string; token: string }) {
  return getAuthClient().auth.verifyOtp({
    phone: input.phone,
    token: input.token,
    type: "sms",
  });
}

"use server";

import { loginSchema } from "./schema";
import * as service from "./service";

export async function loginAction(_prevState: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Input tidak valid." };
  }
  return service.login(parsed.data);
}

export async function logoutAction() {
  return service.logout();
}

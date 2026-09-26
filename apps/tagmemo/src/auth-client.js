import { createAuthClient } from "better-auth/client";

function client() {
  return createAuthClient();
}

export async function currentUser() {
  const { data, error } = await client().getSession();
  if (error) throw new Error("ログイン状態を確認できません");
  return data?.user ?? null;
}

export async function signIn(email, password) {
  const { error } = await client().signIn.email({ email, password });
  if (error) throw new Error(error.message ?? "ログインできません");
}

export async function signUp(name, email, password) {
  const { error } = await client().signUp.email({ name, email, password });
  if (error) throw new Error(error.message ?? "登録できません");
}

export async function signOut() {
  const { error } = await client().signOut();
  if (error) throw new Error("ログアウトできません");
}

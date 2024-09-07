import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

/**
 * SignupUser
 *
 * @description Create a new user in the Supabase database
 * @param email The email of the user
 * @param password The password of the user
 * @param name The name of the user
 * @returns An object with two properties: `data` and `error`. `data` contains the user data from Supabase and `error` contains an error if any occurred.
 */
export async function SignupUser(
  email: string,
  password: string,
  name: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      // Add the name as a metadata to the user
      data: {
        name: name,
      },
    },
  });

  return { data, error };
}

/**
 * LoginUser
 *
 * @description Login a user in the Supabase database
 * @param email The email of the user
 * @param password The password of the user
 * @returns An object with two properties: `data` and `error`. `data` contains the user data from Supabase and `error` contains an error if any occurred.
 */
export async function LoginUser(
  email: string,
  password: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  return { data, error };
}

import z from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .email({ message: "Correo electronico inválido" })
      .toLowerCase(),
    name: z.string(),
    password: z
      .string()
      .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
      .refine(
        (value) =>
          /[a-z]/.test(value) &&
          /[A-Z]/.test(value) &&
          /[0-9]/.test(value) &&
          /[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(value),
        {
          message:
            "La contraseña debe contener un caracter especial, un número y letras mayúsculas y minúsculas",
        }
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // Apunta al campo donde se encuentra el error
  });

export const loginschema = z.object({
  email: z
    .string()
    .email({ message: "Correo electronico inválido" })
    .toLowerCase(),
  password: z.string(),
});

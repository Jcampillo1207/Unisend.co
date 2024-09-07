"use client";
import { loginschema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoginUser } from "@/actions/auth-actions";
import { useRouter } from "next/navigation";

export const LoginForm = () => {
  const router = useRouter();
  const [viewPassword, setViewPassword] = useState<"password" | "text">(
    "password"
  );
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof loginschema>>({
    resolver: zodResolver(loginschema),
    resetOptions: {
      keepIsValid: true,
      keepDirtyValues: true,
    },
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginschema>) {
    toast.loading("Verificando tus datos...");
    console.log(values);
    const { data, error } = await LoginUser(values.email, values.password);

    if (error) {
      toast.dismiss();
      toast.error(error.message);
    } else {
      console.log(data);
      toast.dismiss();
      router.replace("/mailing");
    }
  }

  console.log(open);

  return (
    <div className="w-full max-w-lg p-5 lg:p-7 rounded-xl border bg-muted">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico:</FormLabel>
                <FormControl>
                  <Input placeholder="mail@mailbase.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña:</FormLabel>
                <FormControl>
                  <Input type={viewPassword} placeholder="****" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-end w-full">
            <Label
              className="text-xs hover:text-foreground text-muted-foreground cursor-pointer"
              onClick={() =>
                setViewPassword(
                  viewPassword === "password" ? "text" : "password"
                )
              }
            >
              Mostrar contraseña
            </Label>
          </div>
          <Button
            type="submit"
            variant={"default"}
            size={"default"}
            className="w-full mt-5"
          >
            Iniciar sesión
          </Button>
        </form>
      </Form>
    </div>
  );
};

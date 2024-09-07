"use client";
import { registerSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { SignupUser } from "@/actions/auth-actions";
import { toast } from "sonner";
import { SuccessPopup } from "./succes-popup";

export const RegisterForm = () => {
  const [viewPassword, setViewPassword] = useState<"password" | "text">(
    "password"
  );
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    resetOptions: {
      keepIsValid: true,
      keepDirtyValues: true,
    },
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    toast.loading("Verificando tus datos...");
    console.log(values);
    const { data, error } = await SignupUser(
      values.email,
      values.password,
      values.name
    );

    if (error) {
      toast.dismiss();
      toast.error(error.message);
    } else {
      console.log(data);
      toast.dismiss();
      setOpen(true);
    }
  }

  console.log(open);

  return (
    <>
      <div className="w-full max-w-lg p-5 lg:p-7 rounded-xl border bg-muted">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="w-full h-fit items-start justify-start grid grid-cols-1 xl:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico:</FormLabel>
                    <FormControl>
                      <Input placeholder="mail@mailbase.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Esta será tu cuenta de correo principal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre:</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirma tu contraseña:</FormLabel>
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
                Mostrar contraseñas
              </Label>
            </div>
            <Button
              type="submit"
              variant={"default"}
              size={"default"}
              className="w-full mt-5"
            >
              Registrarme
            </Button>
          </form>
        </Form>
      </div>
      <SuccessPopup open={open} email={form.getValues("email")} />
    </>
  );
};

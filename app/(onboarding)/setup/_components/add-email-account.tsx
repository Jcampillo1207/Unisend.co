import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
const supabase = createClient();

export default function AddEmailAccount() {
  const connectAccount = async () => {
    try {
      // Obtén el usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("Usuario no autenticado");
        return;
      }

      // Llama a la API del servidor y pasa el ID del usuario
      const response = await fetch(`/api/auth/google/url?user_id=${user.id}`);
      const { url } = await response.json();

      if (url) {
        window.location.href = url; // Redirige al usuario a Google para autorizar la cuenta de Gmail
      }
    } catch (error) {
      console.error("Error al conectar la cuenta de Gmail:", error);
    }
  };

  return (
    <Button
      variant={"default"}
      size={"sm"}
      className="rounded-full"
      onClick={connectAccount}
    >
      Agregar
      <Plus className="size-4"/>
    </Button>
  );
}

import { createClient } from "@/lib/supabase/server";
import { HeaderEmail } from "./_components/header-email";
import { redirect } from "next/navigation";
import MessageRender from "./_components/message-render";

// Este componente se ejecuta en el servidor
const EmailPage = async ({
  params,
  searchParams,
}: {
  params: { email: string };
  searchParams: { emailroute: string; sender: string; category: string };
}) => {

  const emailId = params.email; // Esto será '191d3acaf691f1b7'
  const email = searchParams.emailroute as string;
  const sender = searchParams.sender as string;


  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }


  if (!email) {
    return (
      <div>
        <h1>No encontramos tu dirección de correo electrónico</h1>
      </div>
    );
  }

  // Realizar la consulta al servidor (backend API)
  const response = await fetch(
    `https://unisend.co/api/mailing/single?userid=${user.id}&email=${email}&messageId=${emailId}`
  );

  if (!response.ok) {
    return (
      <div>
        <h1>Error al obtener los detalles del correo</h1>
      </div>
    );
  }

  const { message } = await response.json();

  console.log(message)


  return (
    <section className="w-full h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll flex flex-col items-start justify-start bg-muted/50 relative">
      <HeaderEmail userId={user.id} emailId={emailId} />
      <MessageRender emailData={message} />
    </section>
  );
};

export default EmailPage;

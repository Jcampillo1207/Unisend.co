
import { createClient } from "@/lib/supabase/server";
import { MessageRender } from "./_components/message-render";
import { HeaderEmail } from "./_components/header-email";

// Este componente se ejecuta en el servidor
const EmailPage = async ({
  params: { email: emailId },
  searchParams: { email },
}: {
  params: { email: string };
  searchParams: { email: string };
}) => {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <h1>Error al obtener los detalles del correo</h1>
      </div>
    );
  }
  // Realizar la consulta al servidor (backend API)
  const response = await fetch(
    `http://localhost:3000/api/mailing/single?userid=${user.id}&email=${email}&messageId=${emailId}`
  );

  if (!response.ok) {
    return (
      <div>
        <h1>Error al obtener los detalles del correo</h1>
      </div>
    );
  }

  const { message } = await response.json();

  return (
    <section className="w-full h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll flex flex-col items-start justify-start bg-muted/50 relative">
      <HeaderEmail userId={user.id} emailId={emailId} />
      <MessageRender
        bodyClassName="w-full bg-transparent mx-auto"
        titleClassName="py-0"
        data={message}
      />
    </section>
  );
};

export default EmailPage;

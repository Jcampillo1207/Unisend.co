import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("user_id", user?.id)
    .eq("principal", true)
    .single();

  if (error) {
    console.error(error);
    return response;
  }

  // Lista de rutas protegidas
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];

  // Ruta de login
  const loginUrl = "/login";

  // Ruta base de mailing
  const mailingBaseUrl = "/mailing";

  // Verificar si la ruta actual está en la lista de rutas protegidas
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (user) {
    // Si hay sesión...
    if (
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/home"
    ) {
      // Si intenta acceder a la página de inicio, redirigir a su ruta de mailing personalizada
      const userId = user.id; // O cualquier otro identificador único
      return NextResponse.redirect(
        new URL(`${mailingBaseUrl}?emailroute=${data.email}&category=Primary`, request.url)
      );
    } else if (request.nextUrl.pathname === loginUrl) {
      // Si intenta acceder a la página de login, redirigir a su ruta de mailing
      const userId = user.id;
      return NextResponse.redirect(
        new URL(`${mailingBaseUrl}?emailroute=${data.email}&category=Primary`, request.url)
      );
    }
  } else {
    // Si no hay sesión...
    if (isProtectedRoute) {
      // Si intenta acceder a una ruta protegida, redirigir al login
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }
  }

  return response;
}

// Especifica en qué rutas se ejecutará este middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routeOrder = [
  {
    path: "/welcome",
    order: 0,
    name: "Bienvenid@",
  },
  {
    path: "/explain",
    order: 1,
    name: "¿Cómo funciona?",
  },
  {
    path: "/setup",
    order: 2,
    name: "Configuración",
  },
  {
    path: "/onboarding",
    order: 3,
    name: "Onboarding",
  },
];
export const FooterOnboarding = () => {
  const pathname = usePathname();
  const currentIndex = routeOrder.findIndex((r) => r.path === pathname);
  const isLastRoute = currentIndex === routeOrder.length - 1;
  const isFirstRoute = currentIndex === 0;

  return (
    <footer className="w-full max-w-2xl items-center justify-between flex px-5 md:px-7 lg:px-0 mt-5">
      <Button variant={"outline"} size={"sm"} className="rounded-full" asChild>
        <Link href={isFirstRoute ? "/" : routeOrder[currentIndex - 1].path}>
        <ArrowLeft className="size-3 mr-1"/>
        {isFirstRoute ? "Salir" : "Regresar"}
        </Link>
      </Button>
      <Button variant={"outline"} size={"sm"} className="rounded-full hover:bg-primary/20 hover:text-primary" asChild>
        <Link href={isLastRoute ? "/mailing" : routeOrder[currentIndex + 1].path}>
          {isLastRoute ? "Finalizar" : "Siguiente"}
          <ArrowRight className="size-3 ml-1"/>
        </Link>
      </Button>
    </footer>
  );
};

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  // Or a custom loading skeleton component
  return (
    <section className="w-full h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll flex flex-col items-start justify-start bg-muted/50">
      <div className="w-full h-14 items-center justify-between flex px-4 border-b bg-background">
        Acciones
      </div>
      <div className="w-full items-start justify-start flex flex-col">
        <div className="w-full bg-muted/60 border-b p-5 md:px-7">
          <Skeleton className="w-full h-8 mb-2 max-w-3xl" />
          <Skeleton className="w-full h-4 mb-1.5 max-w-md" />
          <Skeleton className="w-full h-4 mb-1.5 max-w-xs" />
        </div>
      </div>
    </section>
  );
}

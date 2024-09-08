import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  // Or a custom loading skeleton component
  return (
    <section className="w-full h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll gap-y-7 flex flex-col items-start justify-start bg-muted/50">
      <div className="w-full h-14 items-center justify-between flex px-5 md:px-7 lg:px-14 border-b bg-background">
        header
      </div>
      <div className="px-5 md:px-7 lg:px-14 items-start justify-start flex flex-col">
        <Skeleton className="w-full max-w-3xl h-10 bg-muted-foreground/50"/>
      </div>
    </section>
  );
}

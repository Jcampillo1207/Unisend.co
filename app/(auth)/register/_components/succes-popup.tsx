import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const SuccessPopup = ({
  open,
  email,
}: {
  open: boolean;
  email: string;
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Verifica tu correo electrónico</AlertDialogTitle>
          <AlertDialogDescription className="tracking-wide flex-wrap">
            Hemos enviado un enlace de verificación a{" "}
            <span className="italic text-foreground bg-primary/20 px-1.5 py-0.5">
              {email}
            </span>
            , da click en el enlace para continuar. Recuerda revisar en tu
            carpeta de spam
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

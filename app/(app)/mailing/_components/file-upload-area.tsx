import React, { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Icon } from "react-extension-icons";
import { Progress } from "@/components/ui/progress";

interface FileWithPreview extends File {
  preview?: string;
}

interface FileUploadAreaProps {
  onFilesAdded: (files: File[]) => void;
  onFileRemoved: (file: File) => void;
  attachments: FileWithPreview[];
}

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB en bytes

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFilesAdded,
  onFileRemoved,
  attachments,
}) => {
  const totalSize = useMemo(
    () => attachments.reduce((acc, file) => acc + file.size, 0),
    [attachments]
  );

  const remainingSize = MAX_SIZE - totalSize;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newTotalSize =
        totalSize + acceptedFiles.reduce((acc, file) => acc + file.size, 0);

      if (newTotalSize > MAX_SIZE) {
        toast.warning(
          `No se pueden agregar más archivos. El límite es de ${formatFileSize(
            MAX_SIZE
          )}.`
        );
        return;
      }

      const filesWithPreview = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
        })
      );
      onFilesAdded(filesWithPreview);
      toast.success(
        `${
          acceptedFiles.length > 1 ? "Archivos agregados" : "Archivo agregado"
        } correctamente`
      );
    },
    [onFilesAdded, totalSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: remainingSize <= 0,
  });

  const formatFileSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    if (mb < 1) {
      return `${(mb * 1024).toFixed(2)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const handleFileRemove = (file: File) => {
    onFileRemoved(file);
  };

  return (
    <div className="w-full h-full flex flex-col gap-y-3 border-l">
      <div className="px-4 h-14 items-center justify-start shrink-0 flex border-b">
        <h2 className="text-lg font-semibold">Archivos adjuntos</h2>
      </div>
      <div className="w-full h-full flex flex-col gap-y-3 p-4">
        <div className="flex flex-col overflow-y-scroll border max-h-[80dvh] shrink-0 flex-1 bg-muted/50 rounded-lg max-w-full w-full overflow-x-hidden no-srollbar">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b w-full max-w-full"
            >
              <div className="flex items-center gap-x-2 flex-1 p-2 shrink-0">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded-lg border bg-background"
                  />
                ) : (
                  <div className="size-10 items-center justify-center flex bg-background rounded-lg border">
                    {(file.type && (
                      <Icon
                        variant="color"
                        extension={file.type.split("/")[1]}
                        className="size-5"
                      />
                    )) || <FileIcon className="size-5" />}
                  </div>
                )}
                <span className="flex-1 max-w-[170px] flex flex-col gap-y-0 items-start justify-start">
                  <p className="text-sm truncate w-full">{file.name}</p>
                  <p className="text-xs text-muted-foreground italic">
                    {formatFileSize(file.size)}
                  </p>
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-full shrink-0 rounded-none bg-destructive/20 text-red-500 hover:bg-destructive/30 hover:text-red-500"
                onClick={() => handleFileRemove(file)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div
          {...getRootProps()}
          className={`w-full h-auto aspect-video border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer ${
            isDragActive
              ? "border-primary bg-primary/10 text-primary"
              : remainingSize <= 0
              ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border text-muted-foreground"
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-center">
            {isDragActive
              ? "Suelta los archivos aquí..."
              : remainingSize <= 0
              ? "Límite de archivos alcanzado"
              : "Arrastra y suelta archivos aquí, o haz clic para seleccionar"}
          </p>
        </div>
        <div className="w-full h-fit items-center justify-center flex flex-col">
          <Progress value={(1 - remainingSize / MAX_SIZE) * 100} />
          <p className="text-xs text-muted-foreground mt-2">
            {formatFileSize(totalSize)} / {formatFileSize(MAX_SIZE)} usado
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadArea;

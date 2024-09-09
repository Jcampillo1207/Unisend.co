import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Importa el editor de Quill de manera dinámica para evitar SSR
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export const ReactQuillEditor = ({ value, onChange }) => {
  // Configuración de los módulos de Quill
  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    },
    clipboard: {
      matchVisual: false,
    },
  };

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={quillModules}
      placeholder="Escribe tu mensaje"
      className="selection:text-foreground selection:bg-primary/50"
    />
  );
};

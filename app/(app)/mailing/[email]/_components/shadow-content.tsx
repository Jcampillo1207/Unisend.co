import React, { useEffect, useRef } from "react";

const ShadowContent: React.FC<{ html: string }> = ({ html }) => {
  const shadowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Verificar si el shadowRoot ya ha sido creado
    if (shadowRef.current && !shadowRef.current.shadowRoot) {
      // Solo crea el Shadow DOM si aún no existe
      const shadowRoot = shadowRef.current.attachShadow({ mode: "open" });

      // Crear un contenedor en el shadow DOM
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;

      // Insertar el contenido HTML dentro del Shadow DOM
      shadowRoot.appendChild(wrapper);
    }
  }, [html]);

  return <div ref={shadowRef} />;
};

export default ShadowContent;

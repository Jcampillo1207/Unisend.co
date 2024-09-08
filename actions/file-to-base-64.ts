export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]); // Obtener solo la parte Base64
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file); // Leer archivo como Data URL
  });
}

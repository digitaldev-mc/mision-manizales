export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Respuesta inválida del servidor");
  }
}

export function resetFormElement(form: HTMLFormElement | null) {
  if (!form) return;
  try {
    form.reset();
  } catch {
    /* El nodo pudo desmontarse tras el await */
  }
}

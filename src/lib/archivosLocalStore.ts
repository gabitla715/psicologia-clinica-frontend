// ────────────────────────────────────────────────────────────────
// Almacenamiento local de archivos (IndexedDB), usado para guardar
// el documento de entrevista inicial firmado por el estudiante.
//
// ⚠️ El backend no tiene ningún endpoint de subida de archivos
// (verificado: cero `MultipartFile` en todo el proyecto). Mientras
// no exista, el archivo se queda en el navegador del especialista
// que lo sube — no se comparte entre dispositivos ni queda respaldado
// en el servidor. Ver PEDIDO-PARA-GABO.md, punto 4.
//
// Uso:
//   await archivosLocalStore.guardar('entrevista-firmada:123', file);
//   const archivo = await archivosLocalStore.obtener('entrevista-firmada:123');
//   const url = archivosLocalStore.crearUrl(archivo.blob);
// ────────────────────────────────────────────────────────────────

const DB_NAME = 'psicologia-clinica-archivos';
const STORE_NAME = 'archivos';
const DB_VERSION = 1;

export interface ArchivoGuardado {
  key: string;
  nombreOriginal: string;
  tipo: string;
  tamanoBytes: number;
  fechaGuardado: string; // ISO
  blob: Blob;
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const archivosLocalStore = {
  /** Guarda un archivo bajo una clave (ej. `entrevista-firmada:{fichaId}`). */
  async guardar(key: string, file: File): Promise<void> {
    const db = await abrirDb();
    const registro: ArchivoGuardado = {
      key,
      nombreOriginal: file.name,
      tipo: file.type,
      tamanoBytes: file.size,
      fechaGuardado: new Date().toISOString(),
      blob: file,
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(registro);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Recupera un archivo guardado, o `null` si no existe. */
  async obtener(key: string): Promise<ArchivoGuardado | null> {
    const db = await abrirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as ArchivoGuardado) ?? null);
      req.onerror = () => reject(req.error);
    });
  },

  /** Elimina un archivo guardado. */
  async eliminar(key: string): Promise<void> {
    const db = await abrirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Crea una URL temporal para previsualizar/descargar el blob. Recuerda revocarla con `URL.revokeObjectURL`. */
  crearUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  },
};

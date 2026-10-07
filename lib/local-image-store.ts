import { localAssetIds } from "./markdown-document.ts";

const DATABASE_NAME = "markdownpic-local-assets";
const DATABASE_VERSION = 1;
const IMAGE_STORE = "images";
const ASSET_PREFIX = "asset:";

type StoredImage = {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: number;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("Local image storage is unavailable"));
      return;
    }
    let settled = false;
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      reject(request.error ?? new Error("Local image storage is unavailable"));
    };
    request.onblocked = () => {
      if (settled) return;
      settled = true;
      reject(new Error("Local image storage is blocked by another tab"));
    };
  });
}

export function localImageUrl(id: string) {
  return `${ASSET_PREFIX}${id}`;
}

export function localImageIdFromUrl(url: string) {
  return url.startsWith(ASSET_PREFIX) ? url.slice(ASSET_PREFIX.length) : null;
}

export function localImageIdsFromMarkdown(markdown: string) {
  return localAssetIds(markdown);
}

export async function saveLocalImage(blob: Blob, name: string) {
  const randomPart = typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  const id = `img-${Date.now().toString(36)}-${randomPart}`;
  const record: StoredImage = {
    id,
    name,
    type: blob.type || "image/png",
    blob,
    createdAt: Date.now(),
  };
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(IMAGE_STORE, "readwrite");
      transaction.objectStore(IMAGE_STORE).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Image could not be stored locally"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Image storage was interrupted"));
    });
  } finally {
    database.close();
  }
  return id;
}

export async function loadLocalImage(id: string) {
  const database = await openDatabase();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const transaction = database.transaction(IMAGE_STORE, "readonly");
      const request = transaction.objectStore(IMAGE_STORE).get(id);
      request.onsuccess = () => resolve((request.result as StoredImage | undefined)?.blob ?? null);
      request.onerror = () => reject(request.error ?? new Error("Image could not be restored"));
    });
  } finally {
    database.close();
  }
}

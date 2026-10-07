import { pagesFromMarkdown } from "./markdown-document.ts";
import { LEGACY_DRAFT_KEY, exampleMarkdown, newProject, normalizeDesign, type Project, type BrandProfile } from "./studio-model.ts";

const DATABASE = "markdownpic-projects";
const ACTIVE_KEY = "markdownpic.active-project.v2";
const CHANNEL = "markdownpic-project-updates";

export class ProjectConflictError extends Error {
  constructor() { super("This project changed in another tab. Open the latest version or save your work as a copy."); }
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error("Browser storage is unavailable. You can still export images and back up your project."));
    let settled = false;
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("projects", { keyPath: "id" });
      request.result.createObjectStore("profiles", { keyPath: "id" });
    };
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      settled = true;
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => { settled = true; reject(new Error("Local storage could not be opened. Back up your project before leaving.")); };
    request.onblocked = () => { settled = true; reject(new Error("Storage is busy in another tab. Close the older tab and try again.")); };
  });
}

async function read<T>(store: string, key?: string): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(store, "readonly");
      const request = key ? transaction.objectStore(store).get(key) : transaction.objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

function announce(id: string, revision: number) {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage({ id, revision });
  channel.close();
}

export function watchProjects(callback: (id: string, revision: number) => void) {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = event => {
    if (event.data && typeof event.data.id === "string" && typeof event.data.revision === "number") callback(event.data.id, event.data.revision);
  };
  return () => channel.close();
}

function localSaveError(error: unknown) {
  return new Error(error instanceof DOMException && error.name === "QuotaExceededError"
    ? "Your browser is out of storage. Back up this project before leaving."
    : "Local save failed. Back up this project before leaving.");
}

export async function saveProject(project: Project, expectedRevision: number): Promise<Project> {
  const db = await database();
  try {
    const saved = await new Promise<Project>((resolve, reject) => {
      const transaction = db.transaction("projects", "readwrite");
      const store = transaction.objectStore("projects");
      const request = store.get(project.id);
      let next: Project;
      let conflict = false;
      let writeFailure: unknown;
      request.onsuccess = () => {
        const existing = request.result as Project | undefined;
        if ((existing?.revision ?? 0) !== expectedRevision) {
          conflict = true;
          transaction.abort();
          return;
        }
        next = { ...project, updatedAt: Date.now(), revision: expectedRevision + 1 };
        // This runs after the Promise executor: synchronous put errors must be
        // caught here, otherwise they escape into the page's global error handler.
        try { store.put(next); }
        catch (error) { writeFailure = error; transaction.abort(); }
      };
      transaction.oncomplete = () => resolve(next);
      transaction.onabort = () => reject(conflict ? new ProjectConflictError() : localSaveError(writeFailure ?? transaction.error));
      transaction.onerror = () => reject(localSaveError(transaction.error));
    });
    try { localStorage.setItem(ACTIVE_KEY, project.id); } catch { /* The document itself is safely stored in IndexedDB. */ }
    announce(saved.id, saved.revision);
    return saved;
  } finally { db.close(); }
}

export const loadProject = (id: string) => read<Project | undefined>("projects", id);
export function setActiveProject(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* Optional preference. */ }
}
export const listProjects = async () => (await read<Project[]>("projects")).sort((a, b) => b.updatedAt - a.updatedAt);
export const listProfiles = () => read<BrandProfile[]>("profiles");

export async function deleteProject(id: string) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("projects", "readwrite");
      transaction.objectStore("projects").delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error("The project could not be removed."));
    });
    announce(id, -1);
  } finally { db.close(); }
}

export async function saveProfile(profile: BrandProfile) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("profiles", "readwrite");
      transaction.objectStore("profiles").put(profile);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error("The style could not be saved."));
    });
  } finally { db.close(); }
}

export async function initialProject(): Promise<Project> {
  const projects = await listProjects();
  let activeId = "";
  try { activeId = localStorage.getItem(ACTIVE_KEY) ?? ""; } catch { /* Optional preference. */ }
  if (projects.length) return projects.find(p => p.id === activeId) ?? projects[0];
  let legacy: string | null = null;
  try { legacy = localStorage.getItem(LEGACY_DRAFT_KEY); } catch { /* IndexedDB can still work. */ }
  if (legacy) {
    let draft: Record<string, unknown>;
    try { draft = JSON.parse(legacy); } catch { throw new Error("Your older draft could not be read. It has not been changed or deleted."); }
    if (typeof draft.markdown !== "string") throw new Error("Your older draft is missing its text. It has been kept untouched.");
    const migrated = newProject(draft.markdown, typeof draft.fileName === "string" ? draft.fileName : "Recovered draft", normalizeDesign(draft));
    migrated.pages = pagesFromMarkdown(draft.markdown);
    migrated.mode = draft.outputMode === "carousel" ? "carousel" : "single";
    // Keep the original legacy record as an untouched recovery copy.
    return saveProject(migrated, 0);
  }
  return saveProject(newProject(exampleMarkdown, "My first picture"), 0);
}

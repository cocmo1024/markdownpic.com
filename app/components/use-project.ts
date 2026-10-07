"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialProject, ProjectConflictError, saveProject, setActiveProject, watchProjects } from "@/lib/project-store";
import { exampleMarkdown, newId, newProject, type Project } from "@/lib/studio-model";
import { saveLatestSnapshot } from "@/lib/save-latest";

export function useProject() {
  const [project, setProject] = useState(() => newProject(exampleMarkdown, "My first picture"));
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"loading" | "saving" | "saved" | "error" | "conflict">("loading");
  const [saveError, setSaveError] = useState("");
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const current = useRef(project);
  const revisions = useRef(new Map<string, number>());
  const savedSnapshots = useRef(new Map<string, Project>());
  const boot = useRef<Promise<Project> | null>(null);
  const initialized = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const conflict = useRef(false);
  const past = useRef<Project[]>([]);
  const future = useRef<Project[]>([]);
  const lastTypingAt = useRef(0);
  const mounted = useRef(true);
  const restorationFailed = useRef(false);
  const writing = useRef(false);

  const flush = useCallback(async () => {
    const save = async (snapshot: Project) => {
      if (conflict.current && current.current.id === snapshot.id) throw new ProjectConflictError();
      writing.current = true;
      if (mounted.current && current.current.id === snapshot.id) setSaveState("saving");
      try {
        const saved = await saveProject(snapshot, revisions.current.get(snapshot.id) ?? snapshot.revision);
        revisions.current.set(saved.id, saved.revision);
        savedSnapshots.current.set(snapshot.id, snapshot);
        if (mounted.current && current.current === snapshot) { setSaveState("saved"); setSaveError(""); }
      } catch (error) {
        if (mounted.current && current.current.id === snapshot.id) {
          const isConflict = error instanceof ProjectConflictError;
          conflict.current = isConflict;
          setSaveState(isConflict ? "conflict" : "error");
          setSaveError(error instanceof Error ? error.message : "Local save failed. Back up your project before leaving.");
        }
        throw error;
      } finally { writing.current = false; }
    };
    queue.current = queue.current.catch(() => {}).then(() => saveLatestSnapshot({
      read: () => current.current,
      isSaved: snapshot => {
        const saved = savedSnapshots.current.get(snapshot.id) === snapshot;
        if (saved && mounted.current && !conflict.current) setSaveState("saved");
        return saved;
      },
      write: save,
    }));
    return queue.current;
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Fast Refresh reconnects effects while preserving refs and the current edit.
    // Do not replay the first restored project over a later project or unsaved work.
    if (initialized.current) return () => { mounted.current = false; };
    let cancelled = false;
    boot.current ??= initialProject();
    void boot.current.then(loaded => {
      if (cancelled) return;
      initialized.current = true;
      current.current = loaded;
      revisions.current.set(loaded.id, loaded.revision);
      savedSnapshots.current.set(loaded.id, loaded);
      setProject(loaded); setReady(true); setSaveState("saved");
    }).catch(error => {
      if (cancelled) return;
      initialized.current = true;
      restorationFailed.current = true;
      setReady(true); setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "The local draft could not be restored. Existing data was not changed.");
    });
    return () => { cancelled = true; mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!ready || restorationFailed.current || savedSnapshots.current.get(project.id) === project) return;
    const timer = setTimeout(() => { void flush().catch(() => {}); }, 450);
    return () => clearTimeout(timer);
  }, [project, ready, flush]);

  useEffect(() => {
    const visibility = () => { if (document.visibilityState === "hidden" && ready && !restorationFailed.current) void flush().catch(() => {}); };
    const leaving = (event: BeforeUnloadEvent) => {
      if (ready && savedSnapshots.current.get(current.current.id) !== current.current) { event.preventDefault(); event.returnValue = ""; }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("beforeunload", leaving);
    return () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("beforeunload", leaving); };
  }, [ready, flush]);

  useEffect(() => watchProjects((id, revision) => {
    if (id !== current.current.id || revision === revisions.current.get(id)) return;
    if (revision > (revisions.current.get(id) ?? 0) || revision === -1) {
      conflict.current = true;
      setSaveState("conflict");
      setSaveError("This project changed in another tab. Open the latest version, or save this version as a copy.");
    }
  }), []);

  const apply = useCallback((update: Project | ((current: Project) => Project), typing = false) => {
    const previous = current.current;
    const next = typeof update === "function" ? update(previous) : update;
    if (next === previous) return;
    restorationFailed.current = false;
    const now = Date.now();
    if (!typing || now - lastTypingAt.current > 700 || !past.current.length) {
      past.current = [...past.current.slice(-39), previous];
    }
    lastTypingAt.current = typing ? now : 0;
    future.current = [];
    current.current = { ...next, updatedAt: now };
    setProject(current.current);
    if (!conflict.current) setSaveState("saving");
    setHistoryState({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 });
  }, []);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(current.current);
    current.current = previous; setProject(previous); setSaveState(conflict.current ? "conflict" : !writing.current && savedSnapshots.current.get(previous.id) === previous ? "saved" : "saving"); lastTypingAt.current = 0;
    setHistoryState({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 });
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(current.current);
    current.current = next; setProject(next); setSaveState(conflict.current ? "conflict" : !writing.current && savedSnapshots.current.get(next.id) === next ? "saved" : "saving"); lastTypingAt.current = 0;
    setHistoryState({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 });
  }, []);

  const open = useCallback(async (next: Project, preserveCurrent = true) => {
    if (preserveCurrent) await flush();
    conflict.current = false;
    restorationFailed.current = false;
    current.current = next;
    setActiveProject(next.id);
    revisions.current.set(next.id, next.revision);
    if (next.revision) savedSnapshots.current.set(next.id, next);
    past.current = []; future.current = [];
    setProject(next); setSaveError(""); setSaveState(next.revision ? "saved" : "saving");
    setHistoryState({ canUndo: false, canRedo: false });
  }, [flush]);

  const saveCopy = useCallback(async () => {
    const copy = { ...structuredClone(current.current), id: newId(), revision: 0, name: `${current.current.name} copy`, createdAt: Date.now() };
    await open(copy, false);
    await flush();
  }, [flush, open]);

  return { project, ready, saveState, saveError, apply, undo, redo, ...historyState, open, flush, saveCopy };
}

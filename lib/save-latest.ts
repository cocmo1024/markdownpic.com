/**
 * A write may finish after the user edits or undoes its snapshot.
 * Re-read after every write, including an undo back to a previously saved object.
 * Callers serialize invocations and update isSaved only after durable completion.
 */
export async function saveLatestSnapshot<T>(options: {
  read: () => T;
  isSaved: (snapshot: T) => boolean;
  write: (snapshot: T) => Promise<void>;
}) {
  while (true) {
    const snapshot = options.read();
    if (options.isSaved(snapshot)) return;
    await options.write(snapshot);
  }
}

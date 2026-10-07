/** Cancel/timeout the wait and always detach listeners. Underlying I/O also receives the signal where supported. */
export function withDeadline<T>(operation: PromiseLike<T>, options: { signal?: AbortSignal; timeoutMs: number; message: string }): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;
    let settled = false;
    const finish = (ok: boolean, value: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      if (ok) resolve(value as T); else reject(value);
    };
    const abort = () => finish(false, new DOMException("Cancelled. Your work is unchanged.", "AbortError"));
    Promise.resolve(operation).then(value => finish(true, value), error => finish(false, error));
    if (options.signal?.aborted) { abort(); return; }
    options.signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => finish(false, new Error(options.message)), options.timeoutMs);
  });
}

export function ok(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

export function err(e: Error | unknown) {
  const message = e instanceof Error ? e.message : String(e);
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

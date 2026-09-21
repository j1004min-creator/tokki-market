/** 폼 위에 뜨는 안내/오류 말풍선 */
export function FormMessage({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
  if (!error && !notice) return null;

  const isError = Boolean(error);

  return (
    <p
      role={isError ? "alert" : "status"}
      className={`rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${
        isError
          ? "border-rose/30 bg-rose-soft text-rose"
          : "border-leaf/30 bg-leaf-soft text-leaf"
      }`}
    >
      {isError ? `🥕 ${error}` : `🐰 ${notice}`}
    </p>
  );
}

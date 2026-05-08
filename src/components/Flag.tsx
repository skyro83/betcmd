export function Flag({
  url,
  code,
  size = 24,
}: {
  url?: string;
  code?: string;
  size?: number;
}) {
  const w = size;
  const h = Math.round(size * 0.7);
  if (url) {
    return (
      <img
        src={url}
        alt={code ? `Drapeau ${code}` : "Drapeau"}
        width={w}
        height={h}
        loading="lazy"
        style={{
          width: w,
          height: h,
          objectFit: "cover",
          borderRadius: 3,
          flex: "none",
          boxShadow: "inset 0 0 0 1px #ffffff14",
          background: "#1B2E4D",
        }}
      />
    );
  }
  // Neutral placeholder when the API didn't supply a flag URL.
  return (
    <span
      className="flag"
      style={{
        width: w,
        height: h,
        background: "var(--surface-2)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        color: "var(--text-3)",
        fontWeight: 700,
      }}
    >
      {(code ?? "").slice(0, 3)}
    </span>
  );
}

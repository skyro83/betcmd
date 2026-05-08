export function Avatar({
  name,
  color,
  size = 32,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const init = (name[0] ?? "?").toUpperCase();
  return (
    <span
      className="av"
      style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {init}
    </span>
  );
}

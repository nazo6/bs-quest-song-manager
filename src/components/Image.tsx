import clsx from "clsx";

export function base64ToImgSrc(base64: string | null) {
  return base64 ? `data:image/png;base64,${base64}` : null;
}

export function levelHashImageUrl(hash: string) {
  return `https://cdn.beatsaver.com/${hash}.jpg`;
}

export function MaybeImage(props: {
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  return props.src ? (
    <img
      src={props.src}
      alt={props.alt}
      className={clsx("border-solid border", props.className)}
    />
  ) : (
    <div
      className={clsx(
        "border-solid border flex justify-center items-center text-wrap",
        props.className,
      )}
    >
      No Image
    </div>
  );
}

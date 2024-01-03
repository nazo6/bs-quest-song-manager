import clsx from "clsx";

export function MaybeImage(props: {
  imageString?: string | null;
  alt?: string;
  className?: string;
}) {
  return props.imageString ? (
    <img
      src={`data:image/png;base64,${props.imageString}`}
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

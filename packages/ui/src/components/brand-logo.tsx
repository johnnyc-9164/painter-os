import { cn } from "@painter-os-bts/ui/lib/utils";
import { Paintbrush } from "lucide-react";
import type { ComponentProps } from "react";

const sizes = {
  sm: { tile: "size-7 rounded-[7px]", icon: 15, word: "text-base" },
  md: { tile: "size-9 rounded-[9px]", icon: 21, word: "text-[27px]" },
  lg: { tile: "size-14 rounded-[14px]", icon: 32, word: "text-4xl" },
} as const;

type BrandLogoProps = Omit<ComponentProps<"span">, "children"> & {
  /** `mark` renders the tile only; `full` adds the Painter OS wordmark. */
  variant?: "mark" | "full";
  /** `light` is for light surfaces, `dark` for dark ones. */
  tone?: "light" | "dark";
  size?: keyof typeof sizes;
};

function BrandLogo({
  variant = "full",
  tone = "light",
  size = "md",
  className,
  ...props
}: BrandLogoProps) {
  const s = sizes[size];
  const mark = (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center bg-brand text-white shadow-[0_3px_9px_#0867e812]",
        s.tile,
      )}
    >
      <Paintbrush size={s.icon} strokeWidth={2.4} />
    </span>
  );

  return (
    <span
      data-slot="brand-logo"
      className={cn("inline-flex items-center gap-2.5", className)}
      {...props}
    >
      {mark}
      {variant === "full" ? (
        <span
          className={cn(
            "font-extrabold tracking-[-0.04em] whitespace-nowrap",
            s.word,
            tone === "dark" ? "text-white" : "text-[#0d172a]",
          )}
        >
          Painter OS
        </span>
      ) : (
        <span className="sr-only">Painter OS</span>
      )}
    </span>
  );
}

export { BrandLogo };
export type { BrandLogoProps };

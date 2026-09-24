import Image from "next/image";
import { BRAND, LOGO_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandLogo({
  size = 40,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt={BRAND}
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-md", className)}
    />
  );
}

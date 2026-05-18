import { useEffect, useState } from "react";
import { resolveImageUrl } from "../../services/api";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

/**
 * Renders an <img>, but returns null if `src` is empty/null or the image fails to load.
 * Designed to sit on top of a fallback (initials, icon, gradient, etc.) so the fallback
 * shows through automatically when the image is missing or broken.
 *
 * Resolves relative API paths (e.g. "/uploads/customers/abc.jpg") against API_URL so
 * callers can store either a relative path, a data: URL, or an absolute URL.
 */
export function SafeImage({ src, ...rest }: Props) {
  const resolved = resolveImageUrl(src);
  const valid = !!resolved && !resolved.startsWith("blob:");
  const [broken, setBroken] = useState(!valid);

  useEffect(() => {
    setBroken(!valid);
  }, [resolved, valid]);

  if (broken || !resolved) return null;
  return <img src={resolved} onError={() => setBroken(true)} {...rest} />;
}

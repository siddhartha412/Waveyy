"use client";

import { useEffect, useMemo, useState } from "react";
import { toSaavnJpgUrl, toWebpUrl } from "@/lib/image-url";

export default function AdaptiveImage({
  src,
  alt = "",
  className = "",
  fallbackSrc = "/favi-icon.jpg",
  loading = "lazy",
  decoding = "async",
}) {
  const webpSrc = useMemo(() => toWebpUrl(src), [src]);
  const saavnJpgSrc = useMemo(() => toSaavnJpgUrl(src), [src]);
  const initial = webpSrc || src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initial);

  useEffect(() => {
    setCurrentSrc(initial);
  }, [initial]);

  const handleError = () => {
    if (currentSrc !== src && src) {
      setCurrentSrc(src);
      return;
    }
    if (saavnJpgSrc && currentSrc !== saavnJpgSrc) {
      setCurrentSrc(saavnJpgSrc);
      return;
    }
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      className={className}
    />
  );
}

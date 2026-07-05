"use client";

import { useEffect, useMemo, useState } from "react";
import { toSaavnJpgUrl, toWebpUrl, resizeSaavnUrl } from "@/lib/image-url";

/**
 * Enhanced AdaptiveImage component with Lighthouse optimizations
 * - Supports explicit width/height to prevent CLS
 * - Supports fetchPriority and priority prop for LCP optimization
 * - Handles WebP conversion and fallback gracefully
 * - Supports JioSaavn image resizing
 */
export default function AdaptiveImage({
  src,
  alt = "",
  className = "",
  fallbackSrc = "/favi-icon.jpg",
  loading = "lazy",
  decoding = "async",
  width,
  height,
  priority = false,
  fetchPriority = "auto",
  size = "500x500",
  onClick,
}) {
  const resizedSrc = useMemo(() => resizeSaavnUrl(src, size), [src, size]);
  const webpSrc = useMemo(() => toWebpUrl(resizedSrc), [resizedSrc]);
  const saavnJpgSrc = useMemo(() => toSaavnJpgUrl(resizedSrc), [resizedSrc]);
  
  // For LCP elements, we don't want to lazy load
  const finalLoading = priority ? undefined : loading;
  const finalFetchPriority = priority ? "high" : fetchPriority;

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
      loading={finalLoading}
      decoding={decoding}
      onError={handleError}
      className={className}
      width={width}
      height={height}
      fetchPriority={finalFetchPriority}
      onClick={onClick}
    />
  );
}

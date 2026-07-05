export const toWebpUrl = (url = "") => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:")) return null;
  if (/\.(webp)(\?.*)?$/i.test(url)) return url;
  if (/\.(jpe?g|png)(\?.*)?$/i.test(url)) {
    return url.replace(/\.(jpe?g|png)(\?.*)?$/i, ".webp$2");
  }
  return null;
};

export const toSaavnJpgUrl = (url = "") => {
  if (!url || typeof url !== "string") return null;
  if (!/saavncdn\.com/i.test(url)) return null;
  if (!/\.webp(\?.*)?$/i.test(url)) return null;
  return url.replace(/\.webp(\?.*)?$/i, ".jpg$1");
};

/**
 * Resizes a JioSaavn image URL to the requested size.
 * Valid sizes: 50x50, 150x150, 500x500
 */
export const resizeSaavnUrl = (url = "", size = "150x150") => {
  if (!url || typeof url !== "string") return url;
  if (!/saavncdn\.com/i.test(url)) return url;
  return url.replace(/-(50x50|150x150|500x500)\./i, `-${size}.`);
};

export const toWebpUrl = (url = "") => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:")) return null;
  if (/\.(webp)(\?.*)?$/i.test(url)) return url;
  if (/\.(jpe?g|png)(\?.*)?$/i.test(url)) {
    return url.replace(/\.(jpe?g|png)(\?.*)?$/i, ".webp$2");
  }
  return null;
};

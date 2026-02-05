export const decodeHTML = (str = "") => {
  if (typeof str !== "string") return str;

  // Client-side: use a safe DOM-based decoder.
  if (typeof window !== "undefined") {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  // Server-side fallback for common entities.
  const withAmp = str.replace(/&amp;/g, "&");
  return withAmp
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
};

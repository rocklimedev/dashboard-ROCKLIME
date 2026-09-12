// Add this helper function at the top
const extractFirstImageUrl = (imagesField) => {
  if (!imagesField) return null;

  try {
    // Case 1: Already an array
    if (Array.isArray(imagesField)) {
      return imagesField[0] || null;
    }

    // Case 2: String that might be JSON
    if (typeof imagesField === "string") {
      const trimmed = imagesField.trim();

      // If it looks like a direct URL (not starting with [ or {)
      if (trimmed.startsWith("http")) {
        return trimmed;
      }

      // Try parsing as JSON
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed[0] || null;
      }

      if (typeof parsed === "string" && parsed.startsWith("http")) {
        return parsed;
      }
    }

    return null;
  } catch (err) {
    // Last resort: if it's a plain URL string with quotes or garbage
    const str = String(imagesField).trim();
    if (str.startsWith("http")) {
      return str.replace(/^["']|["']$/g, ""); // remove wrapping quotes
    }

    return null;
  }
};

module.exports = {
  extractFirstImageUrl,
};

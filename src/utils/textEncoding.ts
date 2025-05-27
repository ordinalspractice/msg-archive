/**
 * Minimal text encoding fixes for very specific Facebook export artifacts
 * 
 * This should only be used as a last resort for cases where standard TextDecoder
 * doesn't handle specific Facebook quirks. Most encoding issues should be resolved
 * by proper TextDecoder usage in encoding.ts
 */

/**
 * Applies very specific, minimal fixes to text that might remain after standard decoding.
 * This should be used sparingly, as TextDecoder should handle most cases.
 * Currently this function does nothing, to assess TextDecoder effectiveness.
 */
export function fixEncodingIssues(text: string): string {
  if (!text) return text;
  
  // TODO: If testing shows that TextDecoder('windows-1252') doesn't handle
  // some VERY SPECIFIC Facebook artifacts, add minimal, targeted rules here.
  // For example:
  // if (text.includes("SPECIFIC_FB_ARTIFACT_NOT_HANDLED_BY_WINDOWS1252")) {
  //   text = text.replace(/SPECIFIC_FB_ARTIFACT_NOT_HANDLED_BY_WINDOWS1252/g, 'CORRECT_VERSION');
  // }

  // EXAMPLE (only if absolutely necessary after testing with pure TextDecoder):
  // if (text.includes("Ã³")) { // If 'ó' is still "Ã³" AFTER windows-1252 (which shouldn't happen)
  //   text = text.replace(/Ã³/g, 'ó');
  // }

  return text; // For now return text unchanged
}

/**
 * Main function to call. Currently just passes text to (almost) empty fixEncodingIssues.
 */
export function fixTextEncoding(text: string): string {
  if (!text) return text;
  
  // console.log('[textEncoding.ts] fixTextEncoding called. Input sample:', text.substring(0, 60));
  const result = fixEncodingIssues(text);
  
  // if (result !== text) {
  //   console.log('[textEncoding.ts] fixTextEncoding made changes. Output sample:', result.substring(0, 60));
  // }
  
  return result;
}

/**
 * Checks if text contains Unicode replacement characters (�).
 * Useful for assessing whether UTF-8 decoding (without fatal:true) failed.
 */
export function hasEncodingIssues(text: string): boolean {
  if (!text) return false;
  
  if (text.includes('\uFFFD')) {
    console.warn('[textEncoding.ts] hasEncodingIssues: Found Unicode replacement character (U+FFFD). This indicates a probable decoding issue if fatal:false was used.');
    return true;
  }
  
  return false;
}
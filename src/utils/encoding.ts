/**
 * Facebook encoding fixes using proven mojibake repair techniques
 * 
 * This handles the common Facebook export issue where UTF-8 text was incorrectly
 * interpreted as windows-1252, creating mojibake that needs to be reversed.
 */

/**
 * Fixes Facebook's mojibake encoding issues using the proven escape/decodeURIComponent method
 * 
 * This works when:
 * 1. Original text was UTF-8 (Polish characters like "ż", "ł", "ą")
 * 2. UTF-8 bytes were incorrectly read as windows-1252 characters
 * 3. Those incorrect characters were stored in UTF-8 JSON files
 * 4. We need to reverse this double-encoding
 * 
 * Example: "ż" (UTF-8: 0xC5 0xBC) → read as windows-1252 → "Å¼" → stored in JSON
 * This function: "Å¼" → escape("Å¼") → "%C5%BC" → decodeURIComponent("%C5%BC") → "ż"
 * 
 * @param text - Text that may contain mojibake
 * @returns Corrected text with proper Polish characters
 */
export function fixEncoding(text: string): string {
  if (!text) return '';
  
  try {
    // Method 1: The proven escape/decodeURIComponent approach
    // This handles the classic "double encoding" mojibake
    const fixed = decodeURIComponent(escape(text));
    
    // Log only if something actually changed
    if (fixed !== text) {
      console.log('[encoding] Fixed mojibake:', { 
        original: text.substring(0, 100), 
        fixed: fixed.substring(0, 100) 
      });
    }
    
    return fixed;
  } catch (e) {
    console.error('[encoding] Primary fix failed:', e);
    
    // Method 2: Fallback approach (less likely to work for typical Facebook mojibake)
    try {
      const bytes = [];
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        bytes.push(code);
      }
      const fallbackFixed = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
      
      if (fallbackFixed !== text) {
        console.log('[encoding] Fallback fix applied:', { 
          original: text.substring(0, 100), 
          fixed: fallbackFixed.substring(0, 100) 
        });
      }
      
      return fallbackFixed;
    } catch (e2) {
      console.error('[encoding] Fallback fix also failed:', e2);
      return text;
    }
  }
}

/**
 * Reads a file and applies encoding fixes to the entire content before JSON parsing
 * This is the key difference from previous approaches - we fix the whole file content first
 * 
 * @param file - The File object to read
 * @returns Promise<string> - The content with encoding fixes applied
 */
export async function readFileWithProperEncoding(file: File): Promise<string> {
  console.log('[encoding] Reading file:', file.name);
  
  try {
    // Read file as UTF-8 (Facebook JSON files are UTF-8, but contain mojibake strings)
    const rawText = await file.text();
    console.log('[encoding] Raw text sample:', rawText.substring(0, 200));
    
    // Apply mojibake fix to the entire file content
    const fixedText = fixEncoding(rawText);
    console.log('[encoding] Fixed text sample:', fixedText.substring(0, 200));
    
    return fixedText;
  } catch (error) {
    console.error('[encoding] Failed to read and fix file:', error);
    // Fallback: return raw content without fixes
    return await file.text();
  }
}
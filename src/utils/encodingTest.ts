/**
 * Test utility for debugging encoding issues
 * Use this in browser console to test encoding fixes
 */

export function testEncodingFix() {
  console.log('=== ENCODING TEST (fbarch mojibake approach) ===');
  console.log('Testing decodeURIComponent(escape(text)) method...');

  // Test data that matches your examples
  const corruptedTexts = [
    'Masz takie wÅosy czerwone',
    'Ja mam brÄzowe siwe i dlugie',
    'KupiÅam sobie kiedyÅ',
  ];

  const expectedTexts = [
    'Masz takie włosy czerwone',
    'Ja mam brązowe siwe i dlugie',
    'Kupiłam sobie kiedyś',
  ];

  console.log('Testing synchronously...');

  corruptedTexts.forEach((corrupted, index) => {
    console.log(`\nOriginal: "${corrupted}"`);

    // Test the proven escape/decodeURIComponent method directly
    try {
      const fixed = decodeURIComponent(escape(corrupted));
      console.log(`Fixed:    "${fixed}"`);
      console.log(`Expected: "${expectedTexts[index]}"`);
      console.log(`Match:    ${fixed === expectedTexts[index]}`);

      // Show the intermediate step for education
      const escaped = escape(corrupted);
      console.log(`Escaped:  "${escaped}"`);
    } catch (error) {
      console.error(`Error fixing "${corrupted}":`, error);
    }
  });

  // Test the actual function from encoding.ts
  console.log('\nTesting with actual fixEncoding function...');
  import('./encoding').then(({ fixEncoding }) => {
    corruptedTexts.forEach((corrupted, index) => {
      const fixed = fixEncoding(corrupted);
      console.log(`fixEncoding("${corrupted}") = "${fixed}"`);
      console.log(`Match expected: ${fixed === expectedTexts[index]}`);
    });
  });
}

export function testTextDecoder() {
  console.log('=== TEXT DECODER TEST ===');

  // Test creating a corrupted string and then decoding it
  const testString = 'Masz takie włosy czerwone';

  // Encode as windows-1252 bytes
  const encoder = new TextEncoder(); // UTF-8 encoder
  const utf8Bytes = encoder.encode(testString);

  // Try decoding with different decoders
  console.log('Original:', testString);
  console.log('UTF-8 bytes:', Array.from(utf8Bytes));

  try {
    const windows1252Decoder = new TextDecoder('windows-1252');
    const decodedAsWindows1252 = windows1252Decoder.decode(utf8Bytes);
    console.log('Decoded as windows-1252:', decodedAsWindows1252);
  } catch (error) {
    console.error('Error decoding as windows-1252:', error);
  }
}

export function analyzeCorruptedText(text: string) {
  console.log('=== TEXT ANALYSIS ===');
  console.log('Text:', text);
  console.log('Length:', text.length);

  // Look for specific byte patterns
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);

    if (code > 127) {
      console.log(`Char at ${i}: "${char}" (code: ${code}, hex: 0x${code.toString(16)})`);
    }
  }

  // Test if it contains our patterns
  const patterns = ['wÅ', 'brÄ', 'KupiÅ', 'Å', 'Ä'];
  patterns.forEach((pattern) => {
    if (text.includes(pattern)) {
      console.log(`Contains pattern: "${pattern}"`);
    }
  });
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testEncodingFix = testEncodingFix;
  (window as any).testTextDecoder = testTextDecoder;
  (window as any).analyzeCorruptedText = analyzeCorruptedText;
}

import { describe, it, expect } from 'vitest';
import { fixTextEncoding, hasEncodingIssues, fixEncodingIssues } from '../utils/textEncoding';

describe('Text Encoding Utilities', () => {
  describe('hasEncodingIssues', () => {
    it('should detect encoding issues with Polish characters', () => {
      expect(hasEncodingIssues('tutaj chyba nic sie nie zmieniÅo')).toBe(true);
      expect(hasEncodingIssues('zapomniaÅem')).toBe(true);
      expect(hasEncodingIssues('wpadnÄ')).toBe(true);
      expect(hasEncodingIssues('Ã³')).toBe(true);
      expect(hasEncodingIssues('siÄ')).toBe(true);
    });

    it('should not detect issues with correct text', () => {
      expect(hasEncodingIssues('tutaj chyba nic sie nie zmienio')).toBe(false);
      expect(hasEncodingIssues('zapomniałem')).toBe(false);
      expect(hasEncodingIssues('normal text')).toBe(false);
      expect(hasEncodingIssues('ó')).toBe(false);
      expect(hasEncodingIssues('się')).toBe(false);
    });
  });

  describe('fixEncodingIssues', () => {
    it('should fix specific Polish word patterns', () => {
      expect(fixEncodingIssues('zmieniÅo')).toBe('zmieniło');
      expect(fixEncodingIssues('zapomniaÅem')).toBe('zapomniałem');
      expect(fixEncodingIssues('wpadnÄ')).toBe('wpadnę');
      expect(fixEncodingIssues('siÄ')).toBe('się');
      expect(fixEncodingIssues('juÅ¼')).toBe('już');
      expect(fixEncodingIssues('dziÄkujÄ')).toBe('dziękuję');
    });

    it('should fix general encoding patterns', () => {
      expect(fixEncodingIssues('Ã³')).toBe('ó');
      expect(fixEncodingIssues('Åo')).toBe('ło');
      expect(fixEncodingIssues('Åem')).toBe('łem');
      expect(fixEncodingIssues('Äć')).toBe('ąć');
    });

    it('should fix real-world examples', () => {
      const input = 'tutaj chyba nic sie nie zmieniÅo';
      const result = fixEncodingIssues(input);
      expect(result).toBe('tutaj chyba nic sie nie zmieniło');
    });

    it('should not modify correct text', () => {
      const correctText = 'This is normal text with ą ć ę ł ń ó ś ź ż';
      expect(fixEncodingIssues(correctText)).toBe(correctText);
    });
  });

  describe('fixTextEncoding', () => {
    it('should only apply fixes when encoding issues are detected', () => {
      const problematicText = 'zapomniaÅem';
      const normalText = 'zapomniałem';

      // Should fix problematic text
      expect(fixTextEncoding(problematicText)).toBe('zapomniałem');

      // Should not modify normal text
      expect(fixTextEncoding(normalText)).toBe(normalText);
    });

    it('should handle empty and null values', () => {
      expect(fixTextEncoding('')).toBe('');
      expect(fixTextEncoding(null as any)).toBe(null);
      expect(fixTextEncoding(undefined as any)).toBe(undefined);
    });
  });
}); 
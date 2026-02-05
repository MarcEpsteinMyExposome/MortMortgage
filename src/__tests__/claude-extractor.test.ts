/**
 * Tests for Claude Vision Extractor
 */

import { ClaudeVisionExtractor } from '../lib/ocr/claude-extractor';

describe('ClaudeVisionExtractor', () => {
  let extractor: ClaudeVisionExtractor;

  beforeEach(() => {
    extractor = new ClaudeVisionExtractor();
  });

  describe('initialization', () => {
    it('should have correct provider name', () => {
      expect(extractor.name).toBe('claude');
    });

    it('should check availability based on ANTHROPIC_API_KEY', () => {
      // Save original env
      const originalKey = process.env.ANTHROPIC_API_KEY;

      // Test without key
      delete process.env.ANTHROPIC_API_KEY;
      const extractorWithoutKey = new ClaudeVisionExtractor();
      expect(extractorWithoutKey.isAvailable()).toBe(false);

      // Test with key
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const extractorWithKey = new ClaudeVisionExtractor();
      expect(extractorWithKey.isAvailable()).toBe(true);

      // Restore original
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      } else {
        delete process.env.ANTHROPIC_API_KEY;
      }
    });
  });

  describe('extract', () => {
    it('should return error for unsupported MIME type', async () => {
      const buffer = Buffer.from('test');
      const result = await extractor.extract(buffer, 'text/plain', 'w2');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported MIME type');
    });

    it('should return error for PDF files', async () => {
      const buffer = Buffer.from('test');
      const result = await extractor.extract(buffer, 'application/pdf', 'w2');

      expect(result.success).toBe(false);
      expect(result.error).toContain('PDF files are not directly supported');
    });

    it('should return error when API key is not set', async () => {
      // Save original env
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const extractorNoKey = new ClaudeVisionExtractor();
      const buffer = Buffer.from('test');
      const result = await extractorNoKey.extract(buffer, 'image/png', 'w2');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ANTHROPIC_API_KEY');

      // Restore original
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });

    it('should normalize image/jpg to image/jpeg', async () => {
      // This test would require mocking the Anthropic client
      // For now, we just verify the error handling path
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const extractorNoKey = new ClaudeVisionExtractor();
      const buffer = Buffer.from('test');
      const result = await extractorNoKey.extract(buffer, 'image/jpg', 'w2');

      // Should fail due to missing API key, not MIME type
      expect(result.success).toBe(false);
      expect(result.error).toContain('ANTHROPIC_API_KEY');

      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });
  });

  describe('factory function', () => {
    it('should create extractor via factory function', async () => {
      const { createClaudeExtractor } = await import('../lib/ocr/claude-extractor');
      const created = createClaudeExtractor();
      expect(created).toBeInstanceOf(ClaudeVisionExtractor);
      expect(created.name).toBe('claude');
    });
  });
});

describe('OCR Orchestrator with Claude', () => {
  it('should export ClaudeVisionExtractor from index', async () => {
    const { ClaudeVisionExtractor: ExportedExtractor } = await import('../lib/ocr');
    expect(ExportedExtractor).toBeDefined();
    const extractor = new ExportedExtractor();
    expect(extractor.name).toBe('claude');
  });

  it('should list claude as available provider when API key is set', async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-key';

    // Need to re-import to pick up new env
    jest.resetModules();
    const { getAvailableProviders } = await import('../lib/ocr');
    const providers = getAvailableProviders();

    expect(providers).toContain('claude');

    if (originalKey) {
      process.env.ANTHROPIC_API_KEY = originalKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });
});

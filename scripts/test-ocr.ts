/**
 * Test OCR processing directly
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { extractDocument, SupportedDocumentType } from '../src/lib/ocr';

async function main() {
  console.log('=== OCR Test Script ===\n');

  const prisma = new PrismaClient();

  try {
    // Get the most recent document
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (documents.length === 0) {
      console.log('No documents found in database');
      return;
    }

    const document = documents[0];
    console.log('Testing document:');
    console.log('  ID:', document.id);
    console.log('  Filename:', document.filename);
    console.log('  Type:', document.documentType);
    console.log('  Path:', document.path);
    console.log('  Content-Type:', document.contentType);

    // Check file exists
    if (!fs.existsSync(document.path)) {
      console.log('\nERROR: File does not exist at path:', document.path);
      return;
    }

    // Read the file
    const fileBuffer = fs.readFileSync(document.path);
    console.log('\nFile loaded:', fileBuffer.length, 'bytes');

    // Process with OCR
    console.log('\nStarting OCR extraction...');
    const startTime = Date.now();

    const result = await extractDocument(
      fileBuffer,
      document.contentType,
      document.documentType as SupportedDocumentType
    );

    const duration = Date.now() - startTime;

    console.log('\n=== Results ===');
    console.log('Success:', result.success);
    console.log('Provider:', result.provider);
    console.log('Document Type:', result.documentType);
    console.log('Confidence:', result.overallConfidence);
    console.log('Processing Time:', duration, 'ms');

    if (result.error) {
      console.log('\nError:', result.error);
    }

    if (result.extraction) {
      console.log('\nExtraction:');
      console.log(JSON.stringify(result.extraction, null, 2));
    }

  } catch (error) {
    console.error('\nERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

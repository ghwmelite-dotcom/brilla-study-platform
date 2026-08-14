import { pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Ensure worker is set up
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

interface PDFExtractionResult {
  success: boolean;
  text: string;
  pageCount: number;
  error?: string;
  pageImages?: Array<{ pageNum: number; base64: string }>; // For scanned PDFs
  isScanned?: boolean;
}

/**
 * Render a PDF page to a base64 image for OCR processing
 */
async function renderPageToImage(
  pdf: pdfjs.PDFDocumentProxy,
  pageNum: number,
  scale: number = 1.5 // Higher scale = better OCR quality
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render page to canvas
  await page.render({
    canvasContext: context,
    viewport: viewport,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).promise;

  // Convert to base64 (JPEG for smaller size)
  const base64 = canvas.toDataURL('image/jpeg', 0.85);

  // Extract just the base64 data (remove data URL prefix)
  return base64.split(',')[1];
}

/**
 * Extract text content from a PDF file
 * If no text is found (scanned PDF), renders pages to images for OCR
 * @param file - The PDF file to extract text from
 * @param maxPages - Maximum number of pages to extract (default: 5 for scanned, 10 for text)
 * @param maxChars - Maximum characters to extract (default: 15000 to stay within context limits)
 */
export async function extractTextFromPDF(
  file: File,
  maxPages: number = 10,
  maxChars: number = 15000
): Promise<PDFExtractionResult> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const pagesToExtract = Math.min(totalPages, maxPages);

    let extractedText = '';
    let totalChars = 0;
    let hasTextContent = false;

    // First pass: Try to extract text
    for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
      if (totalChars >= maxChars) {
        extractedText += `\n\n[... Content truncated. Showing first ${pageNum - 1} of ${totalPages} pages due to length limits ...]`;
        break;
      }

      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items into readable text
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText && pageText.length > 20) {
        hasTextContent = true;
        extractedText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
        totalChars += pageText.length;
      }
    }

    // If we found sufficient text, return it
    if (hasTextContent && extractedText.trim().length > 100) {
      await pdf.destroy();
      const header = `[PDF Document: "${file.name}" - ${totalPages} page${totalPages > 1 ? 's' : ''}]\n`;
      return {
        success: true,
        text: header + extractedText.trim(),
        pageCount: totalPages,
        isScanned: false,
      };
    }

    // No text found - this is likely a scanned PDF
    // Render pages to images for OCR
    const maxScannedPages = Math.min(totalPages, 5); // Limit scanned pages to 5 for performance
    const pageImages: Array<{ pageNum: number; base64: string }> = [];

    for (let pageNum = 1; pageNum <= maxScannedPages; pageNum++) {
      try {
        const base64 = await renderPageToImage(pdf, pageNum);
        pageImages.push({ pageNum, base64 });
      } catch (err) {
        console.warn(`Failed to render page ${pageNum}:`, err);
      }
    }

    await pdf.destroy();

    if (pageImages.length === 0) {
      return {
        success: false,
        text: '',
        pageCount: totalPages,
        error: 'Could not extract text or render pages from this PDF.',
      };
    }

    // Return with page images for OCR processing
    const header = `[Scanned PDF Document: "${file.name}" - ${totalPages} page${totalPages > 1 ? 's' : ''}, ${pageImages.length} page${pageImages.length > 1 ? 's' : ''} sent for OCR]\n`;

    return {
      success: true,
      text: header,
      pageCount: totalPages,
      pageImages,
      isScanned: true,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Failed to extract text from PDF',
    };
  }
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

import { getPuppeteerLazy, type PuppeteerType } from '@/lib/dynamic-imports';
import { logger } from '@/lib/logger';
import { processMergeFields } from './documents';

export interface PDFGenerationOptions {
  content: string;
  mergeData?: Record<string, any>;
  filename?: string;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  headerFooter?: {
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
  };
}

export async function generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
  let browser: Awaited<ReturnType<PuppeteerType['launch']>> | null = null;
  
  try {
    // Dynamically import puppeteer
    const puppeteer = await getPuppeteerLazy();
    
    // Process merge fields if data provided
    let processedContent = options.content;
    if (options.mergeData) {
      processedContent = processMergeFields(options.content, options.mergeData);
    }
    
    // Create HTML document with styling
    const htmlContent = createStyledHTML(processedContent);
    
    // Launch puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for any assets to load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Generate PDF with options
    const pdf = await page.pdf({
      format: options.format || 'Letter',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in',
        ...options.margin
      },
      displayHeaderFooter: options.headerFooter?.displayHeaderFooter || false,
      headerTemplate: options.headerFooter?.headerTemplate || '',
      footerTemplate: options.headerFooter?.footerTemplate || `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      printBackground: true,
      preferCSSPageSize: false,
    });
    
    logger.info('PDF generated successfully', {
      filename: options.filename,
      contentLength: processedContent.length,
      pdfSize: pdf.length
    });
    
    return pdf;
    
  } catch (error) {
    logger.error('Failed to generate PDF', { 
      error: error?.message || error,
      filename: options.filename 
    });
    throw new Error(`PDF generation failed: ${error?.message || error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function createStyledHTML(content: string): string {
  // Convert markdown-style formatting to HTML
  let htmlContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
    
  // Wrap in paragraphs
  if (!htmlContent.startsWith('<p>')) {
    htmlContent = '<p>' + htmlContent + '</p>';
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0;
            background: white;
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-family: Arial, sans-serif;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #2c3e50;
        }
        
        h1 {
            font-size: 18pt;
            text-align: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5em;
            margin-bottom: 1em;
        }
        
        h2 {
            font-size: 16pt;
            color: #34495e;
        }
        
        h3 {
            font-size: 14pt;
            color: #34495e;
        }
        
        p {
            margin-bottom: 1em;
            text-align: justify;
        }
        
        strong {
            font-weight: bold;
            color: #2c3e50;
        }
        
        em {
            font-style: italic;
            color: #7f8c8d;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            display: inline-block;
            min-width: 200px;
            margin: 0 10px;
        }
        
        .checkbox {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1px solid #333;
            margin-right: 8px;
            vertical-align: top;
            margin-top: 2px;
        }
        
        .form-field {
            border-bottom: 1px solid #333;
            display: inline-block;
            min-width: 150px;
            margin: 0 5px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
        }
        
        table, th, td {
            border: 1px solid #ddd;
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .header-info {
            background-color: #f8f9fa;
            padding: 15px;
            border: 1px solid #ddd;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        
        .footer-info {
            background-color: #f8f9fa;
            padding: 15px;
            border: 1px solid #ddd;
            margin-top: 20px;
            border-radius: 5px;
            font-size: 10pt;
            text-align: center;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
        
        /* Convert checkbox symbols */
        .checkbox-checked::before {
            content: "☑";
            font-size: 14px;
        }
        
        .checkbox-unchecked::before {
            content: "☐";
            font-size: 14px;
        }
    </style>
</head>
<body>
    ${htmlContent}
    
    <div class="footer-info">
        Generated by Rivor CRM on ${new Date().toLocaleDateString()}
    </div>
</body>
</html>`;
}

// Convert common form elements
export function preprocessDocumentContent(content: string): string {
  return content
    // Convert checkbox symbols
    .replace(/☐/g, '<span class="checkbox-unchecked"></span>')
    .replace(/☑/g, '<span class="checkbox-checked"></span>')
    .replace(/\[x\]/gi, '<span class="checkbox-checked"></span>')
    .replace(/\[ \]/g, '<span class="checkbox-unchecked"></span>')
    
    // Convert signature lines
    .replace(/_{10,}/g, '<span class="signature-line"></span>')
    
    // Convert form fields
    .replace(/\[([^\]]+)\]/g, '<span class="form-field">$1</span>')
    
    // Convert headers
    .replace(/^([A-Z][A-Z\s:]+)$/gm, '<h1>$1</h1>')
    .replace(/^([A-Z][A-Za-z\s:]+):$/gm, '<h2>$1</h2>')
    
    // Page breaks
    .replace(/\[PAGE BREAK\]/gi, '<div class="page-break"></div>');
}

// Utility function to save PDF to storage (implement based on your storage solution)
export async function savePDFToStorage(pdfBuffer: Buffer, filename: string): Promise<string> {
  // This would typically save to S3, Google Cloud Storage, or local file system
  // For now, return a placeholder URL
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `/documents/pdfs/${timestamp}_${safeFilename}`;
  
  // TODO: Implement actual file storage
  logger.info('PDF saved to storage', { 
    filename: safeFilename, 
    path: storagePath,
    size: pdfBuffer.length 
  });
  
  return storagePath;
}
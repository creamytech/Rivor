import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { logger } from "@/lib/logger";
import { generatePDF, preprocessDocumentContent, savePDFToStorage } from "@/server/pdf-generator";
import { getMergeData } from "@/server/documents";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.content || !data.name) {
      return NextResponse.json(
        { error: "Content and name are required" },
        { status: 400 }
      );
    }

    // Get merge data if deal or contact IDs are provided
    let mergeData = {};
    if (data.dealId || data.contactId) {
      try {
        mergeData = await getMergeData(data.dealId, data.contactId);
      } catch (error) {
        logger.warn('Failed to fetch merge data for PDF generation', { 
          error, 
          dealId: data.dealId, 
          contactId: data.contactId 
        });
        // Continue with empty merge data
      }
    }

    // Add current user info to merge data
    mergeData = {
      ...mergeData,
      agent: {
        name: session.user?.name || '',
        email: session.user?.email || '',
      },
      date: new Date(),
      time: new Date(),
    };

    // Preprocess content to handle form elements
    const processedContent = preprocessDocumentContent(data.content);

    // Generate PDF
    const pdfBuffer = await generatePDF({
      content: processedContent,
      mergeData,
      filename: data.name,
      format: data.format || 'Letter',
      margin: data.margin,
      headerFooter: {
        displayHeaderFooter: true,
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666; margin-top: 10px;">
            <div style="margin: 0 auto;">
              ${data.name} • Generated on ${new Date().toLocaleDateString()} • Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>
          </div>
        `
      }
    });

    // Save PDF to storage (if needed for future reference)
    let pdfUrl = null;
    if (data.saveToStorage) {
      try {
        pdfUrl = await savePDFToStorage(pdfBuffer, `${data.name}.pdf`);
        
        // Update document record with PDF URL if documentId provided
        if (data.documentId) {
          // This would update the document record with the PDF URL
          // Implementation depends on your database structure
        }
      } catch (error) {
        logger.warn('Failed to save PDF to storage', { error, filename: data.name });
        // Continue without saving - user can still download
      }
    }

    logger.info('PDF generated successfully', {
      userId: session.user?.email,
      filename: data.name,
      contentLength: data.content.length,
      pdfSize: pdfBuffer.length,
      mergeFields: Object.keys(mergeData),
      dealId: data.dealId,
      contactId: data.contactId,
      saved: !!pdfUrl
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${data.name}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        ...(pdfUrl ? { 'X-PDF-URL': pdfUrl } : {})
      }
    });

  } catch (error) {
    logger.error('Failed to generate PDF', { error });
    
    // Return detailed error for debugging
    const errorMessage = error?.message || 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: "Failed to generate PDF",
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve stored PDFs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const pdfUrl = searchParams.get('url');

    if (!documentId && !pdfUrl) {
      return NextResponse.json(
        { error: "Document ID or PDF URL is required" },
        { status: 400 }
      );
    }

    // TODO: Implement PDF retrieval from storage
    // This would fetch the PDF from your storage solution (S3, etc.)
    // and return it as a response

    logger.info('PDF retrieval requested', {
      userId: session.user?.email,
      documentId,
      pdfUrl
    });

    return NextResponse.json(
      { error: "PDF retrieval not yet implemented" },
      { status: 501 }
    );

  } catch (error) {
    logger.error('Failed to retrieve PDF', { error });
    return NextResponse.json(
      { error: "Failed to retrieve PDF" },
      { status: 500 }
    );
  }
}
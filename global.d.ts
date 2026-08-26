// Type declarations for JavaScript-only dependencies without bundled types.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages?: number;
    numrender?: number;
    info?: unknown;
    metadata?: unknown;
  }
  const pdfParse: (data: Buffer) => Promise<PdfParseResult>;
  export default pdfParse;
}

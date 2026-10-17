// One pdf.js set-up for the whole app: the worker comes from the installed
// pdfjs-dist (same version react-pdf uses), not from a CDN.
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export { pdfjs };

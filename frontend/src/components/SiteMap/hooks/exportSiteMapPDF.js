// src/components/SiteMap/hooks/exportSiteMapPDF.js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportToPDF = async (elementRef, siteMap, customer, styles) => {
  if (!elementRef?.current) {
    console.warn("Element ref is not available");
    return;
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  const pages = elementRef.current.querySelectorAll(".quotation-page-print");
  if (pages.length === 0) {
    console.warn("No .quotation-page elements found");
    return;
  }

  // Hide all pages initially
  pages.forEach((p) => (p.style.display = "none"));

  try {
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i];

      // Show current page only
      pageElement.style.display = "block";

      // Force reflow – tell ESLint we intentionally don't use the value
      void pageElement.offsetHeight;

      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let positionY = 0;

      // Add first page of this quotation page
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, positionY, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      // Split very tall pages across multiple PDF pages
      while (heightLeft > 0) {
        pdf.addPage();
        positionY -= pageHeight;
        pdf.addImage(imgData, "PNG", 0, positionY, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Hide again after capture
      pageElement.style.display = "none";
    }
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF. Please try again.");
    return;
  } finally {
    // Always restore visibility
    pages.forEach((p) => (p.style.display = "block"));
  }

  // Clean filename
  const customerName = (customer?.name || "Customer").replace(
    /[^a-zA-Z0-9]/g,
    "_"
  );
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fileName = `Quotation_${customerName}_${dateStr}.pdf`;

  pdf.save(fileName);
};

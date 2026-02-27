// src/components/SiteMap/hooks/exportSiteMapPDF.js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportToPDF = async (elementRef, siteMap) => {
  if (!elementRef?.current) {
    return;
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pages = elementRef.current.querySelectorAll(".quotation-page-print");

  if (pages.length === 0) {
    return;
  }

  // Optional: Show a loading state
  const originalDisplays = Array.from(pages).map((p) => p.style.display);
  pages.forEach((p) => (p.style.display = "none"));

  try {
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i];
      pageElement.style.display = "block";

      // Force layout recalculation
      void pageElement.offsetHeight;

      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 30000,
        removeContainer: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pdf.internal.pageSize.getWidth(); // 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add new page except for the first one
      if (i > 0) pdf.addPage();

      // Add image fitted to A4 width, preserve aspect ratio
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Hide again
      pageElement.style.display = "none";
    }

    // Generate filename
    const siteName = (siteMap?.project_name || "SiteMap").replace(
      /[^a-zA-Z0-9]/g,
      "_",
    );
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `SiteMap_${siteName}_${dateStr}.pdf`;

    pdf.save(fileName);
  } catch (error) {
    alert("Failed to generate PDF. Check images (CORS) or try again.");
  } finally {
    // Always restore visibility
    pages.forEach(
      (p, idx) => (p.style.display = originalDisplays[idx] || "block"),
    );
  }
};

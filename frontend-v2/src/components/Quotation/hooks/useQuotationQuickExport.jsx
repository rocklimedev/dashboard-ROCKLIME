// src/components/Quotation/hooks/useQuotationQuickExport.js
import { useState, useRef } from "react";
import { message } from "antd";
import { createRoot } from "react-dom/client";

import { exportToPDF, exportToExcel, getSafeTitle } from "./exportHelpers";
import { QuotationPagesRenderer } from "../QuotationPagesRenderer";

export const useQuotationQuickExport = () => {
  const [exportingId, setExportingId] = useState(null);
  const hiddenContainerRef = useRef(null);

  // ────────────────────────────────────────────────
  //  Wait for all images in a container to load or fail
  // ────────────────────────────────────────────────
  const waitForImagesToLoad = (container) => {
    return new Promise((resolve) => {
      const images = [...container.querySelectorAll("img")];
      if (images.length === 0) return resolve();

      let settledCount = 0;
      const total = images.length;

      const onSettle = () => {
        settledCount++;
        if (settledCount >= total) resolve();
      };

      images.forEach((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          settledCount++;
        } else {
          img.onload = onSettle;
          img.onerror = onSettle;

          // Force reload attempt (helps with some caching/CORS weirdness)
          const originalSrc = img.src;
          img.src = "";
          setTimeout(() => {
            img.src = originalSrc;
          }, 50);
        }
      });

      // ── HARD TIMEOUT ── (very important!)
      setTimeout(() => {
        if (settledCount < total) {
          console.warn(
            `[waitForImages] Timeout after 12s — ${total - settledCount} images didn't settle`,
          );
        }
        resolve();
      }, 12000);
    });
  };

  // ────────────────────────────────────────────────
  //  Main export function
  // ────────────────────────────────────────────────
  const exportQuotation = async ({
    quotation,
    customerName = "Dear Client",
    customerPhone = "—",
    customerAddress = "—",
    brandNames = "GROHE / AMERICAN STANDARD",
    mainProducts = [],
    optionalProducts = [],
    displaySubtotal = 0,
    displayProductDiscount = 0,
    backendExtraDiscount = 0,
    backendFinalAmount = 0,
    backendRoundOff = 0,
    finalAmountInWords = "",
    format = "pdf", // "pdf" | "excel"
  }) => {
    if (!quotation?.quotationId) {
      message.error("Invalid quotation data");
      return;
    }

    const id = quotation.quotationId;
    if (exportingId === id) return;

    setExportingId(id);

    let root = null;
    let printArea = null; // ← moved declaration here
    let timeoutId = null;

    try {
      // Safety timeout: force stop after 45 seconds
      timeoutId = setTimeout(() => {
        message.warning("Export is taking too long — cancelled");
        cleanup();
      }, 45000);

      // 1. Clear previous content
      if (hiddenContainerRef.current) {
        hiddenContainerRef.current.innerHTML = "";
      }

      // 2. Create real DOM container for rendering
      printArea = document.createElement("div");
      printArea.style.width = "210mm";
      printArea.style.position = "absolute";
      printArea.style.left = "-9999px";
      printArea.style.top = "-9999px";
      printArea.style.background = "white";

      // 3. Mount React renderer
      root = createRoot(printArea);
      root.render(
        <div style={{ width: "210mm", background: "white" }}>
          {QuotationPagesRenderer({
            quotation,
            mainProducts,
            optionalProducts,
            customerName,
            customerPhone,
            customerAddress,
            displaySubtotal,
            displayProductDiscount,
            backendExtraDiscount,
            backendFinalAmount,
            backendRoundOff,
            finalAmountInWords,
            getShouldShowColumn: () => true,
          })}
        </div>,
      );

      // 4. Wait for render + images
      await new Promise((r) => setTimeout(r, 800));
      await waitForImagesToLoad(printArea);

      // 5. Append to hidden ref
      if (hiddenContainerRef.current) {
        hiddenContainerRef.current.appendChild(printArea);
      }

      // 6. Extra time for layout / canvas preparation
      await new Promise((r) => setTimeout(r, 1200));

      // 7. Prepare filename
      const safeTitle = getSafeTitle(quotation);
      const ref = quotation.reference_number || id;
      const filename = `${safeTitle}_${ref}_v1.${format === "pdf" ? "pdf" : "xlsx"}`;

      // 8. Export logic...
      const pages = printArea.querySelectorAll(".page");

      if (format === "pdf") {
        await exportToPDF(
          { current: printArea },
          id,
          "current",
          quotation,
          filename,
        );

        // If you want page-by-page later, uncomment and adjust here
      } else {
        await exportToExcel(
          mainProducts,
          [],
          brandNames,
          customerName,
          quotation,
          customerAddress,
          null, // logo
          {
            bankName: "IDFC FIRST BANK",
            accountNumber: "10179373657",
            ifscCode: "IDFB0020149",
            branch: "BHERA ENCLAVE PASCHIM VIHAR",
          },
          id,
          "current",
          optionalProducts,
          filename,
        );
      }

      message.success(`${format.toUpperCase()} exported successfully`);
    } catch (err) {
      message.error(`Export failed: ${err.message || "Unknown error"}`);
    } finally {
      clearTimeout(timeoutId);
      cleanup();
    }

    // Now cleanup can access printArea and root
    function cleanup() {
      if (root) {
        try {
          root.unmount();
        } catch (e) {
          console.warn("Unmount failed", e);
        }
      }
      if (printArea && printArea.parentNode) {
        printArea.parentNode.removeChild(printArea);
      }
      setExportingId(null);
    }
  };

  return {
    exportingId,
    hiddenContainerRef,
    exportQuotation,
  };
};

const handleExport = async () => {
  try {
    if (!id) {
      toast.error("Quotation ID is missing.");
      return;
    }
    setIsExporting(true);

    if (exportFormat === "pdf") {
      if (!quotationRef.current) {
        toast.error("Quotation content not found.");
        return;
      }

      // Preload images
      const preloadImages = async () => {
        const images = document.querySelectorAll(".quotation-container img");
        const loadPromises = Array.from(images).map((img) => {
          return new Promise((resolve, reject) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => {
                console.error(`Failed to load image: ${img.src}`);
                resolve();
              };
            }
          });
        });
        await Promise.all(loadPromises);
      };
      await preloadImages();

      const canvas = await html2canvas(quotationRef.current, {
        scale: 2,
        useCORS: true,
        logging: true,
        allowTaint: false,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - 20;
      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + 10;
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`Quotation_${id}.pdf`);
      toast.success("Quotation exported successfully as PDF!");
    } else if (exportFormat === "excel") {
      if (!products || products.length === 0) {
        toast.error("No products available to export.");
        return;
      }

      const exportRows = products.map((product, index) => {
        const productDetail =
          productsData?.find((p) => p.productId === product.productId) || {};
        let imageUrl = null;
        try {
          if (productDetail?.images) {
            const imgs = JSON.parse(productDetail.images);
            imageUrl = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
          }
        } catch (error) {
          console.error(
            `Failed to parse images for product ${product.productId}: ${error.message}`
          );
        }

        const productCode =
          productDetail?.product_code ||
          productDetail?.meta?.d11da9f9_3f2e_4536_8236_9671200cca4a ||
          "N/A";
        const sellingPrice =
          productDetail?.metaDetails?.find((m) => m.title === "sellingPrice")
            ?.value ||
          product.sellingPrice ||
          0;

        return {
          index: index + 1,
          imageUrl,
          name: product.name || productDetail?.name || "N/A",
          code: productCode,
          mrp: sellingPrice ? `₹${Number(sellingPrice).toFixed(2)}` : "N/A",
          discount: product.discount
            ? product.discountType === "percent"
              ? `${product.discount}%`
              : `₹${Number(product.discount).toFixed(2)}`
            : "N/A",
          rate: product.rate
            ? `₹${Number(product.rate).toFixed(2)}`
            : sellingPrice
            ? `₹${Number(sellingPrice).toFixed(2)}`
            : "N/A",
          qty: product.qty || product.quantity || "N/A",
          total: product.total ? `₹${Number(product.total).toFixed(2)}` : "N/A",
        };
      });

      let logoImage = placeholderImage;
      try {
        if (logo.startsWith("data:image/")) {
          const matches = logo.match(
            /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,(.+)$/
          );
          if (matches) {
            const extension = matches[1];
            const buffer = Buffer.from(matches[2], "base64");
            if (buffer && buffer.length > 0) {
              logoImage = { buffer, extension };
              console.log(
                `Logo loaded from base64, Size: ${buffer.length} bytes`
              );
            }
          }
        } else {
          const response = await fetch(logo, {
            mode: "cors",
            credentials: "omit",
            headers: { Accept: "image/*" },
          });
          if (!response.ok)
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.startsWith("image/")) {
            throw new Error(`Unsupported content type: ${contentType}`);
          }
          const extension = contentType.split("/")[1].toLowerCase();
          const buffer = Buffer.from(await response.arrayBuffer());
          if (buffer && buffer.length > 0) {
            logoImage = { buffer, extension };
            console.log(`Logo fetched from URL, Size: ${buffer.length} bytes`);
          }
        }
      } catch (error) {
        console.error(`Error processing logo: ${error.message}`);
        toast.warning("Using placeholder logo due to error in loading logo.");
      }

      const imagePromises = [
        Promise.resolve(logoImage),
        ...exportRows.map((row) =>
          row.imageUrl
            ? fetchImageAsBuffer(row.imageUrl).then((result) => {
                console.log(`Image ${row.imageUrl.slice(0, 50)}...:`, {
                  bufferLength: result.buffer.length,
                  extension: result.extension,
                });
                return result;
              })
            : Promise.resolve(placeholderImage)
        ),
      ];
      const images = await Promise.all(imagePromises);
      const logoImageFinal = images[0];
      const productImages = images.slice(1);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Quotation");

      worksheet.columns = [
        { width: 10 },
        { width: 20 },
        { width: 30 },
        { width: 15 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 10 },
        { width: 12 },
      ];

      try {
        const logoId = workbook.addImage({
          buffer: logoImageFinal.buffer,
          extension: logoImageFinal.extension,
        });
        worksheet.addImage(logoId, {
          tl: { col: 0, row: 0 },
          ext: { width: 100, height: 50 },
          editAs: "oneCell",
        });
        worksheet.getRow(1).height = 60;
        console.log("Logo added successfully to Excel");
      } catch (error) {
        console.error(`Error adding logo to Excel: ${error.message}`);
        toast.warning("Failed to add logo to Excel file, using placeholder.");
        const logoId = workbook.addImage({
          buffer: placeholderImage.buffer,
          extension: placeholderImage.extension,
        });
        worksheet.addImage(logoId, {
          tl: { col: 0, row: 0 },
          ext: { width: 100, height: 50 },
          editAs: "oneCell",
        });
        worksheet.getRow(1).height = 60;
      }

      // ... (rest of the Excel export logic remains unchanged)
      // Rest of the worksheet setup (unchanged)
      worksheet.mergeCells("B1:D1");
      worksheet.getCell("B1").value = "Estimate / Quotation";
      worksheet.getCell("B1").font = { bold: true, size: 16 };
      worksheet.getCell("B1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells("E1:I1");
      worksheet.getCell("E1").value = brandNames;
      worksheet.getCell("E1").font = { bold: true, size: 12 };
      worksheet.getCell("E1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.mergeCells("A3:A4");
      worksheet.getCell("A3").value = "M/s";
      worksheet.getCell("A3").font = { bold: true };
      worksheet.getCell("A3").alignment = { vertical: "middle" };
      worksheet.mergeCells("B3:E4");
      worksheet.getCell("B3").value = getCustomerName(quotation.customerId);
      worksheet.getCell("B3").alignment = { vertical: "middle" };
      worksheet.mergeCells("F3:F4");
      worksheet.getCell("F3").value = "Date";
      worksheet.getCell("F3").font = { bold: true };
      worksheet.getCell("F3").alignment = { vertical: "middle" };
      worksheet.mergeCells("G3:I4");
      worksheet.getCell("G3").value = quotation.quotation_date
        ? new Date(quotation.quotation_date).toLocaleDateString()
        : new Date().toLocaleDateString();
      worksheet.getCell("G3").alignment = { vertical: "middle" };

      worksheet.mergeCells("A5:A6");
      worksheet.getCell("A5").value = "Address";
      worksheet.getCell("A5").font = { bold: true };
      worksheet.getCell("A5").alignment = { vertical: "middle" };
      worksheet.mergeCells("B5:I6");
      worksheet.getCell("B5").value = addressData
        ? `${addressData.street || ""}, ${addressData.city || ""}, ${
            addressData.state || ""
          }, ${addressData.postalCode || ""}, ${addressData.country || ""}`
        : quotation.shipTo || "456, Park Avenue, New York, USA";
      worksheet.getCell("B5").alignment = { vertical: "middle" };

      const headerRow1 = worksheet.addRow([
        "S.No",
        "Product Image",
        "Product Name",
        "Product Code",
        "Amount",
        "",
        "",
        "",
        "",
      ]);
      headerRow1.font = { bold: true };
      headerRow1.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.mergeCells(`E${headerRow1.number}:I${headerRow1.number}`);
      headerRow1.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      const headerRow2 = worksheet.addRow([
        "",
        "",
        "",
        "",
        "MRP",
        "Discount",
        "Rate",
        "Unit",
        "Total",
      ]);
      headerRow2.font = { bold: true };
      headerRow2.alignment = { vertical: "middle", horizontal: "center" };
      headerRow2.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      let currentRow = headerRow2.number + 1;
      exportRows.forEach((row, index) => {
        const excelRow = worksheet.addRow([
          row.index,
          "",
          row.name,
          row.code,
          row.mrp,
          row.discount,
          row.rate,
          row.qty,
          row.total,
        ]);
        excelRow.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        if (productImages[index].buffer) {
          try {
            const imageId = workbook.addImage({
              buffer: productImages[index].buffer,
              extension: productImages[index].extension,
            });
            worksheet.addImage(imageId, {
              tl: { col: 1, row: currentRow - 1 },
              ext: { width: 50, height: 50 },
              editAs: "oneCell",
            });
            worksheet.getRow(currentRow).height = 50;
          } catch (error) {
            console.error(
              `Error adding image for product ${row.name}: ${error.message}`
            );
          }
        }

        currentRow++;
      });

      const subtotal = products.reduce(
        (sum, product) => sum + Number(product.total || 0),
        0
      );
      const gstAmount =
        quotation.include_gst && quotation.gst_value
          ? (subtotal * Number(quotation.gst_value)) / 100
          : 0;
      const finalTotal = subtotal + gstAmount;

      const subtotalRow = worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Sub Total",
        `₹${subtotal.toFixed(2)}`,
      ]);
      subtotalRow.eachCell((cell, colNumber) => {
        if (colNumber > 7) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
      });

      if (quotation.include_gst && quotation.gst_value) {
        const gstRow = worksheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          `GST (${quotation.gst_value}%)`,
          `₹${gstAmount.toFixed(2)}`,
        ]);
        gstRow.eachCell((cell, colNumber) => {
          if (colNumber > 7) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });
      }

      const totalRow = worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Total",
        `₹${finalTotal.toFixed(2)}`,
      ]);
      totalRow.font = { bold: true };
      totalRow.eachCell((cell, colNumber) => {
        if (colNumber > 7) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation_${id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Quotation exported successfully as Excel!");
    } else if (exportFormat === "pdf") {
      // PDF export logic remains unchanged
      if (!quotationRef.current) {
        toast.error("Quotation content not found.");
        return;
      }

      const canvas = await html2canvas(quotationRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - 20;
      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + 10;
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`Quotation_${id}.pdf`);

      toast.success("Quotation exported successfully as PDF!");
    }
  } catch (error) {
    toast.error(
      `Failed to export quotation as ${exportFormat.toUpperCase()}: ${
        error.message
      }`
    );
    console.error("Export error:", error);
  } finally {
    setIsExporting(false);
  }
};

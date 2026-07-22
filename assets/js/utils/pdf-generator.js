/**
 * Eva Dou - Official PDF Invoice Generator
 * Generates luxury PDF invoices with brand logo, itemized breakdown, and customer details.
 */

/**
 * Formats order date string
 */
function getFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Renders HTML string for luxury PDF invoice
 */
function createInvoiceHTML(customerData, cartItems, subtotal, orderId, orderDate) {
  const dateStr = orderDate || getFormattedDate();

  const itemsRowsHTML = cartItems.map((item, index) => `
    <tr style="border-bottom: 1px solid #EEEEEE;">
      <td style="padding: 10px; text-align: center; color: #666; font-size: 12px;">${index + 1}</td>
      <td style="padding: 10px; color: #1E1A17; font-weight: 600; font-size: 13px;">${item.name}</td>
      <td style="padding: 10px; text-align: center; color: #666; font-size: 12px;">${item.size || '250 Ml'}</td>
      <td style="padding: 10px; text-align: right; color: #1E1A17; font-size: 12px;">${item.price} EGP</td>
      <td style="padding: 10px; text-align: center; color: #1E1A17; font-weight: 600; font-size: 12px;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right; color: #C59B6A; font-weight: 700; font-size: 13px;">${(item.price * item.quantity).toLocaleString()} EGP</td>
    </tr>
  `).join('');

  return `
    <div id="eva-pdf-template" style="
      width: 700px;
      padding: 40px;
      background-color: #FFFFFF;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1E1A17;
      box-sizing: border-box;
    ">
      
      <!-- Invoice Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr>
          <td style="vertical-align: top; width: 60%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="assets/images/logo.png" alt="Eva Dou Logo" style="height: 55px; width: auto; object-fit: contain;" onerror="this.style.display='none'">
              <div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1E1A17; letter-spacing: 2px; text-transform: uppercase;">EVA DOU</h1>
                <p style="margin: 2px 0 0 0; font-size: 10px; letter-spacing: 3px; color: #C59B6A; text-transform: uppercase;">Parfums & Cosmétiques</p>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 11px; font-style: italic; color: #888888; line-height: 1.4;">
              "Not just a fragrance… it’s a story of femininity called Eva Dou"
            </p>
          </td>
          <td style="vertical-align: top; text-align: right; width: 40%;">
            <div style="background-color: #FAF6F0; border: 1px solid #EADCD0; border-radius: 8px; padding: 12px 16px; display: inline-block; text-align: right;">
              <span style="font-size: 10px; font-weight: 700; color: #C59B6A; letter-spacing: 1px; text-transform: uppercase;">OFFICIAL INVOICE</span>
              <h2 style="margin: 4px 0 2px 0; font-size: 18px; color: #1E1A17;">${orderId}</h2>
              <p style="margin: 0; font-size: 11px; color: #666666;">Date: ${dateStr}</p>
            </div>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <hr style="border: none; border-top: 2px solid #C59B6A; margin-bottom: 25px;">

      <!-- Customer Details Box -->
      <div style="background-color: #FAF8F5; border-radius: 6px; padding: 18px 22px; margin-bottom: 30px; border-left: 4px solid #C59B6A;">
        <h3 style="margin: 0 0 12px 0; font-size: 12px; letter-spacing: 1px; color: #C59B6A; text-transform: uppercase;">Delivery & Customer Information</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; width: 140px; color: #777777;">Customer Name:</td>
            <td style="padding: 4px 0; font-weight: 700; color: #1E1A17;">${customerData.name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #777777;">Phone Number:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #1E1A17;">${customerData.phone}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #777777;">City / Governorate:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #1E1A17;">${customerData.city}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #777777; vertical-align: top;">Detailed Address:</td>
            <td style="padding: 4px 0; color: #1E1A17; line-height: 1.4;">${customerData.address}</td>
          </tr>
        </table>
      </div>

      <!-- Itemized Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #1E1A17; color: #FFFFFF; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
            <th style="padding: 10px; text-align: center; border-radius: 4px 0 0 4px;">#</th>
            <th style="padding: 10px; text-align: left;">Item Description</th>
            <th style="padding: 10px; text-align: center;">Size</th>
            <th style="padding: 10px; text-align: right;">Unit Price</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right; border-radius: 0 4px 4px 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHTML}
        </tbody>
      </table>

      <!-- Totals & Payment Summary -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <tr>
          <td style="vertical-align: top; width: 55%; padding-right: 20px;">
            <div style="background-color: #F8F9FA; padding: 14px; border-radius: 6px; border: 1px solid #EEEEEE;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #1E1A17; text-transform: uppercase;">Payment Terms</p>
              <p style="margin: 0; font-size: 11px; color: #666666; line-height: 1.5;">
                Payment Method: Cash on Delivery or Mobile Wallet.<br>
                Shipping Fee: Calculated & confirmed by customer support.
              </p>
            </div>
          </td>
          <td style="vertical-align: top; width: 45%;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #666666;">Subtotal:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1E1A17;">${subtotal.toLocaleString()} EGP</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666666;">Shipping Fee:</td>
                <td style="padding: 6px 0; text-align: right; color: #888888; font-style: italic; font-size: 11px;">Upon confirmation</td>
              </tr>
              <tr style="border-top: 2px solid #C59B6A; border-bottom: 2px solid #C59B6A;">
                <td style="padding: 10px 0; font-weight: 700; font-size: 15px; color: #1E1A17;">TOTAL DUE:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; font-size: 17px; color: #C59B6A;">${subtotal.toLocaleString()} EGP</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <div style="border-top: 1px solid #EEEEEE; padding-top: 20px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #1E1A17;">Thank you for choosing Eva Dou.</p>
        <p style="margin: 0; font-size: 10px; color: #AAAAAA;">Developed by ATZ Studio</p>
      </div>

    </div>
  `;
}

/**
 * Downloads invoice PDF using html2pdf.js
 */
function downloadInvoicePDF(customerData, cartItems, subtotal, orderId) {
  return new Promise((resolve, reject) => {
    const orderDate = getFormattedDate();
    const htmlString = createInvoiceHTML(customerData, cartItems, subtotal, orderId, orderDate);

    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.innerHTML = htmlString;
    document.body.appendChild(container);

    const element = container.firstElementChild;
    const cleanId = orderId.replace('#', '');
    const filename = `Eva_Dou_Invoice_${cleanId}.pdf`;

    const opt = {
      margin:       [0.2, 0.2, 0.2, 0.2],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    if (typeof window.html2pdf !== 'undefined') {
      window.html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(container);
        resolve(filename);
      }).catch(err => {
        document.body.removeChild(container);
        reject(err);
      });
    } else {
      // Fallback print/view if html2pdf library is loading or blocked
      console.warn('html2pdf.js library not detected. Triggering print fallback.');
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`<html><head><title>${filename}</title></head><body>${htmlString}</body></html>`);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => printWin.print(), 500);
      }
      document.body.removeChild(container);
      resolve(filename);
    }
  });
}

// Global Exports
if (typeof window !== 'undefined') {
  window.createInvoiceHTML = createInvoiceHTML;
  window.downloadInvoicePDF = downloadInvoicePDF;
}

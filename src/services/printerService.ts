// Thermal Printer & ESC/POS Ticket Service (58mm / 80mm)
import { Reservation, Rental, Unit, Category } from '../types';

export interface PrintTicketOptions {
  type: 'RESERVA' | 'ALQUILER';
  unitCode: string;
  unitName: string;
  categoryName: string;
  customerName: string;
  customerPhone?: string;
  durationMinutes: number;
  expectedTime: string;
  docLocker: string;
  docType: string;
  totalPrice: number;
  paymentMethod: string;
  ticketId: string;
  createdAt: string;
}

export function printThermalTicket(opts: PrintTicketOptions) {
  // Create an isolated printable iframe for silent or standard POS thermal printer dialog
  const printWindow = window.open('', '_blank', 'width=350,height=500');
  if (!printWindow) {
    // Fallback: create invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(getTicketHtml(opts));
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 300);
    }
    return;
  }

  printWindow.document.open();
  printWindow.document.write(getTicketHtml(opts));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
}

function getTicketHtml(opts: PrintTicketOptions): string {
  const isReserva = opts.type === 'RESERVA';
  const nowStr = new Date(opts.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket ${opts.type} - ${opts.unitCode}</title>
  <style>
    @page {
      margin: 0;
      size: 58mm auto; /* Formato estándar comandera 58mm */
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.25;
      color: #000;
      background: #fff;
      width: 58mm;
      max-width: 58mm;
      margin: 0 auto;
      padding: 6px 4px;
      box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: 900; }
    .title { font-size: 16px; margin: 2px 0; }
    .subtitle { font-size: 11px; margin-bottom: 4px; }
    .badge {
      display: inline-block;
      padding: 3px 6px;
      background: #000;
      color: #fff;
      font-size: 13px;
      font-weight: bold;
      margin: 4px 0;
      border-radius: 3px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    .hero-box {
      border: 2px solid #000;
      padding: 5px;
      margin: 5px 0;
      text-align: center;
    }
    .unit-code {
      font-size: 20px;
      font-weight: 900;
    }
    .footer {
      font-size: 10px;
      margin-top: 8px;
    }
    @media print {
      body { width: 100%; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="bold title">🌿 ECO AVENTURA</div>
    <div class="subtitle">Alquiler de Rodados y Náutica</div>
    <div class="divider"></div>
    <div class="badge">${isReserva ? '🎟️ TICKET DE RESERVA' : '🛵 SALIDA DE ALQUILER'}</div>
    <div style="font-size: 10px;">Comprobante #${opts.ticketId.slice(-6).toUpperCase()}</div>
  </div>

  <div class="double-divider"></div>

  <div class="hero-box">
    <div style="font-size: 10px; font-weight: bold;">UNIDAD RESERVADA:</div>
    <div class="unit-code">${opts.unitCode}</div>
    <div class="bold">${opts.unitName}</div>
    <div style="font-size: 10px;">${opts.categoryName}</div>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span>CLIENTE:</span>
    <span class="bold">${opts.customerName}</span>
  </div>
  ${opts.customerPhone ? `
  <div class="row">
    <span>TEL:</span>
    <span>${opts.customerPhone}</span>
  </div>` : ''}

  <div class="row">
    <span>GARANTÍA:</span>
    <span class="bold">${opts.docType} (${opts.docLocker})</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span>TIEMPO:</span>
    <span class="bold">${opts.durationMinutes} MINUTOS</span>
  </div>

  <div class="row">
    <span>DISPONIBLE APROX:</span>
    <span class="bold">${opts.expectedTime} HS</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span>PAGO:</span>
    <span class="bold" style="text-transform: uppercase;">${opts.paymentMethod}</span>
  </div>

  <div class="row" style="font-size: 14px; margin-top: 4px;">
    <span class="bold">TOTAL PAGADO:</span>
    <span class="bold">$${opts.totalPrice.toLocaleString()}</span>
  </div>

  <div class="double-divider"></div>

  <div class="text-center footer">
    <div>HORA EMISIÓN: ${nowStr} HS</div>
    ${isReserva ? `
    <div class="bold" style="margin-top: 4px; font-size: 10px;">
      Presente este ticket al operador cuando regrese su vehículo a pista.
    </div>` : `
    <div class="bold" style="margin-top: 4px; font-size: 10px;">
      ¡Disfrute de su paseo! Recuerde devolver en horario.
    </div>`}
    <div style="margin-top: 6px;">*** GRACIAS POR ELEGIRNOS ***</div>
  </div>
</body>
</html>
  `;
}

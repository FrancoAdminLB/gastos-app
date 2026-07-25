export interface ParsedExpense {
  monto: number;
  moneda: string;
  comercio: string;
  fecha: Date;
  medioPago: "efectivo" | "cheque" | "transferencia_bancaria" | "cripto" | "tarjeta_credito";
  fuente: string; // "mercadopago" | "visa" | "mastercard" | etc.
}

export function parseExpenseText(text: string): ParsedExpense | null {
  const normalized = text.replace(/\s+/g, " ").trim();

  // Try each parser in order
  return (
    parseMercadoPago(normalized) ||
    parseCardPurchase(normalized) ||
    parseBankTransfer(normalized) ||
    parseGeneric(normalized)
  );
}

// Mercado Pago notifications
// Examples:
// "Pagaste $1.500,00 en Carrefour con tu dinero en cuenta"
// "Pagaste $2.300 a Juan Perez"
// "Pagaste $ 1.500,00 con tu tarjeta terminada en 1234 en McDonald's"
// "Tu compra de $500 en Farmacity fue aprobada"
function parseMercadoPago(text: string): ParsedExpense | null {
  // Pattern: "Pagaste $X en/a COMERCIO"
  const pagaste = text.match(
    /[Pp]agaste\s*\$\s*([\d.,]+)\s*(?:en|a)\s+(.+?)(?:\s+con\s+tu|\s*$)/i
  );
  if (pagaste) {
    return {
      monto: parseAmount(pagaste[1]),
      moneda: "ARS",
      comercio: cleanMerchant(pagaste[2]),
      fecha: new Date(),
      medioPago: text.toLowerCase().includes("tarjeta") ? "tarjeta_credito" : "transferencia_bancaria",
      fuente: "mercadopago",
    };
  }

  // Pattern: "Tu compra de $X en COMERCIO"
  const compra = text.match(
    /[Cc]ompra\s+de\s*\$\s*([\d.,]+)\s+en\s+(.+?)(?:\s+fue|\s*$)/i
  );
  if (compra) {
    return {
      monto: parseAmount(compra[1]),
      moneda: "ARS",
      comercio: cleanMerchant(compra[2]),
      fecha: new Date(),
      medioPago: "tarjeta_credito",
      fuente: "mercadopago",
    };
  }

  // Pattern: "Recibiste un cobro de $X de COMERCIO" (ignore, it's income)
  // Pattern: "Enviaste $X a NOMBRE"
  const envio = text.match(
    /[Ee]nviaste\s*\$\s*([\d.,]+)\s+a\s+(.+?)(?:\s*$)/i
  );
  if (envio) {
    return {
      monto: parseAmount(envio[1]),
      moneda: "ARS",
      comercio: cleanMerchant(envio[2]),
      fecha: new Date(),
      medioPago: "transferencia_bancaria",
      fuente: "mercadopago",
    };
  }

  return null;
}

// Credit/debit card purchase notifications
// Examples:
// "Compra aprobada por $5.200,00 en RAPPI con tu Visa terminada en 4589"
// "Se realizó un consumo de $3.400 con tu tarjeta *1234 en YPF"
// "VISA *4589 Compra $1.200,50 COTO CICSA"
function parseCardPurchase(text: string): ParsedExpense | null {
  // Pattern: "Compra aprobada por $X en COMERCIO con tu TARJETA"
  const aprobada = text.match(
    /[Cc]ompra\s+(?:aprobada|autorizada)\s+(?:por|de)\s*\$\s*([\d.,]+)\s+en\s+(.+?)\s+con\s+tu\s+(\w+)/i
  );
  if (aprobada) {
    const cardType = aprobada[3].toLowerCase();
    return {
      monto: parseAmount(aprobada[1]),
      moneda: "ARS",
      comercio: cleanMerchant(aprobada[2]),
      fecha: new Date(),
      medioPago: "tarjeta_credito",
      fuente: cardType,
    };
  }

  // Pattern: "consumo de $X con tu tarjeta *1234 en COMERCIO"
  const consumo = text.match(
    /consumo\s+de\s*\$\s*([\d.,]+)\s+con\s+tu\s+tarjeta.*?en\s+(.+?)(?:\s*$|\s+el\s)/i
  );
  if (consumo) {
    return {
      monto: parseAmount(consumo[1]),
      moneda: "ARS",
      comercio: cleanMerchant(consumo[2]),
      fecha: new Date(),
      medioPago: "tarjeta_credito",
      fuente: "tarjeta",
    };
  }

  // Pattern: "VISA *4589 Compra $X COMERCIO"
  const visa = text.match(
    /(VISA|MASTERCARD|AMEX|CABAL)\s*\*?\d{4}\s+[Cc]ompra\s*\$\s*([\d.,]+)\s+(.+?)(?:\s*$)/i
  );
  if (visa) {
    return {
      monto: parseAmount(visa[2]),
      moneda: "ARS",
      comercio: cleanMerchant(visa[3]),
      fecha: new Date(),
      medioPago: "tarjeta_credito",
      fuente: visa[1].toLowerCase(),
    };
  }

  return null;
}

// Bank transfers
// "Transferiste $10.000 a Juan Perez CBU 000..."
function parseBankTransfer(text: string): ParsedExpense | null {
  const transfer = text.match(
    /[Tt]ransferiste\s*\$\s*([\d.,]+)\s+a\s+(.+?)(?:\s+CBU|\s+CVU|\s*$)/i
  );
  if (transfer) {
    return {
      monto: parseAmount(transfer[1]),
      moneda: "ARS",
      comercio: cleanMerchant(transfer[2]),
      fecha: new Date(),
      medioPago: "transferencia_bancaria",
      fuente: "banco",
    };
  }
  return null;
}

// Generic: just try to find an amount
function parseGeneric(text: string): ParsedExpense | null {
  // Try to find $X.XXX,XX or $X.XXX pattern
  const amountMatch = text.match(/\$\s*([\d.,]+)/);
  if (!amountMatch) return null;

  const monto = parseAmount(amountMatch[1]);
  if (monto <= 0) return null;

  // Try to extract what comes after the amount as merchant
  const afterAmount = text.substring(text.indexOf(amountMatch[0]) + amountMatch[0].length).trim();
  const comercio = afterAmount.split(/\s{2,}|\n/)[0]?.trim() || "Sin detalle";

  // Detect USD
  const isUSD = /USD|U\$S|dol/i.test(text);

  return {
    monto,
    moneda: isUSD ? "USD" : "ARS",
    comercio: cleanMerchant(comercio.substring(0, 50)),
    fecha: new Date(),
    medioPago: "efectivo",
    fuente: "manual",
  };
}

// Parse Argentine number format: 1.500,00 -> 1500.00
function parseAmount(str: string): number {
  // Remove dots (thousand separators), replace comma with dot (decimal)
  const cleaned = str.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function cleanMerchant(str: string): string {
  return str
    .replace(/\s+/g, " ")
    .replace(/[.]+$/, "")
    .trim()
    .substring(0, 100);
}

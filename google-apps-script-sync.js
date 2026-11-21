/**
 * Google Apps Script para Eco Aventura (RentFlow PWA)
 * ---------------------------------------------------
 * Instrucciones:
 * 1. Abrí tu Google Sheet -> menú "Extensiones" -> "Apps Script".
 * 2. Borrá todo lo que haya y pegá este código completo.
 * 3. Guardá (Ctrl+S) y hacé clic en "Implementar" -> "Nueva implementación".
 * 4. Tipo: "Aplicación web" | Ejecutar como: "Yo" | Quién tiene acceso: "Cualquier usuario".
 * 5. Copiá la URL que termina en /exec y pegala en RentFlow -> Configuración -> Datos -> Sincronización Google Sheets.
 */

const ID_COL = 26; // Columna Z para guardar el rentalId sin molestar A:H ni SUP (L:R)
const PINK_COLOR = '#d5a6bd'; // Magenta claro 2 (tono exacto de tu planilla)
const CANCEL_COLOR = '#efefef';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const data = JSON.parse(e.postData.contents);
    if (!data || data.action === 'ping') {
      return jsonResponse({ ok: true, message: 'pong' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = data.sheetName || 'CARROS';
    const sheet = findSheetByNameFlexible(ss, sheetName);
    if (!sheet) {
      return jsonResponse({ ok: false, error: 'Pestaña no encontrada: ' + sheetName });
    }

    if (data.action === 'create') {
      const targetRow = findNextEmptyRow(sheet);
      const rowValues = [[
        data.fecha || '',
        data.nombre || '',
        data.tipo || '',
        data.desde || '',
        data.hasta || '',
        Number(data.monto || 0),
        data.ef || '',
        data.mp || ''
      ]];

      sheet.getRange(targetRow, 1, 1, 8).setValues(rowValues);
      sheet.getRange(targetRow, 6).setNumberFormat('"$ "#,##0.00');
      sheet.getRange(targetRow, ID_COL).setValue(data.rentalId);

      return jsonResponse({ ok: true, action: 'create', row: targetRow, sheet: sheetName });
    }

    // Buscar fila existente por rentalId en columna Z
    const rowIdx = findRowByRentalId(sheet, data.rentalId);
    if (rowIdx === -1) {
      return jsonResponse({ ok: false, error: 'No se encontró rentalId: ' + data.rentalId });
    }

    if (data.action === 'update_times') {
      if (data.desde) sheet.getRange(rowIdx, 4).setValue(data.desde);
      if (data.hasta) sheet.getRange(rowIdx, 5).setValue(data.hasta);
      return jsonResponse({ ok: true, action: 'update_times', row: rowIdx });
    }

    if (data.action === 'finish') {
      if (data.hasta) sheet.getRange(rowIdx, 5).setValue(data.hasta);
      if (typeof data.monto === 'number') {
        sheet.getRange(rowIdx, 6).setValue(data.monto).setNumberFormat('"$ "#,##0.00');
      }
      if (data.ef !== undefined) sheet.getRange(rowIdx, 7).setValue(data.ef);
      if (data.mp !== undefined) sheet.getRange(rowIdx, 8).setValue(data.mp);

      // Pintar de rosa los recuadros B:H al devolver el vehículo (dejando A libre para la fecha)
      sheet.getRange(rowIdx, 2, 1, 7).setBackground(PINK_COLOR);
      return jsonResponse({ ok: true, action: 'finish', row: rowIdx, painted: PINK_COLOR });
    }

    if (data.action === 'cancel') {
      sheet.getRange(rowIdx, 1, 1, 8).setBackground(CANCEL_COLOR);
      const prevName = sheet.getRange(rowIdx, 2).getValue();
      sheet.getRange(rowIdx, 2).setValue('[CANCELADO] ' + prevName);
      return jsonResponse({ ok: true, action: 'cancel', row: rowIdx });
    }

    return jsonResponse({ ok: false, error: 'Acción desconocida' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Busca la primera fila libre mirando columnas A, B, C, D, F, G, H
 * (ignora fórmulas sueltas en E como "12:30:00 a.m." y no toca L:R donde está SUP).
 */
function findNextEmptyRow(sheet) {
  const maxRow = Math.max(sheet.getLastRow(), 2);
  const values = sheet.getRange(1, 1, maxRow, 8).getValues();

  let lastUsed = 2; // Fila 2 son los encabezados
  for (let r = 2; r < values.length; r++) {
    const row = values[r];
    const hasData =
      String(row[0]).trim() !== '' || // FECHA
      String(row[1]).trim() !== '' || // NOMBRE
      String(row[2]).trim() !== '' || // doble/simple
      String(row[3]).trim() !== '' || // DESDE
      String(row[5]).trim() !== '' || // $
      String(row[6]).trim() !== '' || // ef
      String(row[7]).trim() !== '';   // mp

    if (hasData) {
      lastUsed = r + 1; // 1-indexed
    }
  }
  return lastUsed + 1;
}

function findRowByRentalId(sheet, rentalId) {
  if (!rentalId) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) return -1;

  const ids = sheet.getRange(1, ID_COL, lastRow, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]).trim() === String(rentalId).trim()) {
      return i + 1;
    }
  }
  return -1;
}

function normalizeSheetKey(name) {
  return String(name || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca la pestaña de forma flexible: coincidencia exacta, sin tildes/mayúsculas,
 * o variantes singular/plural (ej. MONOPATIN <-> MONOPATINES).
 */
function findSheetByNameFlexible(ss, targetName) {
  const exact = ss.getSheetByName(targetName);
  if (exact) return exact;

  const targetKey = normalizeSheetKey(targetName);
  const aliases = {
    MONOPATIN: ['MONOPATIN', 'MONOPATINES', 'MONOPATIN ELECTRICO', 'MONOPATINES ELECTRICOS'],
    CARROS: ['CARROS', 'CARRO', 'CARRITOS'],
    KARTING: ['KARTING', 'KARTINGS'],
    KAYAK: ['KAYAK', 'KAYAKS'],
  };
  const candidates = aliases[targetKey] || [targetKey];

  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const key = normalizeSheetKey(sheets[i].getName());
    if (candidates.indexOf(key) !== -1) {
      return sheets[i];
    }
  }
  return null;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


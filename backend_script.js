/**
 * BOCADO CLOUD BACKEND (Google Sheets) v8.0
 * Soporte para Bloqueo Manual (Open/Closed) y Configuración Global.
 */
const SPREADSHEET_ID = '1Dtuhp3L1aVH9UkUO9eMZNXNntZYAldZ6-gETVviJRpA';

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const prodSheet = ss.getSheetByName('Productos') || createProductsSheet(ss);
  const banSheet = ss.getSheetByName('Banners') || createBannersSheet(ss);
  const schedSheet = ss.getSheetByName('Horarios') || createSchedulesSheet(ss);
  const configSheet = ss.getSheetByName('Config') || createConfigSheet(ss);

  const products = sheetToObjects(prodSheet);
  const banners = sheetToObjects(banSheet);
  const schedules = sheetToObjects(schedSheet);
  const config = sheetToObjects(configSheet);

  return ContentService.createTextOutput(JSON.stringify({ products, banners, schedules, config }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const productFields = ['id', 'name', 'price', 'category', 'img', 'desc', 'active', 'stock', 'sortOrder', 'allowedSides', 'sidesLimit'];

  if (data.action === 'saveProducts') {
    const sheet = ss.getSheetByName('Productos') || createProductsSheet(ss);
    objectsToSheet(sheet, data.payload, productFields);
  } 
  else if (data.action === 'saveBanners') {
    const sheet = ss.getSheetByName('Banners') || createBannersSheet(ss);
    objectsToSheet(sheet, data.payload, ['id', 'title', 'subtitle', 'color']);
  }
  else if (data.action === 'saveSchedules') {
    const sheet = ss.getSheetByName('Horarios') || createSchedulesSheet(ss);
    objectsToSheet(sheet, data.payload, ['id', 'time', 'active']);
  }
  else if (data.action === 'saveConfig') {
    const sheet = ss.getSheetByName('Config') || createConfigSheet(ss);
    objectsToSheet(sheet, data.payload, ['key', 'value']);
  }
  else if (data.action === 'deductStock') {
    const sheet = ss.getSheetByName('Productos') || createProductsSheet(ss);
    const currentProducts = sheetToObjects(sheet);
    let changed = false;
    
    data.payload.forEach(item => {
      const prod = currentProducts.find(p => String(p.id) === String(item.id));
      if (prod) {
        const currentStock = parseInt(prod.stock);
        if (!isNaN(currentStock)) {
          prod.stock = Math.max(0, currentStock - item.qty);
          changed = true;
        }
      }
    });

    if (changed) {
      objectsToSheet(sheet, currentProducts, productFields);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val === 'TRUE' || val === 'true') val = true;
      if (val === 'FALSE' || val === 'false') val = false;
      obj[h] = val;
    });
    return obj;
  });
}

function objectsToSheet(sheet, objects, fields) {
  sheet.clear();
  sheet.appendRow(fields);
  if (objects.length > 0) {
    const rows = objects.map(obj => fields.map(f => {
        if (obj[f] === undefined) return '';
        if (f === 'time') return `'${obj[f]}`; 
        return obj[f];
    }));
    sheet.getRange(2, 1, rows.length, fields.length).setValues(rows);
  }
}

function createConfigSheet(ss) {
  const s = ss.insertSheet('Config');
  s.appendRow(['key', 'value']);
  s.appendRow(['shop_open', 'true']);
  return s;
}

function createProductsSheet(ss) {
  const s = ss.insertSheet('Productos');
  s.appendRow(['id', 'name', 'price', 'category', 'img', 'desc', 'active', 'stock', 'sortOrder', 'allowedSides', 'sidesLimit']);
  return s;
}

function createBannersSheet(ss) {
  const s = ss.insertSheet('Banners');
  s.appendRow(['id', 'title', 'subtitle', 'color']);
  return s;
}

function createSchedulesSheet(ss) {
  const s = ss.insertSheet('Horarios');
  s.appendRow(['id', 'time', 'active']);
  return s;
}

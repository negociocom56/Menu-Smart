
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

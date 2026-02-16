//==========================================
// WebApp.gs
// HTML表示とマスタ取得・保存
//==========================================

const WEBAPP_SHEET_MATERIALS = '🫘｜材料一覧';
const WEBAPP_SHEET_ITEMS = '🥤｜物品一覧';
const WEBAPP_SHEET_RECIPES = '☕｜商品一覧';
const WEBAPP_SHEET_HISTORY = '📦｜履歴';

function doGet(e) {
  if (e && e.parameter && e.parameter.api === '1') {
    const method = String(e.parameter.method || '').trim();
    const payload = e.parameter.payload ? JSON.parse(e.parameter.payload) : null;
    return apiDispatch_(method, payload, e);
  }
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Cafe Inventory Smart')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();

  const fetch = (sheetName, category) => {
    const s = ss.getSheetByName(sheetName);
    if (!s) return [];
    return s.getDataRange().getValues().slice(1).map(r => {
      const name = r[0];
      const thresholdRaw = r[1];
      const thresholdNum = Number(thresholdRaw);
      const thresholdUnit = String(r[2] || r[12] || '').trim();
      const unit = String(r[12] || '').trim();
      let thresholdBaseQty = thresholdNum;
      if (isFinite(thresholdNum) && thresholdUnit && unit) {
        try {
          thresholdBaseQty = convertQtyToBase(name, thresholdNum, thresholdUnit, unit);
        } catch (e) {
          thresholdBaseQty = thresholdNum;
        }
      }
      return {
        name: name,
        threshold: thresholdRaw,
        thresholdUnit: thresholdUnit || unit,
        thresholdBaseQty: thresholdBaseQty,
        unit: unit,
        uName: r[3],
        uQty: r[4],
        supplier: r[6],
        method: r[7],
        url: r[8],
        stdQty: r[9],
        currentQty: r[11],
        category: category
      };
    }).filter(x => x.name);
  };

  const mat = fetch(WEBAPP_SHEET_MATERIALS, '材料');
  const item = fetch(WEBAPP_SHEET_ITEMS, '物品');
  const convMap = getItemConversionsMap();
  mat.forEach(x => {
    x.unitConversions = getUnitOptionsForItem(x.name, x.unit, convMap);
    x.unitOptions = x.unitConversions.map(o => o.unit);
  });
  item.forEach(x => {
    x.unitConversions = getUnitOptionsForItem(x.name, x.unit, convMap);
    x.unitOptions = x.unitConversions.map(o => o.unit);
  });

  const recipes = ss.getSheetByName(WEBAPP_SHEET_RECIPES)?.getDataRange().getValues().slice(1).map(r => {
    const items = [];
    for (let i = 2; i < r.length; i += 3) {
      const name = r[i];
      const qty = r[i + 1];
      const unit = r[i + 2];
      if (name && qty !== '') items.push({ name: name, qty: qty, unit: unit || '' });
    }
    return { name: r[0], num: r[1], items: items };
  }).filter(x => x.name) || [];

  const shopName = props.getProperty('SHOP_NAME') || 'Cafe Inventory Smart';
  const shopStaff = props.getProperty('STAFF_NAME') || '担当者';

  return {
    materials: mat,
    items: item,
    masterAll: mat.concat(item),
    recipes: recipes,
    masterWithUnits: mat.concat(item),
    shop: { name: shopName, staff: shopStaff },
    shopName: shopName,
    shopStaff: shopStaff
  };
}

function saveMasterGAS(d, sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  let rowIdx = data.findIndex(r => r[0] === d.oldName || r[0] === d.name) + 1;
  const targetRow = rowIdx > 0 ? rowIdx : Math.max(sheet.getLastRow() + 1, 2);
  const formula = "=SUMIF('" + WEBAPP_SHEET_HISTORY + "'!C:C, A" + targetRow + ", '" + WEBAPP_SHEET_HISTORY + "'!E:E)";

  const rowData = [
    d.name, d.threshold, (d.thresholdUnit || d.unit), d.uName, d.uQty, d.unit,
    d.supplier, d.method, d.url, d.stdQty, 'セット', formula, d.unit
  ];

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return 'マスタを保存しました';
}

function deleteMasterGAS(name, sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const idx = sheet.getDataRange().getValues().findIndex(r => r[0] === name) + 1;
  if (idx > 0) sheet.deleteRow(idx);
  return '削除しました';
}

function saveShopSettings(d) {
  const p = PropertiesService.getScriptProperties();
  p.setProperty('SHOP_NAME', d.name);
  p.setProperty('STAFF_NAME', d.staff);
  return '店舗情報を保存しました';
}

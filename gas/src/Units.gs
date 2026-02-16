//==========================================
// Units.gs
// 単位マスタ / 単位換算
//==========================================

const UNIT_SHEET_MASTER = '📏｜単位マスタ';
const UNIT_SHEET_CONVERSION = '⚖️｜単位換算';

function ensureUnitSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let unitSheet = ss.getSheetByName(UNIT_SHEET_MASTER);
  if (!unitSheet) {
    unitSheet = ss.insertSheet(UNIT_SHEET_MASTER);
    unitSheet.appendRow(['単位']);
    ['g', 'kg', 'ml', 'L', '個', '袋', 'パック', '本', '缶', '箱', '枚'].forEach(u => unitSheet.appendRow([u]));
  }

  let convSheet = ss.getSheetByName(UNIT_SHEET_CONVERSION);
  if (!convSheet) {
    convSheet = ss.insertSheet(UNIT_SHEET_CONVERSION);
    convSheet.appendRow(['アイテム名', '入力単位', '基準単位', '係数']);
  }
}

function getUnitMasterList() {
  ensureUnitSheets();
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UNIT_SHEET_MASTER);
  const units = s.getDataRange().getValues().slice(1).map(r => String(r[0] || '').trim()).filter(Boolean);
  return Array.from(new Set(units));
}

function saveUnitMaster(unitName) {
  ensureUnitSheets();
  const u = String(unitName || '').trim();
  if (!u) throw new Error('単位を入力してください');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UNIT_SHEET_MASTER);
  const exists = sheet.getDataRange().getValues().slice(1).some(r => String(r[0]).trim() === u);
  if (!exists) sheet.appendRow([u]);
  return '単位を保存しました';
}

function getItemConversionsMap() {
  ensureUnitSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UNIT_SHEET_CONVERSION);
  const rows = sheet.getDataRange().getValues().slice(1);
  const map = {};

  rows.forEach(r => {
    const itemName = String(r[0] || '').trim();
    const unit = String(r[1] || '').trim();
    const baseUnit = String(r[2] || '').trim();
    const factor = Number(r[3]);
    if (!itemName || !unit || !baseUnit || !isFinite(factor) || factor <= 0) return;

    if (!map[itemName]) map[itemName] = { baseUnit: baseUnit, factors: {} };
    map[itemName].baseUnit = baseUnit;
    map[itemName].factors[unit] = factor;
  });

  return map;
}

function getUnitOptionsForItem(itemName, baseUnit, convMap) {
  const map = convMap || getItemConversionsMap();
  const conv = map[itemName];
  const options = [];

  if (conv && conv.factors) {
    Object.keys(conv.factors).forEach(unit => {
      options.push({ unit: unit, factor: Number(conv.factors[unit]) });
    });
  }

  if (!options.some(x => x.unit === baseUnit)) {
    options.push({ unit: baseUnit, factor: 1 });
  }

  return options.sort((a, b) => a.factor - b.factor);
}

function convertQtyToBase(itemName, qty, inputUnit, baseUnit) {
  const num = Number(qty);
  if (!isFinite(num)) throw new Error('数量が不正です');

  const inUnit = String(inputUnit || '').trim() || baseUnit;
  const map = getItemConversionsMap();
  const conv = map[itemName];

  if (!conv) {
    if (inUnit !== baseUnit) throw new Error('換算設定がありません: ' + itemName + ' / ' + inUnit);
    return num;
  }

  const factor = Number(conv.factors[inUnit]);
  if (!isFinite(factor) || factor <= 0) {
    if (inUnit === baseUnit) return num;
    throw new Error('換算係数が不正です: ' + itemName + ' / ' + inUnit);
  }

  return num * factor;
}

function getUnitManagementData() {
  const data = getInitialData();
  const items = (data.masterAll || []).map(x => ({ name: x.name, baseUnit: x.unit }));
  const map = getItemConversionsMap();
  const conversions = {};

  items.forEach(it => {
    conversions[it.name] = getUnitOptionsForItem(it.name, it.baseUnit, map);
  });

  return {
    units: getUnitMasterList(),
    items: items,
    conversions: conversions
  };
}

function saveItemUnitConversions(payload) {
  ensureUnitSheets();
  const itemName = String(payload.itemName || '').trim();
  const baseUnit = String(payload.baseUnit || '').trim();
  const entries = Array.isArray(payload.entries) ? payload.entries : [];

  if (!itemName) throw new Error('アイテム名が不正です');
  if (!baseUnit) throw new Error('基準単位を入力してください');

  const normalized = entries
    .map(e => ({ unit: String(e.unit || '').trim(), factor: Number(e.factor) }))
    .filter(e => e.unit && isFinite(e.factor) && e.factor > 0);

  if (!normalized.some(e => e.unit === baseUnit)) {
    normalized.push({ unit: baseUnit, factor: 1 });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UNIT_SHEET_CONVERSION);
  const values = sheet.getDataRange().getValues();

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]).trim() === itemName) {
      sheet.deleteRow(i + 1);
    }
  }

  normalized.forEach(e => {
    sheet.appendRow([itemName, e.unit, baseUnit, e.factor]);
  });

  return '換算設定を保存しました';
}

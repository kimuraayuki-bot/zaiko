function registerItemFromUI(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('🥤｜物品一覧');
  if (!sheet) return "エラー: シートが見つかりません。";

  const values = sheet.getDataRange().getValues();
  let rowIdx = values.findIndex(r => r[0] === d.oldName || r[0] === d.name) + 1;
  const lastRow = sheet.getLastRow() + 1;
  const targetRow = rowIdx > 0 ? rowIdx : lastRow;
  
  const formula = "=SUMIF('📦｜履歴'!C:C, A" + targetRow + ", '📦｜履歴'!E:E)";
  
  const rowData = [
    d.name, d.threshold, "", d.uName, d.uQty, "", 
    d.supplier, d.method, d.contact, d.stdQty, "", 
    formula, d.unit
  ];

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return "物品を保存しました。";
}

function deleteItem(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('🥤｜物品一覧');
  const values = sheet.getDataRange().getValues();
  const idx = values.findIndex(r => r[0] === name) + 1;
  if (idx > 0) { sheet.deleteRow(idx); return "削除しました。"; }
  return "対象が見つかりません。";
}
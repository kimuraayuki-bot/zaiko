function registerMaterialFromUI(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('🫘｜材料一覧');
  if (!sheet) return "エラー: シートが見つかりません。";
  
  const values = sheet.getDataRange().getValues();
  let rowIdx = values.findIndex(r => r[0] === d.oldName || r[0] === d.name) + 1;
  const lastRow = sheet.getLastRow() + 1;
  const targetRow = rowIdx > 0 ? rowIdx : lastRow;
  
  // L列（12番目）に在庫計算用のSUMIFを自動セット
  const formula = "=SUMIF('📦｜履歴'!C:C, A" + targetRow + ", '📦｜履歴'!E:E)";
  
  // 幸花ちゃんのCSV列順 [0]名称, [1]通知, [2]空, [3]商品, [4]内容量, [5]空, [6]発注先, [7]手段, [8]URL, [9]標準, [10]空, [11]数式, [12]単位
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
  return "材料を保存しました。";
}

function deleteMaterial(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('🫘｜材料一覧');
  const values = sheet.getDataRange().getValues();
  const idx = values.findIndex(r => r[0] === name) + 1;
  if (idx > 0) { sheet.deleteRow(idx); return "削除しました。"; }
  return "対象が見つかりません。";
}
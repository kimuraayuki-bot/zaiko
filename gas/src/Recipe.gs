//==========================================
// Recipe.gs
// 商品レシピの保存
//==========================================

function saveRecipeFromUI(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('☕｜商品一覧');
  if (!sheet) throw new Error('シート「☕｜商品一覧」が見つかりません');
  if (!data || !data.productName) throw new Error('商品名を入力してください');
  if (!data.productNum) throw new Error('商品番号を入力してください');

  const row = [data.productName, data.productNum];
  (data.items || []).forEach(it => row.push(it.name, it.qty, it.unit));

  const values = sheet.getDataRange().getValues();
  let rowIdx = values.findIndex((r, i) => i > 0 && String(r[1] || '').trim() === String(data.productNum).trim()) + 1;
  if (rowIdx <= 1) {
    rowIdx = values.findIndex((r, i) => i > 0 && String(r[0] || '').trim() === String(data.productName).trim()) + 1;
  }

  if (rowIdx > 1) {
    sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).clearContent();
    sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return 'レシピを保存しました';
}

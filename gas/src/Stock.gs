//==========================================
// Stock.gs
// 在庫の直接調整
//==========================================

const STOCK_SHEET_MATERIALS = '🫘｜材料一覧';
const STOCK_SHEET_ITEMS = '🥤｜物品一覧';
const STOCK_SHEET_HISTORY = '📦｜履歴';

function updateStockDirectly(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (data.category === '材料') ? STOCK_SHEET_MATERIALS : STOCK_SHEET_ITEMS;
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) return 'エラー: シートが見つかりません';

  const values = sheet.getDataRange().getValues();
  let targetRow = -1;

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.name) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) return 'エラー: アイテムが見つかりません';

  sheet.getRange(targetRow, 12).setValue(data.newQty);

  const historySheet = ss.getSheetByName(STOCK_SHEET_HISTORY);
  if (historySheet) {
    historySheet.appendRow([
      new Date(),
      data.category,
      data.name,
      '在庫調整',
      data.newQty,
      '',
      '直接調整',
      data.newQty
    ]);
  }

  return `${data.name} の在庫を ${data.newQty} に更新しました`;
}

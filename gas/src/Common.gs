//==========================================
// Common.gs
// スプレッドシートメニューと月次繰越
//==========================================

const COMMON_SHEET_HISTORY = '📦｜履歴';

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('在庫管理メニュー')
    .addItem('在庫管理アプリを開く', 'openInventoryApp')
    .addItem('月次繰越を実行', 'runMonthlyRollover')
    .addToUi();
}

function openInventoryApp() {
  const html = HtmlService.createTemplateFromFile('Index').evaluate()
    .setWidth(450)
    .setHeight(750)
    .setTitle('Cafe Inventory Smart');
  SpreadsheetApp.getUi().showModalDialog(html, '在庫管理');
}

function runMonthlyRollover() {
  const FOLDER_ID = '1OkJ_OgHWWVs1e1RfuF1AC4CFBB8hmM4J';
  const TEMPLATE_NAME = 'テンプレ';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(COMMON_SHEET_HISTORY);
  if (!logSheet) return;

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const fileName = Utilities.formatDate(lastMonth, 'JST', 'yyyy年MM月') + '_入出庫履歴';

  const folder = DriveApp.getFolderById(FOLDER_ID);
  const templateFiles = folder.getFilesByName(TEMPLATE_NAME);
  if (!templateFiles.hasNext()) return;

  const templateFile = templateFiles.next();
  const newFile = templateFile.makeCopy(fileName, folder);
  const newSS = SpreadsheetApp.open(newFile);
  const logData = logSheet.getDataRange().getValues();

  if (logData.length > 1) {
    newSS.getSheets()[0].getRange(1, 1, logData.length, logData[0].length).setValues(logData);
  }

  const initial = getInitialData();
  logSheet.clearContents();
  logSheet.appendRow(['日付', 'カテゴリ', '名称', '区分', '変動量', '単位', '備考', '最新在庫']);

  const dateStr = Utilities.formatDate(now, 'JST', 'yyyy/MM/01');
  const carryOverRows = initial.masterAll.map(item => {
    return [dateStr, item.category, item.name, '繰越', item.currentQty, item.unit, '月次繰越', ''];
  });

  if (carryOverRows.length > 0) {
    logSheet.getRange(2, 1, carryOverRows.length, carryOverRows[0].length).setValues(carryOverRows);
  }
}

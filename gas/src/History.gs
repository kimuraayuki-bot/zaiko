//==========================================
// History.gs
// 【機能】「📦｜履歴」への書き込み専用
//==========================================

function appendToLog(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName('📦｜履歴')?.appendRow(data);
}
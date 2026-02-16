//==========================================
// Calendar.gs
// 【機能】予定（専用シート）と実績（履歴シート）の独立管理
//==========================================

function getCalendarData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = { events: {} };

  // 1. 実績（出庫・廃棄・調整）を履歴シートから取得
  const hVals = ss.getSheetByName("📦｜履歴")?.getDataRange().getValues() || [];
  for (let i = 1; i < hVals.length; i++) {
    const date = hVals[i][0]; if (!(date instanceof Date)) continue;
    const dateStr = Utilities.formatDate(date, "JST", "yyyy-MM-dd");
    const type = hVals[i][3];
    if (["出庫", "廃棄", "調整"].includes(type)) {
      if (!data.events[dateStr]) data.events[dateStr] = [];
      data.events[dateStr].push({ type: type, name: hVals[i][2], qty: hVals[i][4], unit: hVals[i][5] });
    }
  }

  // 2. 予定を「🗓️｜予定」シートから取得
  const pVals = ss.getSheetByName("🗓️｜予定")?.getDataRange().getValues() || [];
  for (let i = 1; i < pVals.length; i++) {
    const date = pVals[i][0]; if (!(date instanceof Date)) continue;
    const dateStr = Utilities.formatDate(date, "JST", "yyyy-MM-dd");
    if (!data.events[dateStr]) data.events[dateStr] = [];
    data.events[dateStr].push({ type: "予定", name: pVals[i][1], qty: 0, unit: "" });
  }
  return data;
}

function addCalendarEvent(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let planSheet = ss.getSheetByName("🗓️｜予定");
  if (!planSheet) {
    planSheet = ss.insertSheet("🗓️｜予定");
    planSheet.appendRow(["日付", "予定内容"]);
  }
  planSheet.appendRow([new Date(data.date), data.title]);
  return "予定を登録しました。";
}
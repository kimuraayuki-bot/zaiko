//==========================================
// Adjustment.gs
// 在庫調整 / 廃棄
//==========================================

function processInventoryAdjustment(name, inputQty, type, category, unit, inputUnit) {
  const data = getInitialData().masterAll;
  const item = data.find(x => x.name === name);
  const baseUnit = item ? item.unit : unit;
  const currentTheoryQty = item ? Number(item.currentQty) : 0;

  const qtyInBase = convertQtyToBase(name, inputQty, inputUnit || baseUnit, baseUnit);

  let diff = 0;
  let action = '';
  let memo = '';

  if (type === 'adj') {
    diff = qtyInBase - currentTheoryQty;
    action = '調整';
    memo = '棚卸しによる在庫調整';
  } else {
    diff = -Math.abs(qtyInBase);
    action = '廃棄';
    memo = '廃棄ロス登録';
  }

  if (diff === 0) return '在庫数に変更はありません';

  appendToLog([new Date(), category, name, action, diff, baseUnit, memo, '']);
  return `${action}を登録しました (${diff > 0 ? '+' : ''}${diff}${baseUnit})`;
}

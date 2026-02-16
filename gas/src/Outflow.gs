//==========================================
// Outflow.gs
// 出庫関連
//==========================================

function analyzeSalesCSV(csvData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recipes = ss.getSheetByName('☕｜商品一覧').getDataRange().getValues();
  const rows = Utilities.parseCsv(csvData);
  if (!rows || rows.length === 0) return { summary: [], reductions: {} };

  const normalize = v => String(v || '').trim().toLowerCase().replace(/\s+/g, '');
  const header = (rows[0] || []).map(normalize);
  const findIdx = (cands, fallbackIdx) => {
    const idx = header.findIndex(h => cands.includes(h));
    return idx >= 0 ? idx : fallbackIdx;
  };

  const idxProductNum = findIdx(['商品番号', '商品コード', 'sku', 'itemsku', 'itemvariationsku', 'variationid', '商品id'], 3);
  const idxProductName = findIdx(['商品名', '品名', 'item', 'itemname', 'menuitemname'], 4);
  const idxSalesQty = findIdx(['数量', '売上数', '販売数', 'qty', 'quantity'], 5);

  const recipeByNum = {};
  const recipeByName = {};
  recipes.slice(1).forEach(r => {
    const n = String(r[0] || '').trim();
    const num = String(r[1] || '').trim();
    if (num) recipeByNum[num] = r;
    if (n) recipeByName[n] = r;
  });

  let salesSummary = [];
  let reductions = {};

  rows.forEach((row, index) => {
    if (index === 0 || row.length === 0) return;
    const productNum = String(row[idxProductNum] || '').replace(/"/g, '').trim();
    const productName = String(row[idxProductName] || '').replace(/"/g, '').trim();
    const salesQty = Number(row[idxSalesQty]) || 0;
    if ((!productNum && !productName) || salesQty === 0) return;

    salesSummary.push({ num: productNum, name: productName, qty: salesQty });
    const recipe = (productNum && recipeByNum[productNum]) || recipeByName[productName];
    if (!recipe) return;

    for (let i = 2; i < recipe.length; i += 3) {
      const matName = recipe[i];
      const matQty = recipe[i + 1];
      const matUnit = recipe[i + 2];
      if (matName && matQty) {
        if (!reductions[matName]) reductions[matName] = { qty: 0, unit: matUnit };
        reductions[matName].qty += (Number(matQty) * salesQty);
      }
    }
  });

  return { summary: salesSummary, reductions: reductions };
}

function registerOutflowFinal(reductionData) {
  const date = new Date();
  const initial = getInitialData().masterAll;
  let count = 0;

  for (let name in reductionData) {
    const item = reductionData[name];
    const m = initial.find(x => x.name === name);
    const category = m ? m.category : '材料';

    let baseQty = Number(item.qty) || 0;
    let baseUnit = item.unit || '';
    if (m) {
      baseQty = convertQtyToBase(name, item.qty, item.unit || m.unit, m.unit);
      baseUnit = m.unit;
    }

    appendToLog([date, category, name, '出庫', -baseQty, baseUnit, 'Square売上連携', '']);
    count++;
  }

  return count + '件の出庫を登録しました';
}

//==========================================
// Order.gs
// 縲先ｩ溯・縲醍匱豕ｨ逕ｨ繝・・繧ｿ縺ｮ謚ｽ蜃ｺ
//==========================================

function getOrderListData() {
  const data = getInitialData();
  const all = data.materials.concat(data.items);
  // 蝨ｨ蠎ｫ縺碁夂衍譎よ悄莉･荳九・繧ゅ・繧呈歓蜃ｺ
  return all.filter(r => r.name !== "" && Number(r.currentQty) <= Number(r.thresholdBaseQty ?? r.threshold));
}

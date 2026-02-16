//==========================================
// Api.gs
// React/Vercel から利用する JSON API
//==========================================

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    const method = String(body.method || '').trim();
    const params = body.params;
    return apiDispatch_(method, params, e, body);
  } catch (err) {
    return apiError_(err);
  }
}

function apiDispatch_(method, params, e, body) {
  try {
    if (!method) throw new Error('method is required');
    apiVerifyToken_(body);
    const allowed = {
      getInitialData: getInitialData,
      processInflowFromUI: processInflowFromUI,
      processInventoryAdjustment: processInventoryAdjustment,
      analyzeSalesCSV: analyzeSalesCSV,
      registerOutflowFinal: registerOutflowFinal,
      saveRecipeFromUI: saveRecipeFromUI,
      getCalendarData: getCalendarData,
      addCalendarEvent: addCalendarEvent,
      saveShopSettings: saveShopSettings,
      saveMasterGAS: saveMasterGAS,
      deleteMasterGAS: deleteMasterGAS,
      getUnitManagementData: getUnitManagementData,
      saveUnitMaster: saveUnitMaster,
      saveItemUnitConversions: saveItemUnitConversions
    };

    const fn = allowed[method];
    if (!fn) throw new Error('unknown method: ' + method);

    let data;
    if (Array.isArray(params)) data = fn.apply(null, params);
    else if (typeof params === 'undefined') data = fn();
    else data = fn(params);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return apiError_(err);
  }
}

function apiError_(err) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      error: (err && err.message) ? err.message : String(err || 'Unknown error')
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiVerifyToken_(body) {
  const required = String(PropertiesService.getScriptProperties().getProperty('API_TOKEN') || '').trim();
  if (!required) return;
  const incoming = String((body && body.token) || '').trim();
  if (!incoming || incoming !== required) throw new Error('unauthorized');
}

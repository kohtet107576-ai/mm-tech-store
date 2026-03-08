/**
 * ၁။ Google Sheet ID ကို အောက်က SHEET_ID နေရာမှာ ထည့်ပေးပါ
 * Google Sheet URL ထဲက /d/ နဲ့ /edit ကြားက စာသားအရှည်ကြီး ဖြစ်ပါတယ်
 */
const SHEET_ID = "1Q4w24CQGy-XJmCyomgQ3lEacBnsLiqnbkswXWZ8zN50";

/**
 * GET Request: ပစ္စည်းစာရင်းများကို ဖတ်ယူရန်
 */
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName("Products");
    
    if (!sheet) {
      return createJsonResponse({ error: "'Products' sheet ကို ရှာမတွေ့ပါ" });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return createJsonResponse([]);

    const headers = data[0];
    const rows = data.slice(1);
    
    const products = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        obj[header.toString().trim()] = row[i];
      });
      return obj;
    });

    return createJsonResponse(products);

  } catch (error) {
    return createJsonResponse({ error: "Connection Error: " + error.toString() });
  }
}

/**
 * POST Request: အော်ဒါအသစ် သိမ်းဆည်းရန်
 */
function doPost(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName("Orders");
    
    if (!sheet) {
      return createJsonResponse({ error: "'Orders' sheet ကို ရှာမတွေ့ပါ" });
    }

    const params = JSON.parse(e.postData.contents);
    
    // အော်ဒါအချက်အလက်များကို Sheet ထဲသို့ ထည့်ခြင်း
    sheet.appendRow([
      new Date(),
      params.userId || "Web User",
      params.username || "Unknown",
      params.fullName || "Unknown",
      params.phone || "",
      params.productName || "No Name",
      params.price || "0",
      "Pending"
    ]);
    
    return createJsonResponse({ status: "success" });

  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * JSON Response ပြန်ပေးရန် Helper Function
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

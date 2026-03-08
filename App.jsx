// ၁။ လူကြီးမင်းရဲ့ Google Sheet ID ကို ဒီနေရာမှာ အရင်ဆုံး အစားထိုးထည့်ပေးပါ
// (Sheet URL ထဲက .../d/ နဲ့ /edit... ကြားက စာသားရှည်ကြီး ဖြစ်ပါတယ်)
const SHEET_ID = "YOUR_SHEET_ID_HERE";

function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName("Products");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "'Products' အမည်ရှိသော Sheet ကို ရှာမတွေ့ပါ" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const products = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(products))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Connection Error: " + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName("Orders");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "'Orders' အမည်ရှိသော Sheet ကို ရှာမတွေ့ပါ" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const params = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      new Date(),
      params.userId || "Web User",
      params.username || "Unknown",
      params.fullName || "Unknown",
      params.phone || "",
      params.productName,
      params.price,
      "Pending"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

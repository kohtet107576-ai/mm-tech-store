// Google Sheet ID ကို ဒီနေရာမှာ ထည့်ပေးပါ (URL ထဲက id ပါ)
const SHEET_ID = "YOUR_SHEET_ID_HERE";

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Products");
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
}

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Orders");
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
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

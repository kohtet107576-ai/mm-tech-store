const TELEGRAM_BOT_TOKEN = "8615600204:AAFlUBsvXQa0Cd2H0OBcbyWki9YjX9kUrnQ";
const TELEGRAM_CHAT_ID = "-1003659088621";
const EXPECTED_TOKEN = "MMTech_Secure_Token_50056444";

const FIREBASE_PROJECT_ID = "mm-tech-store";
const FIREBASE_API_KEY = "AIzaSyCBWTPAr0xWwpN9ASinAQWK_incw8kD-v4";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Products");
    const data = sheet.getDataRange().getValues();
    const productsJson = data.slice(1).map(row => {
      let obj = {};
      data[0].forEach((h, i) => obj[h.toString().trim()] = row[i]);
      return obj;
    });

    let announcementText = "";
    const announceSheet = ss.getSheetByName("Announcement");
    if (announceSheet) announcementText = announceSheet.getRange("A2").getValue();

    return ContentService.createTextOutput(JSON.stringify({ products: productsJson, announcement: announcementText }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.token || data.token !== EXPECTED_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ status: "forbidden" })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const orderSheet = ss.getSheetByName("Weborder") || ss.insertSheet("Weborder");

    // ---------------------------------------------------------
    // (A) Python Bot မှ ပြီးစီးကြောင်း/ငြင်းပယ်ကြောင်း လှမ်းပို့လာလျှင် (Webhook အစား)
    // ---------------------------------------------------------
    if (data.type === "update_order") {
      const rows = orderSheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.orderId) {
          orderSheet.getRange(i + 1, 13).setValue(data.status); // Done သို့မဟုတ် Failed
          orderSheet.getRange(i + 1, 15).setValue(data.resultData);
          
          updateFirebaseOrder(data.orderId, data.status === "Failed" ? "Failed" : "Completed", data.resultData);
          
          if (data.status !== "Failed") {
            sendCompletionEmail(rows[i][1], rows[i][2], rows[i][4], rows[i][5], rows[i][3], rows[i][6], data.resultData);
          }
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "updated" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ---------------------------------------------------------
    // (B) Website မှ အော်ဒါအသစ် ဝင်လာခြင်း
    // ---------------------------------------------------------
    if (data.type === "new_order") {
      let totalCost = 0;
      orderSheet.appendRow([
        data.orderId || "-", data.userGmail || "-", data.userName || "-", data.userPhone || "-",
        data.product || "-", data.plan || "-", Number(data.price) || 0, totalCost, (Number(data.price) || 0) - totalCost,
        data.paymentMethod || "-", data.contact || "-", data.payImage || "", "Pending", new Date().toLocaleString('en-GB'), ""
      ]);

      sendTelegramNotiWithButtons(data, Number(data.price) || 0, (Number(data.price) || 0) - totalCost);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 🔥 Firebase သို့ Update လှမ်းလုပ်ခြင်း
function updateFirebaseOrder(orderId, newStatus, resultData) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/artifacts/${FIREBASE_PROJECT_ID}/public/data/orders/${orderId}?updateMask.fieldPaths=status&updateMask.fieldPaths=result&key=${FIREBASE_API_KEY}`;
  try {
    UrlFetchApp.fetch(url, { method: "patch", contentType: "application/json", payload: JSON.stringify({ fields: { status: { stringValue: newStatus }, result: { stringValue: resultData } } }), muteHttpExceptions: true });
  } catch (err) {}
}

// Telegram သို့ Noti ပို့ခြင်း (Prefix နှင့် Manual/Reject ခလုတ်များ)
function sendTelegramNotiWithButtons(data, sellingPrice, profit) {
  const escapeHTML = (str) => str ? str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "-";
  
  let rawPrefix = data.prefix || data.Prefix || data.PREFIX || "";
  let prefix = escapeHTML(rawPrefix.toString().trim() === "-" || !rawPrefix ? "" : rawPrefix);

  let msg = `<b>🛍 New Web Order Received!</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `🆔 <b>Order ID:</b> <code>${data.orderId}</code>\n`; 
  msg += `👤 <b>Customer:</b> ${escapeHTML(data.userName)}\n`;
  msg += `📧 <b>Gmail:</b> ${escapeHTML(data.userGmail)}\n`;
  msg += `📦 <b>Products:</b> ${escapeHTML(data.product)}\n`;
  msg += `🏷 <b>Plan:</b> <code>${escapeHTML(data.plan)}</code>\n`;
  
  if (prefix && prefix !== "-") {
    msg += `📌 <b>Prefix:</b> <code>${prefix}</code>\n`;
  }

  msg += `💰 <b>Total:</b> ${sellingPrice.toLocaleString()} Ks\n`;
  msg += `💳 <b>Payment:</b> ${escapeHTML(data.paymentMethod)}\n`;
  msg += `📱 <b>Phone:</b> <code>${escapeHTML(data.userPhone)}</code>\n`;
  msg += `📝 <b>Info:</b>\n<code>${escapeHTML(data.contact)}</code>\n`;
  msg += `━━━━━━━━━━━━━━━━━━`;

  if (data.payImage) {
    msg += `\n🖼 <a href='${data.payImage}'>View Payment Receipt</a>`;
  }

  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: msg,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🤝 ကိုယ်တိုင် ကိုင်တွယ်မည် (Manual)", callback_data: "web_accept_" + data.orderId },
          { text: "❌ ငြင်းပယ်မည် (Reject)", callback_data: "rej_" + data.orderId }
        ]
      ]
    }
  };

  try {
    UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage", {
      method: "post", contentType: "application/json", payload: JSON.stringify(payload)
    });
  } catch (err) {}
}

// ဝယ်သူဆီ Gmail ပို့ခြင်း
function sendCompletionEmail(email, name, product, plan, contact, price, details) {
  if (email && email.includes("@")) {
    MailApp.sendEmail({ to: email, subject: "MM Tech Store - Order Completed ✅", htmlBody: `<h3>🛍 Order Completed!</h3><p>လူကြီးမင်း ဝယ်ယူထားသော <b>${product}</b> ဆောင်ရွက်ပြီးစီးပါပြီဗျ။</p><p><b>🔑 Account Details / Code:</b></p><pre>${details}</pre>` });
  }
}

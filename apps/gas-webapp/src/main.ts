export function doGet() {
  return HtmlService.createHtmlOutputFromFile("index").setTitle("GAS Web App");
}

export function doPost(_e: GoogleAppsScript.Events.DoPost) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// biome-ignore lint/correctness/noUnusedVariables: Called by GAS via google.script.run (protected by globals config)
function getData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  return sheet.getDataRange().getValues();
}

// biome-ignore lint/correctness/noUnusedVariables: Called by GAS via google.script.run (protected by globals config)
function saveData(data: string[][]) {
  if (data.length === 0 || data[0]?.length === 0) {
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

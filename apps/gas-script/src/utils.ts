export function formatDate(date: Date): string {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

export function showToast(message: string, title = "Info"): void {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title, 3);
}

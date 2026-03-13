import { formatDate, showToast } from "./utils";

export function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("GAS Tools")
    .addItem("Show timestamp", "showTimestamp")
    .addItem("Say hello", "sayHello")
    .addToUi();
}

export function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  const range = e.range;
  Logger.log(`Cell ${range.getA1Notation()} edited to: ${range.getValue()}`);
}

export function showTimestamp(): void {
  const now = new Date();
  showToast(formatDate(now), "Current Time");
}

export function sayHello(): void {
  showToast("Hello from gas-vite-plugin!", "Greeting");
}

export function doGet(): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput("gas-script is running");
}

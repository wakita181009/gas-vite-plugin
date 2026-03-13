export function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Test Menu").addItem("Say Hello", "sayHello").addToUi();
}

export function sayHello() {
  SpreadsheetApp.getActiveSpreadsheet().toast("Hello from gas-vite-plugin!");
}

export function doGet() {
  return ContentService.createTextOutput("gas-test is running");
}

//#region src/main.ts
function onOpen() {
	SpreadsheetApp.getUi().createMenu("Test Menu").addItem("Say Hello", "sayHello").addToUi();
}
function sayHello() {
	SpreadsheetApp.getActiveSpreadsheet().toast("Hello from gas-vite-plugin!");
}
function doGet() {
	return ContentService.createTextOutput("gas-test is running");
}
//#endregion

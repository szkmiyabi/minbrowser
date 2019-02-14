const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const fs = require("fs");
const { Menu } = require("electron");

const presvUtil = require(__dirname + "/assets/js/presvUtil");
let mainWindow;

const template = [
    {
        label: "Edit",
        submenu: [
            {role: "undo"},
            {role: "redo"},
            {role: "separator"},
            {role: "cut"},
            {role: "copy"},
            {role: "paste"},
            {role: "pasteandmatchstyle"},
            {role: "delete"},
            {role: "selectall"}
        ]
    },
    {
        label: "View",
        submenu: [
            {role: "reload"},
            {role: "forceload"},
            {role: "toggledevtools"},
            {type: "separator"},
            {role: "resetzoom"},
            {role: "zoomin"},
            {role: "zoomout"},
            {type: "separator"},
            {role: "togglefullscreen"}
        ]
    },
    {
        role: "window",
        submenu: [
            {role: "minimize"},
            {role: "close"}
        ]
    }
];

function createWindow() {

   mainWindow = new BrowserWindow({ width: 1024, height: 768});
   mainWindow.loadURL("file://" + __dirname + "/index.html");
   //mainWindow.toggleDevTools();
   //const menu = Menu.buildFromTemplate(template);
   Menu.setApplicationMenu(null);
}

app.on("ready", () => {
    createWindow();
    const {ipcMain} = require("electron");
    ipcMain.on('w3cButton-click', (event, arg) => {
        let w3cWindow = new BrowserWindow({width: 1024, height: 768});
        w3cWindow.loadURL(arg.winurl);
        //w3cWindow.webContents.toggleDevTools();
        w3cWindow.webContents.on("did-finish-load", () => {
            w3cWindow.webContents.executeJavaScript(presvUtil.w3c_report());
        });
    });
    ipcMain.on("reply", (event, arg) => {
        let argval = arg.reptext;
        argval = argval.replace(/<my:br>/g, "\r\n");
        require("electron").clipboard.writeText(argval);
    });
    ipcMain.on("ccButton-click", (event, arg) => {
        let ccWindow = new BrowserWindow({width: 1024, height: 768});
        ccWindow.loadURL(arg.winurl);
        ccWindow.webContents.on("did-finish-load", () => {
            ccWindow.webContents.executeJavaScript(presvUtil.css_cut());
        });
    });
    ipcMain.on("cc-reply", (event, arg) => {
        console.log("complete");
    });
});
app.on("window-all-closed", () => {
   if(process.platform !== "darwin") {
        app.quit();
   }
});
app.on("activate", () => {
    if(mainWindow === null) {
        createWindow();
    }
});
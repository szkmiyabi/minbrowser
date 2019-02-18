const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const fs = require("fs");
const { Menu } = require("electron");
const { ipcMain } = require("electron");
const { clipboard } = require("electron");

const presvUtil = require(__dirname + "/assets/js/presvUtil");
let mainWindow;
let w3cWindow = null;
let presvWindow = null;
let brWindow = null;

const tmenu = Menu.buildFromTemplate([
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
]);

const rmenu = Menu.buildFromTemplate([
    {
        label: "DevToolを開く",
        click: () => {
            let crWindow = BrowserWindow.getFocusedWindow();
            crWindow.webContents.toggleDevTools();
        }
    },
    {
        label: "戻る",
        click: () => {
            let crWindow = BrowserWindow.getFocusedWindow();
            if(crWindow.webContents.canGoBack()) {
                crWindow.webContents.goBack();
            }
        }
    },
    {
        label: "進む",
        click: () => {
            let crWindow = BrowserWindow.getFocusedWindow();
            if(crWindow.webContents.canGoForward()) {
                crWindow.webContents.goForward();
            }
        }
    },
    {
        label: "再読み込み",
        click: () => {
            let crWindow = BrowserWindow.getFocusedWindow();
            crWindow.webContents.reload();
        }
    },
    {
        label: "ズーム200％にする",
        click: () => {
            let crWindow = BrowserWindow.getFocusedWindow();
            crWindow.webContents.setZoomFactor(2.0);
        }
    },
    {
        label: "ズーム100％に戻す",
        click: () => {
            let crWindow = BrowserWindow.getFocusedWindow();
            crWindow.webContents.setZoomFactor(1.0);
        }
    }
]);

function createWindow() {
   mainWindow = new BrowserWindow({ width: 1140, height: 740});
   mainWindow.loadURL("file://" + __dirname + "/index.html");
   //mainWindow.toggleDevTools();
   //Menu.setApplicationMenu(tmenu);
   Menu.setApplicationMenu(null);
}

app.on("ready", () => {
    createWindow();
    ipcMain.on('w3cButton-click', (event, arg) => {
        if(w3cWindow === null) {
            w3cWindow = new BrowserWindow({width: 1024, height:768});
            w3cWindow.on("closed", () => {w3cWindow = null});
            w3cWindow.loadURL(arg.winurl);
            //w3cWindow.webContents.toggleDevTools();
            w3cWindow.webContents.on("did-finish-load", () => {
                w3cWindow.webContents.executeJavaScript(presvUtil.w3c_report());
            });
        } else {
            let nowurl = w3cWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                w3cWindow.loadURL(arg.winurl);
                w3cWindow.webContents.on("did-finish-load", () => {
                    w3cWindow.webContents.executeJavaScript(presvUtil.w3c_report());
                });
            } else {
                w3cWindow.webContents.executeJavaScript(presvUtil.w3c_report());
            }
        }
    });
    ipcMain.on("reply", (event, arg) => {
        let argval = arg.reptext;
        argval = argval.replace(/<my:br>/g, "\r\n");
        clipboard.writeText(argval);
    });
    ipcMain.on("infoviewButton-click", (event, arg) => {
        let pageid = arg.viewno;
        let pageurl = arg.viewurl;
        clipboard.writeText(pageid + "\r\n" + pageurl);
    });
    ipcMain.on("ccButton-click", (event, arg) => {
        if(presvWindow === null) {
            presvWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null });
            presvWindow.loadURL(arg.winurl);
            presvWindow.webContents.on("did-finish-load", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.css_cut());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.loadURL(arg.winurl);
                presvWindow.webContents.on("did-finish-load", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.css_cut());
                });
            } else {            
                presvWindow.webContents.executeJavaScript(presvUtil.css_cut());
            }
        }
    });
    ipcMain.on("browseButton-click", (event, arg) => {
        if(brWindow === null) {
            brWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            brWindow.on("closed", () => { brWindow = null });
            brWindow.loadURL(arg.winurl);
        } else {
            let nowurl = brWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                brWindow.loadURL(arg.winurl);
            }
        }
    });
    ipcMain.on("altButton-click", (event, arg) => {
        if(presvWindow === null) {
            presvWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null });
            presvWindow.loadURL(arg.winurl);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("did-finish-load", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.image_alt());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.loadURL(arg.winurl);
                presvWindow.webContents.on("did-finish-load", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.image_alt());
                });
            } else {
                presvWindow.webContents.executeJavaScript(presvUtil.image_alt());
            }
        }
    });
    ipcMain.on("targetButton-click", (event, arg) => {
        if(presvWindow === null) {
            presvWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.loadURL(arg.winurl);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("did-finish-load", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.target_attr());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.loadURL(arg.winurl);
                presvWindow.webContents.on("did-finish-load", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.target_attr());
                });
            } else {
                presvWindow.webContents.executeJavaScript(presvUtil.target_attr());
            }
        }
    });
    ipcMain.on("target-reply", (event, arg) => {});
    ipcMain.on("structButton-click", (event, arg) => {
        if(presvWindow === null) {
            presvWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.loadURL(arg.winurl);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("did-finish-load", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.semantic_check());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.loadURL(arg.winurl);
                presvWindow.webContents.on("did-finish-load", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.semantic_check());
                });
            } else {
                presvWindow.webContents.executeJavaScript(presvUtil.semantic_check());
            }
        }
    });
    ipcMain.on("view-source-click", (event, arg) => {
        let srcWindow = new BrowserWindow({width: 1024, height: 768});
        srcWindow.on("closed", () => {srcWindow = null});
        srcWindow.loadURL("view-source:" + arg.winurl);
    });
    ipcMain.on("langButton-click", (event, arg) => {
        if(presvWindow === null) {
            presvWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.loadURL(arg.winurl);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("did-finish-load", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.lang_attr());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.loadURL(arg.winurl);
                presvWindow.webContents.on("did-finish-load", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.lang_attr());
                });
            } else {
                presvWindow.webContents.executeJavaScript(presvUtil.lang_attr());
            }
        }
    });

});

app.on("browser-window-created", (event, win) => {
    win.webContents.on("context-menu", (e, params) => {
        rmenu.popup(win, params.x, params.y);
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
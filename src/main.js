const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const fs = require("fs");
const { Menu } = require("electron");
const { ipcMain } = require("electron");
const { clipboard } = require("electron");
const { shell } = require("electron");

const presvUtil = require(__dirname + "/assets/js/presvUtil");
let mainWindow;
let w3cWindow = null;
let presvWindow = null;
let brWindow = null;
let frmWindow = null;

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
        label: "フォーム調査",
        submenu: [
            {
                label: "半角文字を注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "ABCDEFGabcdefg_9999-12-31"
                    ));
                }
            },
            {
                label: "全角文字を注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "あいうえおＡＩＵＥＯａｉｕｅｏ９９９９年１２月３１日"
                    ));
                }
            },
            {
                label: "メールアドレス(半角)を注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "hoge@sample.net"
                    ));
                }
            },
            {
                label: "メールアドレス(全角)を注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "ｈｏｇｅ＠ｓａｍｐｌｅ．ｃｏｍ"
                    ));
                }
            },
            {
                label: "電話番号(半角)を注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "090-0799-0000"
                    ));
                }
            },
            {
                label: "電話番号(全角)を注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "０９０ー０７７９ー００００"
                    ));
                }
            },
            {
                label: "住所を注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "邪馬台県架空野市なでしこ町12ｰ1"
                    ));
                }
            },
            {
                label: "氏名/ふりがなを注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "阿波　太郎/あわ　たろう"
                    ));
                }
            },
            {
                label: "文字を大量注入(200文字)",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_bigtext());
                } 
            }
        ]
    },
    {
        label: "ズーム",
        submenu: [
            {
                label: "200％にする",
                click: () => {
                    let crWindow = BrowserWindow.getFocusedWindow();
                    crWindow.webContents.setZoomFactor(2.0);
                }
            },
            {
                label: "100％に戻す",
                click: () => {
                    let crWindow = BrowserWindow.getFocusedWindow();
                    crWindow.webContents.setZoomFactor(1.0);
                }
            }
        ]
    },

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
    ipcMain.on("labelAndTitleButton-click", (event, arg) => {
        if(presvWindow === null) {
            presvWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.loadURL(arg.winurl);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("did-finish-load", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.tag_label_and_title_attr());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.loadURL(arg.winurl);
                presvWindow.webContents.on("did-finish-load", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.tag_label_and_title_attr());
                });
            } else {
                presvWindow.webContents.executeJavaScript(presvUtil.tag_label_and_title_attr());
            }
        }
    });
    ipcMain.on("documentLinkButton-click", (event, arg) => {
        if(presvWindow === null) {
            presvWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.loadURL(arg.winurl);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("did-finish-load", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.document_link());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.loadURL(arg.winurl);
                presvWindow.webContents.on("did-finish-load", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.document_link());
                });
            } else {
                presvWindow.webContents.executeJavaScript(presvUtil.document_link());
            }
        }
    });

    ipcMain.on("view-source-click", (event, arg) => {
        let srcWindow = new BrowserWindow({width: 1024, height: 768});
        srcWindow.on("closed", () => {srcWindow = null});
        srcWindow.loadURL("view-source:" + arg.winurl);
    });
    ipcMain.on("view-new-window-click", (event, arg) => {
        shell.openExternal(arg.winurl);
    });
    ipcMain.on("save-pdf-click", (event, arg) => {
        let pdfSaveWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
        pdfSaveWindow.on("closed", () => {pdfSaveWindow = null});
        pdfSaveWindow.loadURL(arg.winurl);
        pdfSaveWindow.webContents.on("did-finish-load", () => {
            require("electron").dialog.showSaveDialog(
                pdfSaveWindow,
                {
                    properties: ["openFile"],
                    filters: [{
                        name: "Documents",
                        extensions: ["pdf"]
                    }]
                },
                (fileName) => {
                    if(fileName) {
                        pdfSaveWindow.webContents.printToPDF({}, (error, data) => {
                            fs.writeFile(fileName, data, (error) => {
                                let ok_msg_opt = {type:"none", buttons:["OK"], message:"", detail:"表示中のページをPDFに保存しました!"};
                                let fail_msg_opt = {type:"warning",buttons:["OK"], message:"", detail:"保存に失敗しました!"};
                                if(error) {
                                    require("electron").dialog.showMessageBox(pdfSaveWindow, fail_msg_opt);
                                } else {
                                    require("electron").dialog.showMessageBox(pdfSaveWindow, ok_msg_opt);
                                    pdfSaveWindow.destroy();
                                }
                            })
                        })
                    }
                }
            );
        });
    });
    ipcMain.on("operation-new-window-click", (event, arg) => {
        if(presvWindow === null) {
            presvWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.loadURL(arg.winurl);
            //presvWindow.webContents.toggleDevTools();
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.loadURL(arg.winurl);
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
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const fs = require("fs");
const { Menu } = require("electron");
const { ipcMain } = require("electron");
const { clipboard } = require("electron");
const { shell } = require("electron");
const path = require("path");

const presvUtil = require(__dirname + "/assets/js/presvUtil");
let mainWindow;
let w3cWindow = null;
let presvWindow = null;
let srcWindow = null;

let authWindow;
let loginCallBack;

let winPos = null;
const winPosXMargin = 60;
const winPosYMargin = 65;
let winDataPath = path.join(app.getPath("userData"), "win-bounds.json");
let winSize = null;
let childWinSize = null;

const tmenu = Menu.buildFromTemplate([
    {
        label: "Application",
        submenu: [
            {
                label: "About Application",
                selector: "orderFrontStandardAboutPanel:"
            },
            {
                type: "separator"
            },
            {
                label: "Quit",
                accelerator: "Command+Q",
                click: () => { app.quit(); }
            }
        ]
    },
    {
        label: "Edit",
        submenu: [
            {
                label: "Undo",
                accelerator: "CmdOrCtrl+Z",
                selector: "undo:"
            },
            {
                label: "Redo",
                accelerator: "Shift+CmdOrCtrl+Z",
                selector: "redo:"
            },
            { type: "separator" },
            {
                label: "Cut",
                accelerator: "CmdOrCtrl+X",
                selector: "cut:"
            },
            {
                label: "Copy",
                accelerator: "CmdOrCtrl+C",
                selector: "copy:"
            },
            {
                label: "Paste",
                accelerator: "CmdOrCtrl+V",
                selector: "paste:"
            },
            {
                label: "Select All",
                accelerator: "CmdOrCtrl+A",
                selector: "selectAll:"
            }
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
        type: "separator"
    },
    {
        label: "切り取り",
        role: "cut",
        accelerator: "CmdOrCtrl+X"
        
    },
    {
        label: "コピー",
        role: "copy",
        accelerator: "CmdOrCtrl+C"
    },
    {
        label: "貼り付け",
        role: "paste",
        accelerator: "CmdOrCtrl+V"
    },
    {
        label: "全て選択",
        role: "selectall",
        accelerator: "CmdOrCtrl+A"
    },
    {
        type: "separator"
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
            },
            {
                label: "フォーム送信テストお詫び文注入",
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(presvUtil.form_insert_testdata(
                        "これはフォームの動作確認のため送信しました。ご了承ください。"
                    ));
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
    {
        type: "separator"
    },
    {
        label: "このページをPDFに保存する",
        click: () => {
            let crWindow = BrowserWindow.getFocusedWindow();
            require("electron").dialog.showSaveDialog(
                crWindow,
                {
                    properties: ["openFile"],
                    filters: [{
                        name: "Documents",
                        extensions: ["pdf"]
                    }]
                },
                (fileName) => {
                    if(fileName) {
                        crWindow.webContents.printToPDF({
                            marginsType: 2,
                            pageSize: "A4",
                            printBackground: true
                        }, (error, data) => {
                            fs.writeFile(fileName, data, (error) => {
                                let ok_msg_opt = {type:"none", buttons:["OK"], message:"", detail:"表示中のページをPDFに保存しました!"};
                                let fail_msg_opt = {type:"warning", buttons:["OK"], message:"", detail:"保存に失敗しました!"};
                                if(error) {
                                    require("electron").dialog.showMessageBox(crWindow, fail_msg_opt);
                                } else {
                                    require("electron").dialog.showMessageBox(crWindow, ok_msg_opt);
                                }
                            })
                        })
                    }
                }
            )
        }
    },
    {
        label: "このページを画像に保存する",
        click: () => {
            let crWindow = BrowserWindow.getFocusedWindow();
            require("electron").dialog.showSaveDialog(
                crWindow,
                {
                    properties: ["openFile"],
                    filters: [{
                        name: "PNG Image",
                        extensions: ["png"]
                    }]
                },
                (fileName) => {
                    if(fileName) {
                        crWindow.webContents.capturePage((image) => {
                            fs.writeFile(fileName, image.toPNG(), (error) => {
                                let ok_msg_opt = {type:"none", buttons:["OK"], message:"", detail:"表示中のページを画像に保存しました!"};
                                let fail_msg_opt = {type:"warning", buttons:["OK"], message:"", detail:"保存に失敗しました!"};
                                if(error) {
                                    require("electron").dialog.showMessageBox(crWindow, fail_msg_opt);
                                } else {
                                    require("electron").dialog.showMessageBox(crWindow, ok_msg_opt);
                                }
                            })
                        })
                    }
                }
            )
        }
    }

]);

function createWindow() {
    fetchWindowSize();
    let sz = JSON.parse(winSize);
    mainWindow = new BrowserWindow({ width: sz["width"], height: sz["height"]});
    try { mainWindow.setPosition(sz["x"], sz["y"]); } catch(e) {}
    mainWindow.loadURL("file://" + __dirname + "/index.html");
    try {
        winPos = BrowserWindow.getFocusedWindow().getPosition();
    } catch(e) {
        winPos = [20, 20];
    }
    //mainWindow.toggleDevTools();
    if(process.platform === "darwin") {
        Menu.setApplicationMenu(tmenu);
    } else {
        Menu.setApplicationMenu(null);
    }
    mainWindow.on("close", () => {
        try {
            let winSizeTmp = BrowserWindow.getFocusedWindow().getBounds();
            if(winSizeTmp !== null) winSize = winSizeTmp;
            fs.writeFileSync(winDataPath, JSON.stringify(winSize));
        } catch(e) {}
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    mainWindow.on("move", () => {
        try {
            let winPosTmp = BrowserWindow.getFocusedWindow().getPosition();
            if(winPosTmp !== null) winPos = winPosTmp;
        } catch(e) {}
    });
}

function fetchWindowPos() {
    let x = winPos[0];
    let y = winPos[1];
    return [x + winPosXMargin, y + winPosYMargin]; 
}

function fetchWindowSize() {
    try {
        winSize = fs.readFileSync(winDataPath, "utf8");
    } catch(e) {
        winSize = JSON.stringify({width: 1140, height: 740});
    }
}

function fetchChildWindowSize() {
    if(childWinSize === null) {
        let psz = JSON.parse(winSize);
        childWinSize = JSON.stringify({width: psz["width"], height: psz["height"]});
    }
}

app.on("ready", () => {
    createWindow();

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
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null });
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            presvWindow.webContents.on("dom-ready", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.css_cut());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.focus();
                presvWindow.loadURL(arg.winurl);
                presvWindow.webContents.on("dom-ready", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.css_cut());
                });
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();      
                presvWindow.webContents.executeJavaScript(presvUtil.css_cut());
            }
        }
    });
    ipcMain.on("altButton-click", (event, arg) => {
        if(presvWindow === null) {
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null });
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("dom-ready", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.image_alt());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.loadURL(arg.winurl);
                presvWindow.focus();
                presvWindow.webContents.on("dom-ready", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.image_alt());
                });
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();
                presvWindow.webContents.executeJavaScript(presvUtil.image_alt());
            }
        }
    });
    ipcMain.on("targetButton-click", (event, arg) => {
        if(presvWindow === null) {
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("dom-ready", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.target_attr());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.loadURL(arg.winurl);
                presvWindow.focus();
                presvWindow.webContents.on("dom-ready", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.target_attr());
                });
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();
                presvWindow.webContents.executeJavaScript(presvUtil.target_attr());
            }
        }
    });
    ipcMain.on("structButton-click", (event, arg) => {
        if(presvWindow === null) {
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("dom-ready", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.semantic_check());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.loadURL(arg.winurl);
                presvWindow.focus();
                presvWindow.webContents.on("dom-ready", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.semantic_check());
                });
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();
                presvWindow.webContents.executeJavaScript(presvUtil.semantic_check());
            }
        }
    });
    ipcMain.on("ariaButton-click", (event, arg) => {
        if(presvWindow === null) {
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("dom-ready", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.aria_check());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.loadURL(arg.winurl);
                presvWindow.focus();
                presvWindow.webContents.on("dom-ready", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.aria_check());
                });
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();
                presvWindow.webContents.executeJavaScript(presvUtil.aria_check());
            }
        }
    });
    ipcMain.on("langButton-click", (event, arg) => {
        if(presvWindow === null) {
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("dom-ready", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.lang_attr());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.loadURL(arg.winurl);
                presvWindow.focus();
                presvWindow.webContents.on("dom-ready", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.lang_attr());
                });
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();
                presvWindow.webContents.executeJavaScript(presvUtil.lang_attr());
            }
        }
    });
    ipcMain.on("labelAndTitleButton-click", (event, arg) => {
        if(presvWindow === null) {
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("dom-ready", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.tag_label_and_title_attr());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.loadURL(arg.winurl);
                presvWindow.focus();
                presvWindow.webContents.on("dom-ready", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.tag_label_and_title_attr());
                });
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();
                presvWindow.webContents.executeJavaScript(presvUtil.tag_label_and_title_attr());
            }
        }
    });
    ipcMain.on("documentLinkButton-click", (event, arg) => {
        if(presvWindow === null) {
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            //presvWindow.webContents.toggleDevTools();
            presvWindow.webContents.on("dom-ready", () => {
                presvWindow.webContents.executeJavaScript(presvUtil.document_link());
            });
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.loadURL(arg.winurl);
                presvWindow.focus();
                presvWindow.webContents.on("dom-ready", () => {
                    presvWindow.webContents.executeJavaScript(presvUtil.document_link());
                });
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();
                presvWindow.webContents.executeJavaScript(presvUtil.document_link());
            }
        }
    });

    ipcMain.on("view-source-click", (event, arg) => {
        if(srcWindow === null) {
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            srcWindow = new BrowserWindow({width: sz["width"], height: sz["height"]});
            srcWindow.on("closed", () => {srcWindow = null});
            srcWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            srcWindow.loadURL("view-source:" + arg.winurl);
            srcWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
        } else {
            srcWindow.focus();
            srcWindow.loadURL("view-source:" + arg.winurl);
        }
    });
    ipcMain.on("view-new-window-click", (event, arg) => {
        shell.openExternal(arg.winurl);
    });
    ipcMain.on("save-pdf-click", (event, arg) => {
        fetchChildWindowSize();
        let sz = JSON.parse(childWinSize);
        let pdfSaveWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
        pdfSaveWindow.on("closed", () => {pdfSaveWindow = null});
        pdfSaveWindow.on("resize", () => {
            let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
            if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
        });
        pdfSaveWindow.loadURL(arg.winurl);
        pdfSaveWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
        pdfSaveWindow.webContents.on("dom-ready", () => {
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
                        pdfSaveWindow.webContents.printToPDF({
                            marginsType: 2,
                            pageSize: "A4",
                            printBackground: true
                        }, (error, data) => {
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
            fetchChildWindowSize();
            let sz = JSON.parse(childWinSize);
            presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], backgroundColor: "#fff", webPreferences: { nodeIntegration: false }});
            presvWindow.on("closed", () => { presvWindow = null});
            presvWindow.on("resize", () => {
                let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
            });
            presvWindow.loadURL(arg.winurl);
            presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            //presvWindow.webContents.toggleDevTools();
        } else {
            let nowurl = presvWindow.webContents.getURL();
            if(nowurl != arg.winurl) {
                presvWindow.destroy();
                fetchChildWindowSize();
                let sz = JSON.parse(childWinSize);
                presvWindow = new BrowserWindow({width: sz["width"], height: sz["height"], webPreferences: { nodeIntegration: false }});
                presvWindow.on("closed", () => { presvWindow = null });
                presvWindow.on("resize", () => {
                    let childWinSizeTmp = JSON.stringify(BrowserWindow.getFocusedWindow().getBounds());
                    if(childWinSizeTmp !== null) childWinSize = childWinSizeTmp;
                });
                presvWindow.loadURL(arg.winurl);
                presvWindow.focus();
                presvWindow.setPosition(fetchWindowPos()[0], fetchWindowPos()[1]);
            } else {
                presvWindow.focus();
            }
        }
    });

    let promptResponse;
    ipcMain.on('prompt', function(eventRet, arg) {
        promptResponse = null
        var promptWindow = new BrowserWindow({
            width: 200,
            height: 100,
            show: false,
            resizable: false,
            movable: false,
            alwaysOnTop: true,
            frame: false
        });
        //promptWindow.setPosition(JSON.parse(winPos)[0], JSON.parse(winPos)[1]);
        arg.val = arg.val || '';
        const promptHtml = '<html lang="ja"><head><meta charset="utf-8">\
        <style>body {font-family: sans-serif;} button {float:right; margin-left: 10px;} label,input {margin-bottom: 10px; width: 100%; display:block;}\
        </style></head><body><label for="val">' + arg.title + '</label>\
        <input id="val" value="' + arg.val + '" autofocus />\
        <button onclick="require(\'electron\').ipcRenderer.send(\'prompt-response\', document.getElementById(\'val\').value);window.close()">Ok</button>\
        <button onclick="window.close()">Cancel</button></body></html>';
        promptWindow.loadURL('data:text/html,' + promptHtml)
        promptWindow.show()
        promptWindow.on('closed', function() {
            eventRet.returnValue = promptResponse;
            promptWindow = null;
        });
    });
    ipcMain.on('prompt-response', function(event, arg) {
        if (arg === ""){ arg = null }
        promptResponse = arg;
    });
    ipcMain.on("authorization", (event, arg) => {
        loginCallBack(arg.username, arg.password);
        authWindow.close();
    });

});

app.on("login", (event, webContents, request, authInfo, callback) => {
    event.preventDefault();
    let win = BrowserWindow.getFocusedWindow();
    authWindow = new BrowserWindow({
        width: 300,
        height: 200,
        parent: win,
        modal: true,
        frame: false
    });
    //authWindow.setPosition(JSON.parse(winPos)[0], JSON.parse(winPos)[1]);
    const authHtml = '<html lang="ja"><head><meta charset="utf-8">\
    <style>body{text-align:center;}input{margin:5px}button{margin-top:10px;border-radius:5px;}</style>\
    </head><body><h3>ログイン</h3>\
    <label>ユーザ名</label>\
    <input type="text" id="username" class="input"><br>\
    <label>パスワード</label>\
    <input type="password" id="password" class="input"><br>\
    <button id="auth" onclick="submit()">ログイン</button>\
    <button onclick="window.close()">キャンセル</button>\
    <script type="text/javascript">\
    const { ipcRenderer } = require("electron");\
    function submit() {\
      const username = document.querySelector("#username").value;\
      const password = document.querySelector("#password").value;\
      ipcRenderer.send("authorization", { username, password });\
    }\
    </script>\
    </body></html>';
    authWindow.loadURL('data:text/html,' + authHtml);
    loginCallBack = callback;
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
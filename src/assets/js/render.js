const { remote } = require("electron");
const { BrowserWindow, dialog, shell } = remote;
const fs = require("fs");
const readline = require("readline");

let urlArr = [];
let urlArrIdx = 0;
let urlFileOpened = false;

let registPageDatas = [];

let homeUrl = "https://www.google.co.jp";
const w3c_urlbase = "https://validator.w3.org/check?ss=1&uri=";

function getControlsHeight() {
    var controls = document.querySelector("#controls");
    if(controls) {
        return controls.offsetHeight;
    } else {
        return 0;
    }
}

function is_pdf_link(str) {
    str = str.toLowerCase();
    let pt = new RegExp(/.*\/*.+?\.pdf/);
    if(pt.test(str)) return true;
    else return false;
}

function initWebview() {
    var webview = document.querySelector("#webview");
    webview.addEventListener("dom-ready", updateUrlText);
    webview.addEventListener("new-window", (e) => {
        const protocol = require("url").parse(e.url).protocol;
        if(protocol === "http:" || protocol === "https:") {
            if(is_pdf_link(e.url)) {
                webview.stop();
                shell.openExternal(e.url);
            } else {
                let win = new BrowserWindow({width: 1024, height: 768, webPreferences: {nodeIntegration: false}});
                win.loadURL(e.url);
            }
        }
    });
    webview.addEventListener("will-navigate", (e) => {
        if(is_pdf_link(e.url)) {
            webview.stop();
            shell.openExternal(e.url);
        }
    });
    const Menu = require("electron").remote.Menu;
    const webviewRightMenu = Menu.buildFromTemplate([
        {
            label: "DevToolを開く",
            click: () => {
                webview.openDevTools();
            }
        },
        {
            label: "ソースコードを表示する",
            click: () => {
                var crWindow = BrowserWindow.getFocusedWindow();
                var crurl = webview.src;
                crWindow.webContents.executeJavaScript(`
                    require("electron").ipcRenderer.send("view-source-click",
                        JSON.parse(JSON.stringify({winurl: "${crurl}"}))
                    );
                `);
            }
        },
        {
            label: "動作検証ウィンドウを開く",
            click: () => {
                var crWindow = BrowserWindow.getFocusedWindow();
                var crurl = webview.src;
                crWindow.webContents.executeJavaScript(`
                    require("electron").ipcRenderer.send("operation-new-window-click",
                        JSON.parse(JSON.stringify({winurl: "${crurl}"}))
                    );
                `);
            }
        },
        {
            type: "separator"
        },
        {
            label: "既定のブラウザで開く",
            click: () => {
                var crWindow = BrowserWindow.getFocusedWindow();
                var crurl = webview.src;
                crWindow.webContents.executeJavaScript(`
                    require("electron").ipcRenderer.send("view-new-window-click",
                        JSON.parse(JSON.stringify({winurl: "${crurl}"}))
                    );
                `);
            }
        },
        {
            label: "再読み込み",
            click: () => {
                webview.reload();
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
            label: "ズーム",
            submenu: [
                {
                    label: "200％にする",
                    click: () => {
                        webview.setZoomFactor(2.0);
                    }
                },
                {
                    label: "100％に戻す",
                    click: () => {
                        webview.setZoomFactor(1.0);
                    }
                }
            ]
        },
        {
            label: "ページ情報",
            submenu: [
                {
                    label: "現在のURL＋ページタイトル登録",
                    click: () => {
                        let crurl = webview.src;
                        let crtitle = "";
                        crtitle = webview.getTitle();
                        let add_vl = crurl + "\t" + crtitle;
                        if(isExistsPageDatas(crurl)) {
                            alert("既に登録されているURLです!");
                            return;
                        }
                        registPageDatas.push(add_vl);
                    }
                },
                {
                    label: "現在のPID＋URL＋コメント登録",
                    click: () => {
                        let cmb = document.querySelector("#urlCombo");
                        let crpid = cmb.getElementsByTagName("option").item(cmb.selectedIndex).innerText;
                        let crurl = webview.src;
                        let comment = prompt("コメントを入力", "");
                        if(isExistsPageID(crurl)) {
                            let idx = getPageDatasMatchRow();
                            let old_vl = registPageDatas[idx];
                            let old_vl_cols = old_vl.split(/<bkmk:tab>/);
                            let new_vl = old_vl_cols[0] + "<bkmk:tab>" + old_vl_cols[1] + "<bkmk:tab>" + old_vl_cols[2] + "<bkmk:br>" + comment;
                            registPageDatas[idx] = new_vl;
                        } else {
                            let new_vl = crpid + "<bkmk:tab>" + crurl + "<bkmk:tab>" + comment;
                            registPageDatas.push(new_vl);
                        }
                    }
                },
                {
                    label: "データ保存",
                    click: () => {
                        savePageDatas();
                    }
                }
            ]
        },
        {
            label: "このページをPDFに保存する",
            click: () => {
                let webview = document.querySelector("webview");
                let crurl = webview.src;
                require("electron").ipcRenderer.send("save-pdf-click", {
                    winurl: crurl
                });
            }
        }
    
    ]);
    webview.addEventListener("context-menu", () => {
        webviewRightMenu.popup();
    });
}

function navigateTo(url) {
    document.querySelector("webview").src = url;
}

function updateUrlText() {
    document.getElementById("urlText").value = document.querySelector("webview").src;
}

function changeUrl() {
    var combo = document.querySelector("#urlCombo");
    var opts = combo.getElementsByTagName("option");
    var idx = 0;
    for(var i=0; i<opts.length; i++) {
        var op = opts.item(i);
        if(op.selected == true) {
            idx = i;
            break;
        }
    }
    urlArrIdx = idx;
    var newurl = urlArr[idx][1];
    navigateTo(newurl);
    document.querySelector("#urlText").value = newurl;
}

function enterUrlText() {
    document.querySelector("#urlText").addEventListener("keypress", (event) => {
        if(event.keyCode == 13) {
            let urltxt = document.querySelector("#urlText").value;
            let urlpt = new RegExp(/^(http.*:\/\/)/);
            if(urlpt.test(urltxt)) {
                navigateTo(urltxt);
            } else {
                alert("[" + urltxt + "]" + "は有効なURLではありません！");
            }
        }
    });
}

function devToolsKeyCommand() {
    Mousetrap.bind(["alt i","command i"], () => {
        webview.openDevTools();
    });
}

function _forceBlur() {
    if(document.activeElement) {
        document.activeElement.blur();
    }
}

function nextButton() {
    document.querySelector("#next").onclick = function() {
        _nextButtonCommand();
    };
    Mousetrap.bind(["alt a","command a"], () => {
        _forceBlur();
        _nextButtonCommand();
    });
}

function _nextButtonCommand() {
    var crIdx = urlArrIdx;
    crIdx++;
    if(crIdx == urlArr.length) {
        alert("これ以上進めません");
        return;
    }
    urlArrIdx = crIdx;
    var combo = document.querySelector("#urlCombo");
    combo.selectedIndex = crIdx;
    event = document.createEvent("HTMLEvents");
    event.initEvent("change", true, false);
    document.querySelector("#urlCombo").dispatchEvent(event);
}

function prevButton() {
    document.querySelector("#prev").onclick = function() {
        _prevButtonCommand();
    };
    Mousetrap.bind(["alt s","command s"], () => {
        _forceBlur();
        _prevButtonCommand();
    });
}

function _prevButtonCommand() {
    var crIdx = urlArrIdx;
    crIdx--;
    if(crIdx < 0) {
        alert("これ以上戻れません");
        return;
    }
    urlArrIdx = crIdx;
    var combo = document.querySelector("#urlCombo");
    combo.selectedIndex = crIdx;
    event = document.createEvent("HTMLEvents");
    event.initEvent("change", true, false);
    document.querySelector("#urlCombo").dispatchEvent(event);
}

function ungoButton() {
    var webview = document.querySelector("webview");
    document.querySelector("#ungo").addEventListener("click", () => {
        webview.goBack();
    });
}

function regoButton() {
    var webview = document.querySelector("webview");
    document.querySelector("#rego").addEventListener("click", () => {
        webview.goForward();
    });
}

function homeButton() {
    document.querySelector("#home").onclick = function() {
        navigateTo(homeUrl);
        document.querySelector("#urlText").value = homeUrl;
    };
}

function refetchButton() {
    document.querySelector("#refetch").onclick = function() {
        let cmb = document.querySelector("#urlCombo");
        if(urlArr.length > 0 && cmb.getElementsByTagName("option").length > 0) {
            changeUrl();
        } else {
            alert("URL一覧ファイルを選択していないため、再読み込みするページはありません！");
        }
    };
}

function cssCutButton() {
    document.querySelector("#csscut").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("ccButton-click", {
            winurl: crurl
        });
    };
}

function altCheckButton() {
    document.querySelector("#altcheck").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("altButton-click", {
            winurl: crurl
        });
    };
}

function targetCheckButton() {
    document.querySelector("#targetcheck").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("targetButton-click", {
            winurl: crurl
        });
    };
}

function structCheckButton() {
    document.querySelector("#structcheck").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("structButton-click", {
            winurl: crurl
        });
    };
}

function ariaCheckButton() {
    document.querySelector("#ariacheck").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("ariaButton-click", {
            winurl: crurl
        });
    };
}

function infoButton() {
    document.querySelector("#infoview").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        let cmb = document.querySelector("#urlCombo");
        let cmbidx = cmb.selectedIndex;
        let crno = cmb.getElementsByTagName("option")[cmbidx].innerText;
        require("electron").ipcRenderer.send("infoviewButton-click", {
            viewno: crno, viewurl: crurl,
        });
    }
}

function langButton() {
    document.querySelector("#langcheck").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("langButton-click", {
            winurl: crurl
        });
    };
}

function labelAndTitleButton() {
    document.querySelector("#label-and-title-check").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("labelAndTitleButton-click", {
            winurl: crurl
        });
    };
}

function documentLinkButton() {
    document.querySelector("#documentlink").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("documentLinkButton-click", {
            winurl: crurl
        });
    };
}

function operationNewWindowButton() {
    document.querySelector("#operation-new-window").onclick = function() {
        var crWindow = BrowserWindow.getFocusedWindow();
        var crurl = webview.src;
        crWindow.webContents.executeJavaScript(`
            require("electron").ipcRenderer.send("operation-new-window-click",
                JSON.parse(JSON.stringify({winurl: "${crurl}"}))
            );
        `);
    };
}

function openButton() {
    document.getElementById("open").addEventListener("click", () => {
        resetUrlCombo();
        openFile();
    });
    Mousetrap.bind(["ctrl+o","command+o"], () => {
        _forceBlur();
        resetUrlCombo();
        openFile();
    });
}

function openFile() {
    const win = BrowserWindow.getFocusedWindow();
    dialog.showOpenDialog(
        win,
        {
            properties: ["openFile"],
            filters: [{
                name: "Documents",
                extensions: ["txt"]
            }]
        },
        (fileNames) => {
            if(fileNames) {
                loadToUrlArr(fileNames[0]);
            }
        }
    );
}

function loadToUrlArr(path) {
    var stream = fs.createReadStream(path, "utf8");
    var reader = readline.createInterface({input: stream});
    reader.on("line", (data) => {
        var idx = urlArr.length;
        urlArr[idx] = data.split("\t");
    }).on("close", () => {
        createUrlCombo();
    });
}

function createUrlCombo() {
    if(validate_urlArr(urlArr) === false) {
        const win = BrowserWindow.getFocusedWindow();
        dialog.showMessageBox(
            win,
            {
                type: "warning",
                buttons: ["OK"],
                message: "ファイルのロードに失敗しました！",
                detail: "URLファイルを開けません。ファイルが間違っていないか確認してください。"
            }
        );
        urlArr = [];
        urlArrIdx = 0;
        return;
    }
    for(var i=0; i<urlArr.length; i++) {
        var row = urlArr[i];
        var elm = document.createElement("option");
        elm.innerText = row[0];
        document.querySelector("#urlCombo").appendChild(elm);
    }
    urlArrIdx = 0;
    var crurl = urlArr[urlArrIdx][1];
    navigateTo(crurl);
    document.querySelector("#urlText").value = crurl;
    document.querySelector("#urlCombo").onchange = function() {
        changeUrl();
    };
    urlFileOpened = true;
}

function resetUrlCombo() {
    if(urlFileOpened === true) {
        var cmb = document.querySelector("#urlCombo");
        if(cmb.getElementsByTagName("option").length > 0) {
             while(cmb.firstChild) {
                 cmb.removeChild(cmb.firstChild);
             }
             urlArr = [];
             urlArrIdx = 0;
        }
    }
}

function validate_urlArr() {
    let err_flg = false;
    let err_cnt = 0;
    let pid_pt = new RegExp(/^[a-zA-Z]+/);
    let purl_pt = new RegExp(/^http.*:\/\//);
    for(var i=0; i<urlArr.length; i++) {
        var tmp = urlArr[i];
        var v1 = tmp[0];
        var v2 = tmp[1];
        if(v1 === "" || (typeof v1) === "undefined" || pid_pt.test(v1) === false) {
            err_cnt++;
        }
        if(v2 === "" || (typeof v2) === "undefined" || purl_pt.test(v2) === false) {
            err_cnt++;
        }
    }
    if(err_cnt === 0) {
        err_flg = true;
    }
    return err_flg;
}

function isExistsPageID() {
    let cmb = document.querySelector("#urlCombo");
    let crpid = cmb.getElementsByTagName("option").item(cmb.selectedIndex).innerText;
    for(var i=0; i<registPageDatas.length; i++) {
        let row = registPageDatas[i];
        if(new RegExp("^" + crpid).test(row)) return true;
    }
    return false;
}

function getPageDatasMatchRow() {
    let idx = 0;
    let cmb = document.querySelector("#urlCombo");
    let crpid = cmb.getElementsByTagName("option").item(cmb.selectedIndex).innerText;
    for(var i=0; i<registPageDatas.length; i++) {
        let row = registPageDatas[i];
        if(new RegExp("^" + crpid).test(row)){
            idx = i;
            break;
        }
    }
    return idx;
}

function isExistsPageDatas(url) {
    for(var i=0; i<registPageDatas.length; i++) {
        let row = registPageDatas[i];
        row = row.replace(/\t/g, "");
        if(new RegExp(url).test(row)) return true;
    }
    return false;
}

function savePageDatas() {
    if(registPageDatas.length < 1) {
        alert("ページ情報が1件も登録されていません!");
        return;
    }
    let content = "";
    for(var i=0; i<registPageDatas.length; i++) {
        content += registPageDatas[i].toString() + "\r\n";
    }
    content = content.replace(/<bkmk:tab>/g, "\r\n");
    content = content.replace(/<bkmk:br>/g, "\r\n");
    const win = BrowserWindow.getFocusedWindow();
    dialog.showSaveDialog(
        win,
        {
            properties: ["openFile"],
            filters: [{
                name: "Documents",
                extensions: ["txt"]
            }]
        },
        (fileName) => {
            if(fileName) {
                fs.writeFile(fileName, content, (err) => {
                    if(err) {
                        alert("保存に失敗しました!");
                    } else {
                        alert("保存に成功しました!")
                    }
                })
            }
        }
    );
}
 




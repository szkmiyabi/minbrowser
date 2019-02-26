const { remote } = require("electron");
const { BrowserWindow, dialog, shell } = remote;
const fs = require("fs");
const readline = require("readline");
const PDFWindow = require("electron-pdf-window");

let urlArr = [];
let urlArrIdx = 0;
let urlFileOpened = false;

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
                let win = new BrowserWindow({width: 1024, height: 768});
                PDFWindow.addSupport(win);
                win.loadURL(e.url);
            } else {
                let win = new BrowserWindow({width: 1024, height: 768, webPreferences: {nodeIntegration: false}});
                win.loadURL(e.url);
            }
        }
    });
    webview.addEventListener("will-navigate", (e) => {
        if(is_pdf_link(e.url)) {
            webview.stop();
            let win = new BrowserWindow({width: 1024, height: 768});
            PDFWindow.addSupport(win);
            win.loadURL(e.url);
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
            label: "別ウィンドウで開く",
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
            label: "ズーム200％にする",
            click: () => {
                webview.setZoomFactor(2.0);
            }
        },
        {
            label: "ズーム100％に戻す",
            click: () => {
                webview.setZoomFactor(1.0);
            }
        },
        {
            label: "このページをPDFで保存する",
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

function nextButton() {
    document.querySelector("#next").onclick = function() {
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
    };
}

function prevButton() {
    document.querySelector("#prev").onclick = function() {
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
    };
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

function w3cButton() {
    document.querySelector("#w3c").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("w3cButton-click", {
            win: "w3cWin", winurl: w3c_urlbase + crurl
        });
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

function openButton() {
    document.getElementById("open").addEventListener("click", () => {
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
 




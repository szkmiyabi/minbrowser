const { remote } = require("electron");
const { BrowserWindow, dialog, shell } = remote;
const fs = require("fs");
const readline = require("readline");

let urlArr = [];
let urlArrIdx = 0;
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

function initWebview() {
    var webview = document.querySelector("#webview");
    webview.addEventListener("dom-ready", updateUrlText);
    webview.addEventListener("new-window", (e) => {
        const protocol = require("url").parse(e.url).protocol;
        if(protocol === "http:" || protocol === "https:") {
            let win = new BrowserWindow({width: 1024, height: 768});
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
    document.getElementById("#urlText").value = document.querySelector("webview").src;
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

function browseButton() {
    document.querySelector("#browse").onclick = function() {
        let crurl = document.querySelector("#urlText").value;
        require("electron").ipcRenderer.send("browseButton-click", {
            winurl: crurl
        });
    };
}

function openButton() {
    document.getElementById("open").addEventListener("click", () => {
        openFile();
        resetUrlCombo();
        createUrlCombo();
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
                createUrlDatas(fileNames[0]);
            }
        }
    );
}

function createUrlDatas(path) {
    var stream = fs.createReadStream(path, "utf8");
    var reader = readline.createInterface({input: stream});
    reader.on("line", (data) => {
        var idx = urlArr.length;
        urlArr[idx] = data.split("\t");
    }).on("close", createUrlCombo);
}

function resetUrlCombo() {
    var cmb = document.querySelector("#urlCombo");
    if(cmb.getElementsByTagName("option").length > 0) {
         while(cmb.firstChild) {
             cmb.removeChild(cmb.firstChild);
         }
         urlArr = [];
         urlArrIdx = 0;
    }
 }
 
 function createUrlCombo() {
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
 }
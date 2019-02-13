const { remote } = require("electron");
const { BrowserWindow, dialog, shell } = remote;
const fs = require("fs");
const readline = require("readline");
const proc = require("child_process");

let urlArr = [];
let urlArrIdx = 0;

const w3c_urlbase = "https://validator.w3.org/check?ss=1&group=1&verbose=1&uri=";

function webviewNewWindowInit() {
    var webview  = document.querySelector("webview");
    webview.addEventListener("new-window", (e) => {
        const protocol = require("url").parse(e.url).protocol;
        if(protocol === "http:" || protocol === "https:") {
            let win = new BrowserWindow({width: 1024, height: 768});
            win.loadURL(e.url);
        }
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
            navigateTo(document.querySelector("#urlText").value);
        }
    });
}

function resetUrlCombo() {
    if(document.querySelector("#urlCombo").getElementsByTagName("option").length > 0) {
        var opts = document.querySelector("#urlCombo").getElementsByTagName("option");
        for(var i=0; i<opts.length; i++) {
            var opt = opts.item(i);
            document.querySelector("#urlCombo").removeChild(opt);
        }
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

function resetUrlCombo() {
    urlArr = [];
    urlArrIdx = 0;
    
}

function getControlsHeight() {
    var controls = document.querySelector("#controls");
    if(controls) {
        return controls.offsetHeight;
    } else {
        return 0;
    }
}

function initWebview() {
    var webview = document.querySelector("webview");
    webview.addEventListener("dom-ready", updateUrlText);
}

function updateUrlText() {
    document.getElementById("urlText").value = webview.src;
}

function event_igniter(obj) {
    var event = document.createEvent("HTMLEvents");
    event.initEvent("change", true, false);
    obj.dispatchEvent(event);
};

function fontLargeButton() {
    var webview = document.querySelector("webview");
    document.querySelector("#f-large").onclick = function() {
        webview.setZoomFactor(2.0);
    };
}

function fontDefaultButton() {
    var webview = document.querySelector("webview");
    document.querySelector("#f-default").onclick = function() {
        webview.setZoomFactor(1.0);
    };
}

function devToolButton() {
    var webview = document.querySelector("webview");
    document.querySelector("#devtool").onclick = function() {
        webview.openDevTools();
    };
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

function w3cButton() {
    document.querySelector("#w3c").onclick = function() {
        var crurl = document.querySelector("#urlText").value;
        let win = new BrowserWindow({width: 1024, height: 768});
        win.loadURL(w3c_urlbase + crurl);
    };
}

function createUrlDatas(path) {
    var stream = fs.createReadStream(path, "utf8");
    var reader = readline.createInterface({input: stream});
    reader.on("line", (data) => {
        urlArr[urlArr.length] = data.split("\t");
    }).on("close", createUrlCombo);
}
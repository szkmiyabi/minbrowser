const { remote } = require("electron");
const { BrowserWindow, dialog, shell } = remote;
const fs = require("fs");
const readline = require("readline");

let urlArr = [];
let urlArrIdx = 0;

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
        urlArr[urlArr.length] = data.split("\t");
    }).on("close", createUrlCombo);
}
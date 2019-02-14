const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let path = require("path");
let fs = require("fs");

const { Menu } = require("electron");
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

if(process.platform === "darwin") {
    template.unshift({
        label: app.getName(),
        submenu: [
            {role: "about"},
            {type: "separator"},
            {role: "services", submenu: []},
            {type: "separator"},
            {role: "hide"},
            {role: "hideothers"},
            {role: "unhide"},
            {type: "separator"},
            {role: "quit"}
        ]
    });

    //Edit menu
    template[1].submenu.push(
        {type: "separator"},
        {
            label: "Speech",
            submenu: [
                {role: "startspeaking"},
                {role: "stopspeaking"}
            ]
        }
    );

    //Window menu
    template[3].submenu = [
        {role: "close"},
        {role: "minimize"},
        {role: "zoom"},
        {type: "separator"},
        {role: "front"}
    ]
}

let mainWindow;
let initPath;

function createWindow() {
    /*
    initPath = path.join(app.getPath("userData"), "init.json");
    var data;
    try {
        data = JSON.parse(fs.readFileSync(initPath, "utf8"));
    }
    catch(e) {
    }
    mainWindow = new BrowserWindow((data && data.bounds) ? data.bounds: {width: 1024, height:768, frame: false});
    */
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
            w3cWindow.webContents.executeJavaScript(`
                var str = "";
                var crurl = location.href;
                if(crurl.indexOf(".org/nu/") > 0) {
                    var rep_wrapper = document.getElementById("results");
                    var errcnt = 0;
                    var linept = new RegExp(/(From|At)( line )([0-9]+?)(,)/);
                    var inwrap = rep_wrapper.getElementsByTagName("ol")[0];
                    var rows = inwrap.getElementsByTagName("li");
                    for(var i=0; i<rows.length; i++) {
                        var row = rows.item(i);
                        var atr = row.getAttribute("class");
                        if(atr === "error") {
                            errcnt++;
                            var emsg = row.getElementsByTagName("p")[0].getElementsByTagName("span")[0].innerText;
                            var eline = row.getElementsByClassName("location")[0].getElementsByTagName("a")[0].innerText;
                            var elinestr = "";
                            if(linept.test(eline)) {
                                elinestr = eline.match(linept)[3];
                            }
                            elinestr += "行目";
                            var esrc = row.getElementsByClassName("extract")[0].getElementsByTagName("code")[0].innerText;
                            str += elinestr + "<my:br>" + emsg + "<my:br><my:br>" + esrc + "<my:br><my:br><my:br>";
                        }
                    }
                } else {
                    var rep_wrapper = document.getElementById("error_loop");
                    var errcnt = 0;
                    var linept = new RegExp(/(Line )([0-9]+?)(,)/);
                    var rows = rep_wrapper.getElementsByTagName("li");
                    for(var i=0; i<rows.length; i++) {
                        var row = rows.item(i);
                        var atr = row.getAttribute("class");
                        if(atr === "msg_err") {
                            errcnt++;
                            var eline = row.getElementsByTagName("em")[0].innerText;
                            var elinestr = "";
                            if(linept.test(eline)) {
                                elinestr = eline.match(linept)[2];
                            }
                            elinestr += "行目";
                            var emsg = row.getElementsByClassName("msg")[0].innerText;
                            var esrc = row.getElementsByTagName("pre")[0].getElementsByTagName("code")[0].innerText;
                            str += elinestr + "<my:br>" + emsg + "<my:br><my:br>" + esrc + "<my:br><my:br><my:br>";
                        }
                    }
                }
                var send_datas = JSON.parse(JSON.stringify({ reptext: str }));
                require("electron").ipcRenderer.send("reply", send_datas);
            `);
        });
    });
    ipcMain.on("reply", (event, arg) => {
        let argval = arg.reptext;
        argval = argval.replace(/<my:br>/g, "\r\n");
        require("electron").clipboard.writeText(argval);
    });
});
app.on("window-all-closed", () => {
    /*
    var data = {
        bounds: mainWindow.getBounds()
    };
    fs.writeFileSync(initPath, JSON.stringify(data));
    */
   if(process.platform !== "darwin") {
        app.quit();
   }
});
app.on("activate", () => {
    if(mainWindow === null) {
        createWindow();
    }
});
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
var path = require("path");
var fs = require("fs");

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
   //const menu = Menu.buildFromTemplate(template);
   Menu.setApplicationMenu(null);
}

app.on("ready", createWindow);
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
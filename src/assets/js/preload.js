const {ipcRenderer } = require("electron");

ipcRenderer.on("disp_ul", () => {
    var uls = document.getElementsByTagName("ul");
    for(var i=0; i<uls.length; i++) {
        var ul = urls.item(i);
        var style = "border: 2px solid red";
        ul.setAttribute("style", style);
    }
    ipcRenderer.sendTo(null);
});


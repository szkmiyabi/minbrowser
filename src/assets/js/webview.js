window.onresize = doLayout;

window.onload = function() {
    doLayout();
    initWebview();
    devToolsKeyCommand();
    openButton();
    homeButton();
    nextButton();
    prevButton();
    ungoButton();
    regoButton();
    enterUrlText();
    w3cButton();
    cssCutButton();
    altCheckButton();
    targetCheckButton();
    structCheckButton();
    infoButton();
    refetchButton();
    langButton();
    labelAndTitleButton();
    documentLinkButton();
};

window.prompt = function(title, val){
  return require("electron").ipcRenderer.sendSync('prompt', {title, val})
};

function doLayout() {
    var webview = document.querySelector("webview");
    var windowWidth = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;

    var controlsHeight = getControlsHeight();

    var webviewWidth = windowWidth;
    var webviewHeight = windowHeight - controlsHeight;

    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";
}
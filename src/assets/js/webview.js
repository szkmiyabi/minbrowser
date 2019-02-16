window.onresize = doLayout;

window.onload = function() {
    doLayout();
    initWebview();
    openButton();
    homeButton();
    nextButton();
    prevButton();
    ungoButton();
    regoButton();
    fontLargeButton();
    fontDefaultButton();
    enterUrlText();
    w3cButton();
    cssCutButton();
    altCheckButton();
    targetCheckButton();
    structCheckButton();
    infoButton();
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
window.onresize = doLayout;

onload = function() {
    doLayout();
    initWebview();
    homeButton();
    printButton();
    openButton();
    testButton();
    nextButton();
    prevButton();
    ungoButton();
    regoButton();
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
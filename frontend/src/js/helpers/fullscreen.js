var helper = require('./helper.js');
module.exports = (function () {
    
    function launchIntoFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    /*
    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
    
    
    function isFullscreen(){
        return !window.screenTop && !window.screenY;
    }
    */
    
    function addFullScreenButton(opt) {
        var widget = opt.widget,
            button = opt.button;
        
        
        function enterFullscreen() {
            launchIntoFullscreen(widget);
        }

        
        helper.addEventListener(button, 'click', enterFullscreen);
    }
    
    return {
        addFullScreenButton: addFullScreenButton //{widget, button}
    };
})();

//Michelle
//
//1. create a html page and drop the following code
//
//<span onclick="javascript:ATT.modal.showPopup()" style="background-image: url(images/att1716.jpg);">Text</span>
//
//
//
//2. create javascript file and drop the following code

var ATT = ATT || {};

/*
 * ATT.modal : based on ModalBox by Andrey Okonetchnikov
 *
 *
 */

ATT.isTouchDevice = function () {
    try {
        return ('ontouchstart' in document.documentElement);
    } catch (e) {
        return false;
    }
};

ATT.responsive = {};
ATT.responsive.mobileSize = 600;
ATT.responsive.isTouchDevice = ATT.isTouchDevice;
ATT.responsive.isResponsiveMobileSize = function () {
    var docWidth = $(document.body).getWidth();
    if (ATT.responsive.isResponsive && docWidth < ATT.responsive.mobileSize) {

        return true;
    }
    return false;
};

ATT.modal = {
        initialized: false,
        visible: false,
        options: {
            title: "Modal",
            content: "<div id='modal_loading'>You content will load shortly.</div>",
            footerContent: "", //optional
            width: 'auto',
            height: 'auto',
            overlayOpacity: .85, // Default overlay opacity
            overlayDuration: .25, // Default overlay fade in/out duration in seconds
            loadingString: "Please wait. Loading...", // Default loading string message
            ajaxUrl: '', // optional for ajax content
            params: {}, // optional params for ajax loaded content
            method: 'get', // Default Ajax request method
            closeButton: '',
            padding: 20, // optional, the minimum space between the modal and viewport
            keepInViewPort: false, // optional, set to true if the top cannot scroll +Y past padding setting, and bottom can't scroll -Y > padidng
            performOffset: false, // optional, centers modal in viewport taking into account scroll offset
            backgroundElements: [] //optional, specifies background elements to hide when the modal appears on touchscreen devices.  This is a hack to work around a bug in the Android < 4.0 browser
        },
        _position: {top: 0, left: 0},
        _moveEffect: undefined,
        _defaultOptions: new Object,
        _setOptions: function(options) {
            Object.prototype.extend = function(){
              this.options, options || {};  
            }
        },
        _init: function() {
            // add modal elements to dom
            this.modalOverlay = new Element("div", { id: "modal_overlay", opacity: "0" });
            this.modalOverlay.setStyle({opacity: 0}); // start at 0 to fade in, prevents flicker
            this.modalContainer = new Element("div", {id: "modal_container"});
            this.modalHeadlineContainer = new Element("div",{id:"modal_headline_container"}).update(this.options.title);
            this.modalContent = new Element("div",{id:"modal_content"}).update(this.options.content);
            if(this.options.footerContent != "") {
                this.modalFooter = new Element("div",{id:"modal_footer"}).update(this.options.footerContent);
            }

            $(document.body).insert({'top':this.modalOverlay});
            $(document.body).insert({'top':this.modalContainer});
            this.modalContainer.insert({'top':this.modalHeadlineContainer});
            this.modalContainer.insert({'bottom':this.modalContent});
            if(this.modalFooter) {
                this.modalContainer.insert({'bottom':this.modalFooter});
            }

            // for mobile devices fill screen with overlay
            if(typeof ATT.responsive != "undefined" && (ATT.responsive.isTouchDevice() || ATT.responsive.isResponsiveMobileSize())) {
                $("modal_overlay").setStyle({
                   width: ($(document.body).getWidth() * 10) + "px",
                   height: ($(document.body).getHeight() * 10) + "px"
                });
            }

            this._bindResize();
            this._bindCloseButton();

            this.initialized = true;

        },
        _calculatePosition: function () {
            var viewPort = document.viewport.getDimensions(),
            viewPortScrollOffset = document.viewport.getScrollOffsets(),
            positionLeft = Math.round((viewPort.width - this.modalWidth)/2) + viewPortScrollOffset.left,
            positionTop =  Math.round((viewPort.height - this.modalHeight)/2);

            if(this.options.performOffset === true) {
                positionTop += viewPortScrollOffset.top;
                if(positionTop < viewPortScrollOffset.top + this.options.padding )
                {
                    positionTop = viewPortScrollOffset.top + this.options.padding
                }
            }

            if (positionTop < this.options.padding) {
                positionTop = this.options.padding;
            }

            if (positionLeft < this.options.padding) {
                positionLeft = this.options.padding;
            }

            return {top: document.getElementById("oneclick1").offsetTop, left: positionLeft};   //
        },
        _setPosition: function (){
            if(this.options.width == 'fill') {
                $(this.modalContainer).setStyle({
                    margin: "3%",
                    left: "0px" ,
                    top: "0px"
                });
            } else {
                var position = this._calculatePosition();

                this._position.top = position.top;
                this._position.left = position.left;

                $(this.modalContainer).setStyle({
                    left: this._position.left + "px" ,
                    top: this._position.top + "px"
                });
            }


        },
        _keepInViewPort: function () {
            Event.observe(window, "scroll", function(){
                var activeElement = document.activeElement;
                if(activeElement.nodeType == 1 && activeElement.tagName.toLowerCase() == "input") {
                    return;
                }
                var viewPortDimensions = document.viewport.getDimensions(),
                    viewPortScrollOffset = document.viewport.getScrollOffsets(),
                    bottom = viewPortScrollOffset.top  + viewPortDimensions.height - this.options.padding;

                // handle top position, when it scrolls below viewport Top
                if(this._position.top > viewPortScrollOffset.top  + this.options.padding && this.modalHeight > viewPortDimensions.height) {
                    this._position.top = viewPortScrollOffset.top + this.options.padding;
                    this._updateEffect();
                // handle bottom position, when it scrolls above viewport bottom
                } else if(this._position.top + this.modalHeight < bottom && this.modalHeight > viewPortDimensions.height) {
                    this._position.top = this._position.top + (bottom - this.options.padding - (this._position.top+this.modalHeight));
                    this._updateEffect();
                // handle when modal is shorter than viewport, center vertically
                } else if ((this._position.top + this.modalHeight < bottom || this._position.top > viewPortScrollOffset.top  + this.options.padding) && this.modalHeight < viewPortDimensions.height) {
                    var centerPosition = this._calculatePosition();
                    this._updateEffect(centerPosition);
                }

                // handle when modal is horizontally off
                //console.log("width ", (this._position.left + this.modalWidth) ,"offset", viewPortScrollOffset.left);
                if(this.modalWidth < viewPortDimensions.width) {
                    var centerPosition = {top: this._position.top, left: Math.round((viewPortDimensions.width - this.modalWidth)/2) + viewPortScrollOffset.left};
                    this._updateEffect(centerPosition);
                }


            }.bind(this));
        },
        _updateEffect: function (position) {
            if(position) {
                this._position.left = position.left;
                this._position.top = position.top;
            }
            if(!this._moveEffect) {
                this._moveEffect = new Effect.Move(this.modalContainer, {
                    x: this._position.left,  y: this._position.top , mode: 'absolute'
                });
            } else {
                this._moveEffect.cancel();
                this._moveEffect = new Effect.Move(this.modalContainer, {
                    x: this._position.left,  y: this._position.top , mode: 'absolute'
                });
            }
        },
        _setSize: function () {
            if(this.options.width == 'fill') {
                /*var viewPortDimensions = document.viewport.getDimensions();
                var adjustedWidth = viewPortDimensions.width - (this.options.padding * 2);
                this.modalContainer.setStyle({
                    width: adjustedWidth + 'px'
                });*/
                this.modalContainer.setStyle({
                    width: "93%"
                });

            } else if(this.options.width != 'auto'){
                this.modalContainer.setStyle({
                    width: this.options.width + 'px'
                });
            } else {
                var modalWidth = this.modalContainer.getWidth() + (this.options.padding * 2),
                    viewPortDimensions = document.viewport.getDimensions();
                if(modalWidth >= viewPortDimensions.width){
                    var adjustedWidth = viewPortDimensions.width - (this.options.padding * 2);
                    this.modalContainer.setStyle({
                        width: adjustedWidth + 'px'
                    });
                } else {
                    this.modalContainer.setStyle({
                        width: 'auto'
                    });
                }
            }

            if(this.options.height == 'fill') {
                var viewPortDimensions = document.viewport.getDimensions();
                var adjustedHeight = viewPortDimensions.height - (this.options.padding * 2);
                this.modalContainer.setStyle({
                    height: adjustedHeight + 'px'
                });
                this.modalContent.setStyle({
                    height: adjustedHeight - this.modalHeadlineContainer.getHeight() - this.modalFooter.getHeight() + 'px'
                })
            } else if(this.options.height != 'auto'){
                this.modalContainer.setStyle({
                    height: this.options.height + 'px'
                });
            }

            this.modalHeight = Element.getHeight(this.modalContainer);
            this.modalWidth = Element.getWidth(this.modalContainer);
        },
        _bindResize: function () {
            if(typeof ATT.responsive != "undefined" && !ATT.responsive.isTouchDevice()) {
                Event.observe(window, "resize", this._setPosition.bind(this));
                Event.observe(window, "resize", this._setSize.bind(this));
            }
        },
        _show: function() {
            if(!this.visible) {
                new Effect.Fade(this.modalOverlay, {
                    from: 0,
                    to: this.options.overlayOpacity,
                    duration: this.options.overlayDuration
                });
            }

            this._handleCallback("eventModalShow");
            this.visible = true;

            if(typeof ATT.responsive !== "undefined" && ATT.responsive.isTouchDevice()) {
                ATT.util.hideAddressBar();
                this.options.backgroundElements.each(function(pageElement){
                    pageElement.hide();
                })
            }
        },
        _handleCallback: function(eventName) {
            if(this.options[eventName]) {
                var returnValue = this.options[eventName](); // Executing callback
                this.options[eventName] = null; // Removing callback after execution
                if(returnValue != undefined)
                    return returnValue;
                else
                    return true;
            }
            return true;
        },
        _bindCloseButton: function () {
            if ($(this.options.closeButton)) {
                $(this.options.closeButton).observe("click", this._close.bind(this));
            }
        },
        _close: function(event) {
            if(ATT.responsive.isTouchDevice()) {
                this.options.backgroundElements.each(function(pageElement){
                    pageElement.show();
                });
            }

            if(this.visible) {
                new Effect.Fade(this.modalContainer, {
                    from: 1,
                    to: 0,
                    duration: this.options.overlayDuration
                });
                new Effect.Fade(this.modalOverlay, {
                    from: this.options.overlayOpacity,
                    to: 0,
                    duration: this.options.overlayDuration,
                    afterFinish: this._removeElements.bind(this)
                });
            }
            if(typeof event !== 'undefined') {
                event.preventDefault();
            }

            this._handleCallback("eventModalClose");

            // reset options
            this.options.footerContent = ""
            this._setOptions(this._defaultOptions);


            this.initialized = false;
            this.visible = false;
        },
        _removeElements: function() {
            try {
                if(typeof this.modalFooter != "undefined" ) {
                    this.modalFooter.remove();
                    this.modalFooter = undefined;
                }
                this.modalOverlay.remove();
                this.modalContainer.remove();
            } catch(e) {
                // object already removed
            }
        },
        _loadAjaxContent: function() {

            new Ajax.Request( this.options.ajaxUrl, { method: this.options.method.toLowerCase(), parameters: this.options.params,
                onSuccess: function(transport) {
                    this.modalContent.update(transport.responseText);
                    this._setSize();
                    this._setPosition(true);
                    if(this.options.keepInViewPort === true) {
                        //this._keepInViewPort(); Kristin said not to do this, ever!
                    }
                    this._show();
                    this._handleCallback("eventAjaxContentLoaded");
                }.bind(this),
                onFailure: function(instance, exception){
                    this.modalContent.update("<p>I'm sorry, we were unable to load any content.</p>");
                    this._show();
                }.bind(this)
            });
        },
        _updateContent: function (options) {
            if(typeof options !==  "undefined") {
                // set custom options
                this._setOptions(options);
            }
            this.modalHeadlineContainer.update(this.options.title);
            this.modalContent = this.options.content;
        },
        rePosition: function() {
            this._setSize();
            this._setPosition();
        },
        close: function() {
           ATT.modal._close();
        },
        pop: function(options){

            this._handleCallback("eventModalOpen");

            // set default options for resetting
            Object.prototype.extend = function(){
                this._defaultOptions, this.options;
            };

            // set custom options
            this._setOptions(options);

            if(!this.initialized) {
                this._init();
            }

            if (this.options.ajaxUrl != '') {
                this._loadAjaxContent();
            } else {
                this._setSize();
                this._setPosition();
                this._show();
                if(this.options.keepInViewPort) {
                    //this._keepInViewPort();
                }
            }

            return this;
        } ,
        showPopup :  function()
        {
            var header = '<div id="miniTipModalHeader">' +
                            '<table><tr><td><img src="images/att.jpg"/></td>' +
                            '<td style="vertical-align:top;"><center><h3 style="color:black;font-family:Arial;font-size:16pt;align:center">AT&T One Click Share</h3>Share this page using your AT&T mobile number</center></td></tr>' +
                            '</table>' +
                            '<div id="closeButton"><a href="javascript:ATT.modal.close();" title="close"><span></span></a></div>' +
                            '</div>';
            var url ='https://auth-api.att.com/oauth/authorize?client_id=q7gwtawxz1praqfskwutsntdwwdfnj1u&response_type=code&scope=immn,oauth&redirect_uri=https://ldev.code-api-att.com/immn1click/immn.jsp';
            //var url ='https://auth-api.att.com/oauth/authorize?client_id=fk02vmpvsz4gwyo4iqxmzh04irq6mffh&response_type=code&scope=immn,oauth&redirect_uri=http://localhost:8080/immn/immn.jsp';

            var content = '<iframe id="contentFrame" src="'+ url  +'" width=450 height=350 scrolling="yes" frameborder="0"/></iframe>';
            this.pop({title:header,content:content,closeButton:'',performOffset:true});
            //this._keepInViewPort();
        },

        resizeIframeWidth: function (e) {
            // Set width of iframe according to its content
            if (e.Document && e.Document.body.scrollWidth) //ie5+ syntax
                e.width = e.contentWindow.document.body.scrollWidth;
            else if (e.contentDocument && e.contentDocument.body.scrollWidth) //ns6+ & opera syntax
                e.width = e.contentDocument.body.scrollWidth + 35;
            else (e.contentDocument && e.contentDocument.body.offsetWidth) //standards compliant syntax – ie8
                e.width = e.contentDocument.body.offsetWidth + 35;
        }

}

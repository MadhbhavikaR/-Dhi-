/*
 * Copyright 2017 SideeX committers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// HANDLERS
var typeTarget;
var typeLock = 0;
KURecorder.inputTypes = ["text", "password", "file", "datetime", "datetime-local", "date", "month", "time", "week", "number", "range", "email", "url", "search", "tel", "color"];
KURecorder.addEventHandler('type', 'change', function (event) {
    // © Chen-Chieh Ping, SideeX Team
    if (event.target.tagName && !preventType && typeLock == 0 && (typeLock = 1)) {
        // END
        var tagName = event.target.tagName.toLowerCase();
        var type = event.target.type;
        if ('input' == tagName && KURecorder.inputTypes.indexOf(type) >= 0) {
            if (event.target.value.length > 0) {
                this.processOnChangeTarget(event.target);

                // © Chen-Chieh Ping, SideeX Team
                if (enterTarget != null) {
                    this.processOnSendKeyTarget(enterTarget);
                    enterTarget = null;
                }
                // END
            }
        } else if ('textarea' == tagName) {
            this.processOnChangeTarget(event.target);
        }
    }
    typeLock = 0;
});


KURecorder.addEventHandler('type', 'input', function (event) {
    //console.log(event.target);
    typeTarget = event.target;
    this.processOnInputChangeTarget(typeTarget);
});


// © Chen-Chieh Ping, SideeX Team
KURecorder.addEventHandler('doubleClickAt', 'dblclick', function (event) {
    clearTimeout(this.waitUntilDoubleClickIsConfirmed);
    this.processOnDbClickTarget(event.target);
}, true);
// END

// © Chen-Chieh Ping, SideeX Team
var focusTarget = null;
var focusValue = null;
var tempValue = null;
var preventType = false;
var inp = document.getElementsByTagName("input");
for (var i = 0; i < inp.length; i++) {
    if (KURecorder.inputTypes.indexOf(inp[i].type) >= 0) {
        inp[i].addEventListener("focus", function (event) {
            focusTarget = event.target;
            focusValue = focusTarget.value;
            tempValue = focusValue;
            preventType = false;
        });
        inp[i].addEventListener("blur", function (event) {
            focusTarget = null;
            focusValue = null;
            tempValue = null;
        });
    }
}
// END

// © Chen-Chieh Ping, SideeX Team
var preventClick = false;
var enterTarget = null;
var enterValue = null;
var tabCheck = null;
KURecorder.addEventHandler('sendKeys', 'keydown', function (event) {
    if (event.target.tagName) {
        var key = event.keyCode;
        var tagName = event.target.tagName.toLowerCase();
        var type = event.target.type;
        if (tagName == 'input' && KURecorder.inputTypes.indexOf(type) >= 0) {
            if (key == 13) {
                enterTarget = event.target;
                enterValue = enterTarget.value;
                var tempTarget = event.target.parentElement;
                var formChk = tempTarget.tagName.toLowerCase();
                //console.log(tempValue + " " + enterTarget.value + " " + tabCheck + " " + enterTarget + " " + focusValue);
                // console.log(focusValue);
                // console.log(enterTarget.value);
                if (tempValue == enterTarget.value && tabCheck == enterTarget) {
                    this.processOnSendKeyTarget(enterTarget);
                    enterTarget = null;
                    preventType = true;
                } else if (focusValue == enterTarget.value) {
                    this.processOnSendKeyTarget(enterTarget);
                    enterTarget = null;
                }
                if (typeTarget.tagName && !preventType && (typeLock = 1)) {
                    // END
                    var tagName = typeTarget.tagName.toLowerCase();
                    var type = typeTarget.type;
                    if ('input' == tagName && KURecorder.inputTypes.indexOf(type) >= 0) {
                        if (typeTarget.value.length > 0) {
                            this.processOnChangeTarget(typeTarget);

                            // © Chen-Chieh Ping, SideeX Team
                            if (enterTarget != null) {
                                this.processOnSendKeyTarget(enterTarget);
                                enterTarget = null;
                            }
                            // END
                        } else {
                            this.processOnChangeTarget(typeTarget);
                        }
                    } else if ('textarea' == tagName) {
                        this.processOnChangeTarget(typeTarget);
                    }
                }
                preventClick = true;
                setTimeout(function () {
                    preventClick = false;
                }, 500);
                setTimeout(function () {
                    if (enterValue != event.target.value) enterTarget = null;
                }, 50);
            }
        }
    }
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
KURecorder.addEventHandler('dragAndDrop', 'mousedown', function (event) {
    var self = this;
    if (event.clientX < window.document.documentElement.clientWidth && event.clientY < window.document.documentElement.clientHeight) {
        this.mousedown = event;
        this.mouseup = setTimeout(function () {
            delete self.mousedown;
        }.bind(this), 200);

        this.selectMouseup = setTimeout(function () {
            self.selectMousedown = event;
        }.bind(this), 200);
    }
    this.mouseoverQ = [];

    if (event.target.nodeName) {
        var tagName = event.target.nodeName.toLowerCase();
        if ('option' == tagName) {
            var parent = event.target.parentNode;
            if (parent.multiple) {
                var options = parent.options;
                for (var i = 0; i < options.length; i++) {
                    options[i]._wasSelected = options[i].selected;
                }
            }
        }
    }
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
var preventAutomaticClick = false;
var preventClickTwice = false;
KURecorder.addEventHandler('dragAndDrop', 'mouseup', function (event) {
    clearTimeout(this.selectMouseup);
    if (!preventAutomaticClick) {

        preventAutomaticClick = true;
        setTimeout(function () { preventAutomaticClick = false; }, 30);

        if (this.selectMousedown) {
            var x = event.clientX - this.selectMousedown.clientX;
            var y = event.clientY - this.selectMousedown.clientY;

            function getSelectionText() {
                var text = "";
                var activeEl = window.document.activeElement;
                var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
                if (activeElTagName == "textarea" || activeElTagName == "input") {
                    text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
                } else if (window.getSelection) {
                    text = window.getSelection().toString();
                }
                return text.trim();
            }

            if (this.selectMousedown && event.button === 0 && (x + y) && (event.clientX < window.document.documentElement.clientWidth && event.clientY < window.document.documentElement.clientHeight) && getSelectionText() === '') {
                var sourceRelateX = this.selectMousedown.pageX - this.selectMousedown.target.getBoundingClientRect().left - window.scrollX;
                var sourceRelateY = this.selectMousedown.pageY - this.selectMousedown.target.getBoundingClientRect().top - window.scrollY;
                var targetRelateX, targetRelateY;
                if (!!this.mouseoverQ.length && this.mouseoverQ[1].relatedTarget == this.mouseoverQ[0].target && this.mouseoverQ[0].target == event.target) {
                    targetRelateX = event.pageX - this.mouseoverQ[1].target.getBoundingClientRect().left - window.scrollX;
                    targetRelateY = event.pageY - this.mouseoverQ[1].target.getBoundingClientRect().top - window.scrollY;
                    // this.record("mouseDownAt", this.ku_locatorBuilders.buildAll(this.selectMousedown.target), sourceRelateX + ',' + sourceRelateY);
                    // this.record("mouseMoveAt", this.ku_locatorBuilders.buildAll(this.mouseoverQ[1].target), targetRelateX + ',' + targetRelateY);
                    // this.record("mouseUpAt", this.ku_locatorBuilders.buildAll(this.mouseoverQ[1].target), targetRelateX + ',' + targetRelateY);
                } else {
                    targetRelateX = event.pageX - event.target.getBoundingClientRect().left - window.scrollX;
                    targetRelateY = event.pageY - event.target.getBoundingClientRect().top - window.scrollY;
                    // this.record("mouseDownAt", this.ku_locatorBuilders.buildAll(event.target), targetRelateX + ',' + targetRelateY);
                    // this.record("mouseMoveAt", this.ku_locatorBuilders.buildAll(event.target), targetRelateX + ',' + targetRelateY);
                    // this.record("mouseUpAt", this.ku_locatorBuilders.buildAll(event.target), targetRelateX + ',' + targetRelateY);
                }
            }
        } else {
            delete this.clickLocator;
            delete this.mouseup;
            if (this.mousedown) {
                var mouseDownTemp = this.mousedown;
                var mouseDownTempTarget = this.mousedown.target;
                var currentURL = this.window.document.URL;
                var clickType = this.rec_getMouseButton(event);
                var action = {};

                // We want to handle double click, hence the 200ms wait
                // But there is no guaranteed that the document would still
                // contain event.target after 200ms, if it doesn't, then no xpath
                // construction method can be done, hence we have to break
                // encapsulation here by constructing all the relevant xpaths first
                // and then the 200ms is to decide wether to send the data or not
                
                this.checkForNavigateAction(currentURL);
                action["actionName"] = 'click';
                action["actionData"] = clickType;

                if (!event.target) {
                    return;
                }
                var jsonObject = mapDOMForRecord(action, event.target, window);                

                this.waitUntilDoubleClickIsConfirmed = setTimeout(function (){
                    if (mouseDownTempTarget !== event.target && !(x + y)) {
                        var x = event.clientX - this.mouseDownTemp.clientX;
                        var y = event.clientY - this.mouseDownTemp.clientY;
                        var self = this;
                    }
                    // this.record("mouseDown", this.ku_locatorBuilders.buildAll(this.mousedown.target), '');
                    // this.record("mouseUp", this.ku_locatorBuilders.buildAll(event.target), '');    
                    else if (mouseDownTempTarget === event.target) {
                        var self = this;
                        if (event.button == 0 && !preventClick && event.isTrusted) {
                            if (!preventClickTwice) {                                
                                if (this.rec_isElementMouseUpEventRecordable(event.target, clickType)) {
                                    self.rec_processObject(jsonObject);
                                }
                                preventClickTwice = true;
                            }
                            setTimeout(function () { preventClickTwice = false; }, 30);
                        }
                    }
                }.bind(this), 200);
            }
        }
        delete this.mousedown;
        delete this.selectMousedown;
        delete this.mouseoverQ;

    }
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
KURecorder.addEventHandler('dragAndDropToObject', 'dragstart', function (event) {
    var self = this;
    this.dropLocator = setTimeout(function () {
        self.dragstartLocator = event;
    }.bind(this), 200);
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
KURecorder.addEventHandler('dragAndDropToObject', 'drop', function (event) {
    clearTimeout(this.dropLocator);
    if (this.dragstartLocator && event.button == 0 && this.dragstartLocator.target !== event.target) {
        // this.record("dragAndDropToObject", this.ku_locatorBuilders.buildAll(this.dragstartLocator.target), this.ku_locatorBuilders.build(event.target));
    }
    delete this.dragstartLocator;
    delete this.selectMousedown;
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
var prevTimeOut = null;
KURecorder.addEventHandler('runScript', 'scroll', function (event) {
    if (pageLoaded === true) {
        var self = this;
        this.scrollDetector = event.target;
        clearTimeout(prevTimeOut);
        prevTimeOut = setTimeout(function () {
            delete self.scrollDetector;
        }.bind(self), 500);
    }
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
var nowNode = 0;
KURecorder.addEventHandler('mouseOver', 'mouseover', function (event) {
    if (window.document.documentElement)
        nowNode = window.document.documentElement.getElementsByTagName('*').length;
    var self = this;
    if (pageLoaded === true) {
        var clickable = this.findClickableElement(event.target);

        if (event.target == this.rec_hoverElement) {
            return;
        }

        this.rec_hoverElement = event.target;
        this.rec_hoverElement.style.outline = ELEMENT_HOVER_OUTLINE_STYLE;
        this.rec_elementInfoDiv.style.display = 'block';
        this.rec_updateInfoDiv(getElementInfo(this.rec_hoverElement));

        if (clickable) {
            this.nodeInsertedLocator = event.target;
            setTimeout(function () {
                delete self.nodeInsertedLocator;
            }.bind(self), 500);

            this.nodeAttrChange = this.ku_locatorBuilders.buildAll(event.target);
            this.nodeAttrChangeTimeout = setTimeout(function () {
                delete self.nodeAttrChange;
            }.bind(self), 10);
        }
        //drop target overlapping
        if (this.mouseoverQ) //mouse keep down
        {
            if (this.mouseoverQ.length >= 3)
                this.mouseoverQ.shift();
            this.mouseoverQ.push(event);
        }
    }
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
KURecorder.addEventHandler('mouseOut', 'mouseout', function (event) {
    if (this.rec_hoverElement != event.target) {
        return;
    }
    this.rec_clearHoverElement();
    this.rec_elementInfoDiv.style.display = 'none';
    this.rec_updateInfoDiv("");

    if (this.mouseoutLocator !== null && event.target === this.mouseoutLocator) {
        // this.record("mouseOut", this.ku_locatorBuilders.buildAll(event.target), '');

    }
    delete this.mouseoutLocator;
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
KURecorder.addEventHandler('mouseOver', 'DOMNodeInserted', function (event) {
    if (pageLoaded === true && window.document.documentElement.getElementsByTagName('*').length > nowNode) {
        var self = this;
        if (this.scrollDetector) {
            //TODO: fix target
            // this.record("runScript", [
            //     [
            //         ["window.scrollTo(0," + window.scrollY + ")", ]
            //     ]
            // ], '');
            pageLoaded = false;
            setTimeout(function () {
                pageLoaded = true;
            }.bind(self), 550);
            delete this.scrollDetector;
            delete this.nodeInsertedLocator;
        }
        if (this.nodeInsertedLocator) {
            // this.record("mouseOver", this.ku_locatorBuilders.buildAll(this.nodeInsertedLocator), '');
            this.mouseoutLocator = this.nodeInsertedLocator;
            delete this.nodeInsertedLocator;
            delete this.mouseoverLocator;
        }
    }
}, true);
// END

// © Shuo-Heng Shih, SideeX Team
var readyTimeOut = null;
var pageLoaded = true;
KURecorder.addEventHandler('checkPageLoaded', 'readystatechange', function (event) {
    var self = this;
    if (window.document.readyState === 'loading') {
        pageLoaded = false;
    } else {
        pageLoaded = false;
        clearTimeout(readyTimeOut);
        readyTimeOut = setTimeout(function () {
            pageLoaded = true;
        }.bind(self), 1500); //setReady after complete 1.5s
    }
}, true);
// END

// © Ming-Hung Hsu, SideeX Team
KURecorder.addEventHandler('contextMenu', 'contextmenu', function (event) {
    var myPort = browser.runtime.connect();
    var tmpText = this.ku_locatorBuilders.buildAll(event.target);
    var tmpVal = getText(event.target);
    var tmpTitle = normalizeSpaces(event.target.ownerDocument.title);
    var self = this;
    myPort.onMessage.addListener(function portListener(m) {
        if (m.cmd.includes("Text")) {
            //self.record(m.cmd, tmpText, tmpVal);
        } else if (m.cmd.includes("Title")) {
            //self.record(m.cmd, [[tmpTitle]], '');
        } else if (m.cmd.includes("Value")) {
            //self.record(m.cmd, tmpText, getInputValue(event.target));
        }
        myPort.onMessage.removeListener(portListener);
    });
}, true);
// END

// © Yun-Wen Lin, SideeX Team
var getEle;
var checkFocus = 0;
KURecorder.addEventHandler('editContent', 'focus', function (event) {
    var editable = event.target.contentEditable;
    if (editable == 'true') {
        getEle = event.target;
        contentTest = getEle.innerHTML;
        checkFocus = 1;

    }
}, true);
// END

// © Yun-Wen Lin, SideeX Team
KURecorder.addEventHandler('editContent', 'blur', function (event) {
    if (checkFocus == 1) {
        if (event.target == getEle) {
            if (getEle.innerHTML != contentTest) {
                this.processOnChangeTarget(event.target);
                //this.record("editContent", this.ku_locatorBuilders.buildAll(event.target), getEle.innerHTML);
            }
            checkFocus = 0;
        }
    }
}, true);
// END

browser.runtime.sendMessage({
    attachRecorderRequest: true
}).catch(function (reason) {
    // Failed silently if receiveing end does not exist
});

// Copyright 2005 Shinya Kasatani
KURecorder.prototype.getOptionLocator = function (option) {
    var label = option.text.replace(/^ *(.*?) *$/, "$1");
    if (label.match(/\xA0/)) { // if the text contains &nbsp;
        return "label=regexp:" + label.replace(/[\(\)\[\]\\\^\$\*\+\?\.\|\{\}]/g, function (str) {
            return '\\' + str
        })
            .replace(/\s+/g, function (str) {
                if (str.match(/\xA0/)) {
                    if (str.length > 1) {
                        return "\\s+";
                    } else {
                        return "\\s";
                    }
                } else {
                    return str;
                }
            });
    } else {
        return "label=" + label;
    }
};

KURecorder.prototype.findClickableElement = function (e) {
    if (!e.tagName) return null;
    var tagName = e.tagName.toLowerCase();
    var type = e.type;
    if (e.hasAttribute("onclick") || e.hasAttribute("href") || tagName == "button" ||
        (tagName == "input" &&
            (type == "submit" || type == "button" || type == "image" || type == "radio" || type == "checkbox" || type == "reset"))) {
        return e;
    } else {
        if (e.parentNode != null) {
            return this.findClickableElement(e.parentNode);
        } else {
            return null;
        }
    }
};

//select / addSelect / removeSelect
KURecorder.addEventHandler('select', 'focus', function (event) {
    if (event.target.nodeName) {
        var tagName = event.target.nodeName.toLowerCase();
        if ('select' == tagName && event.target.multiple) {
            this.rec_windowFocus(event.target);
            var options = event.target.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i]._wasSelected == null) {
                    // if the focus was gained by mousedown event, _wasSelected would be already set
                    options[i]._wasSelected = options[i].selected;

                }
            }
        }
    }
}, true);

KURecorder.addEventHandler('select', 'change', function (event) {
    if (event.target.tagName) {
        var tagName = event.target.tagName.toLowerCase();
        if ('select' == tagName) {
            if (!event.target.multiple) {
                var option = event.target.options[event.target.selectedIndex];
                this.processOnChangeTarget(event.target);
                //this.record("select", this.ku_locatorBuilders.buildAll(event.target), this.getOptionLocator(option));
            } else {
                var options = event.target.options;
                for (var i = 0; i < options.length; i++) {
                    if (options[i]._wasSelected == null) { }

                    if (options[i]._wasSelected != options[i].selected) {
                        options[i]._wasSelected = options[i].selected;
                        this.processOnChangeTarget(event.target);
                        break;
                    }
                }
            }
        }
    }
}, true);


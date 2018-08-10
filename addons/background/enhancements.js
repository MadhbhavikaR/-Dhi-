
/*var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-81802338-9']);
_gaq.push(['_trackPageview']);*/
/*

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
*/

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // _gaq.push(['_trackEvent', 'app', 'install']);
        // _gaq.push(['_trackEvent', 'app', 'open-landing-page']);
        chrome.tabs.create({'url': 'https://dhi.madhbhavikar.online'});
    } else if (details.reason === 'update') {
        // _gaq.push(['_trackEvent', 'app', 'update']);
        var previousVersion = details.previousVersion;
        var previousMajorVersion = previousVersion.substring(0, previousVersion.indexOf('.'));
        if (previousMajorVersion === '1') {
            // _gaq.push(['_trackEvent', 'app', 'open-landing-page']);
            chrome.tabs.create({'url': 'https://dhi.madhbhavikar.online'});
        }
    }
});

chrome.runtime.setUninstallURL('https://dhi.madhbhavikar.online');

function getWindowSize(callback) {
    chrome.storage.local.get('window', function(result) {
        let height = 750;
        let width = 750;
        if (result) {
            try {
                result = result.window;
                if (result.height) {
                    if(result.height > 750){
                        height = result.height;
                    }
                }
                if (result.width) {
                    if(result.width > 750){
                        width = result.width;
                    }
                }
            } catch (e) {
            }
        }
        callback(height, width);
    });
}

var attachedTabs = {};

function onDetach(debuggeeId) {
    var tabId = debuggeeId.tabId;
    delete attachedTabs[tabId];
}

function doDetach(sendResponse, debuggeeId, err) {
    chrome.debugger.sendCommand(
        debuggeeId,
        "DOM.disable",
        {},
        function(res) {
            // force read last error
            if (chrome.runtime.lastError) {
            }
            chrome.debugger.detach(debuggeeId, function() {
                onDetach(debuggeeId);
                if (err) {
                    sendResponse({
                        status: false,
                        err: err.message
                    });
                } else {
                    sendResponse({
                        status: true
                    });
                }
            });
        }
    );
};

function doUploadFile(request, sendResponse, debuggeeId, frameId) {
    var tabId = debuggeeId.tabId;
    attachedTabs[tabId] = true;
    doActionOnNode(frameId, debuggeeId, sendResponse, request, function(nodeId) {
        chrome.debugger.sendCommand(
            debuggeeId,
            "DOM.setFileInputFiles",
            {
                nodeId: nodeId,
                files: [request.file]
            },
            function (res) {
                if (chrome.runtime.lastError) {
                    doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
                } else {
                    doDetach(sendResponse, debuggeeId);
                }
            }
        );
    });
};

function doSendSpecialKeys(request, sendResponse, debuggeeId, frameId) {
    var tabId = debuggeeId.tabId;
    attachedTabs[tabId] = true;
    doActionOnNode(frameId, debuggeeId, sendResponse, request, function(nodeId) {
        chrome.debugger.sendCommand(
            debuggeeId,
            "DOM.focus",
            {
                nodeId: nodeId
            },
            function (res) {
                if (chrome.runtime.lastError) {
                    doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
                } else {
                    var modifiers = request.modifiers;
                    var keyCodes = request.keyCodes;
                    var keyboardEventKeys = request.keyboardEventKeys;
                    var keyboardEventCodes = request.keyboardEventCodes;
                    var f = function(i) {
                        if (i >= keyCodes.length) {
                            doDetach(sendResponse, debuggeeId);
                        } else {
                            var keyCode = keyCodes[i];
                            var keyboardEventKey = keyboardEventKeys[i];
                            var keyboardEventCode = keyboardEventCodes[i];
                            // code: 'KeyV' key: 'v'
                            chrome.debugger.sendCommand(
                                debuggeeId,
                                "Input.dispatchKeyEvent",
                                {
                                    type: 'rawKeyDown',
                                    windowsVirtualKeyCode: keyCode,
                                    nativeVirtualKeyCode : keyCode,
                                    macCharCode: keyCode,
                                    key: keyboardEventKey,
                                    code: keyboardEventCode,
                                    modifiers: modifiers
                                },
                                function (res) {
                                    if (chrome.runtime.lastError) {
                                        doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
                                    } else {
                                        chrome.debugger.sendCommand(
                                            debuggeeId,
                                            "Input.dispatchKeyEvent",
                                            {
                                                type: 'keyUp',
                                                windowsVirtualKeyCode: keyCode,
                                                nativeVirtualKeyCode : keyCode,
                                                macCharCode: keyCode,
                                                key: keyboardEventKey,
                                                code: keyboardEventCode,
                                                modifiers: modifiers
                                            },
                                            function (res) {
                                                if (chrome.runtime.lastError) {
                                                    doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
                                                } else {
                                                    f(i + 1);
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    };
                    f(0);
                }
            }
        );
    });
};

browser.runtime.onMessage.addListener(function(request, sender, sendResponse, type) {
    if (request.captureEntirePageScreenshot) {
        var windowId = request.captureWindowId || sender.tab.windowId;
        // sender.tab.height;
        // sender.tab.width;

        browser.tabs.captureVisibleTab(windowId, { format: 'png' }).then(function(image) {
            sendResponse({
                image: image
            });
        });
        return true;
    } else {
        var tabId = sender.tab.id;
        var debuggeeId = {tabId: tabId};
        var frameId = sender.frameId;
        if (request.uploadFile) {
            if (attachedTabs[tabId]) {
                doUploadFile(request, sendResponse, debuggeeId, frameId);
            } else {
                doAttachDebugger(sendResponse, debuggeeId, function() {
                    doUploadFile(request, sendResponse, debuggeeId, frameId);
                });
            }
            return true;
        } else if (request.sendSpecialKeys) {
            if (attachedTabs[tabId]) {
                doSendSpecialKeys(request, sendResponse, debuggeeId, frameId);
            } else {
                doAttachDebugger(sendResponse, debuggeeId, function() {
                    doSendSpecialKeys(request, sendResponse, debuggeeId, frameId);
                });
            }
            return true;
        }
    }
});

function doActionOnNode(frameId, debuggeeId, sendResponse, request, f) {
    if (frameId) {
        chrome.debugger.sendCommand(debuggeeId, "DOM.getFlattenedDocument", {
            depth: -1,
            pierce: true
        }, function (res) {
            if (chrome.runtime.lastError) {
                doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
            }
            else {
                var krId = request.krId;
                var node = res.nodes.find(function (n) {
                    return n.attributes && n.attributes.indexOf(krId) >= 0;
                });
                if (node) {
                    f(node.nodeId);
                } else {
                    doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
                }
            }
        });
    } else {
        chrome.debugger.sendCommand(debuggeeId, "DOM.getDocument", {}, function (res) {
            if (chrome.runtime.lastError) {
                doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
            } else {
                var node = res.root;
                chrome.debugger.sendCommand(debuggeeId, "DOM.querySelector", {
                    nodeId: node.nodeId,
                    selector: request.locator
                }, function (res) {
                    if (chrome.runtime.lastError) {
                        doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
                    }
                    else {
                        f(res.nodeId);
                    }
                });
            }
        });
    }
}

function doAttachDebugger(sendResponse, debuggeeId, f) {
    chrome.debugger.attach(debuggeeId, "1.2", function() {
        if (chrome.runtime.lastError) {
            doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
        } else {
            chrome.debugger.sendCommand(
                debuggeeId,
                "DOM.enable",
                {},
                function(res) {
                    if (chrome.runtime.lastError) {
                        doDetach(sendResponse, debuggeeId, chrome.runtime.lastError);
                    } else {
                        f();
                    }
                }
            );
        }
    });
}

if (chrome.debugger) {
    chrome.debugger.onDetach.addListener(onDetach);
}

var externalCapabilities = {};

chrome.runtime.onMessageExternal.addListener(function(message, sender) {
    if (message.type === 'katalon_recorder_register') {
        var payload = message.payload;
        // payload: {
        //     capabilities: [
        //         {
        //             id: 'super-power',
        //             summary: 'Generate super power',
        //             type: 'export'
        //         }
        //     ]
        // }
        var capabilities = payload.capabilities;
        if (!capabilities) {
            // payload: {
            //     summary: 'Sample Katalon Recorder Plugin Format'
            // }
            capabilities = [
                {
                    id: '',
                    summary: payload.summary,
                    type: 'export'
                }
            ];
        }
        var extensionId = sender.id;
        var now = new Date().getTime();
        for (var i = 0; i < capabilities.length; i++) {
            var capability = capabilities[i];
            capability.extensionId = extensionId;
            var capabilityId = capability.id;
            var capabilityGlobalId = extensionId + '-' + capabilityId;
            externalCapabilities[capabilityGlobalId] = {
                extensionId: extensionId,
                capabilityId: capabilityId,
                summary: capability.summary,
                type: capability.type,
                lastPing: now
            };
        }
    }
});

browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.getExternalCapabilities) {
        var now = new Date().getTime();
        Object.keys(externalCapabilities).forEach(function(capabilityGlobalId) {
            var capability = externalCapabilities[capabilityGlobalId];
            var lastPing = capability.lastPing;
            if ((now - lastPing) > 2 * 60 * 1000) {
                delete externalCapabilities[capabilityGlobalId];
            }
        });
        sendResponse(externalCapabilities);
    }
});

browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.checkChromeDebugger) {
        sendResponse({
            status: !!chrome.debugger
        });
    }
});

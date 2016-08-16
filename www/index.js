// /////////////////////////////////////////////////////////////////////////////////
// // Copyright (c) Autodesk, Inc. All rights reserved
// // Written by Philippe Leefsma 2014 - ADN/Developer Technical Services
// //
// // Permission to use, copy, modify, and distribute this software in
// // object code form for any purpose and without fee is hereby granted,
// // provided that the above copyright notice appears in all copies and
// // that both that copyright notice and the limited warranty and
// // restricted rights notice below appear in all supporting
// // documentation.
// //
// // AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// // AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// // MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// // DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// // UNINTERRUPTED OR ERROR FREE.
// /////////////////////////////////////////////////////////////////////////////////

var defaultUrn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE2LTA2LTIxLTAwLTMyLTEwLXhybGg3enRlMGtkcDJ5anZlaWJpdWpwb2sya2kvR2F0ZUhvdXNlLm53ZA==';

$(document).ready(function () {
    var getToken =  function() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", 'http://' + window.location.host + '/api/token', false);
        xhr.send(null);
        return xhr.responseText;
    }
    // Allows different urn to be passed as url parameter
    var paramUrn = Autodesk.Viewing.Private.getParameterByName('urn');
    var urn = (paramUrn !== '' ? paramUrn : defaultUrn);
    

    if (urn.indexOf('urn:') !== 0)
        urn = 'urn:' + urn;
    
    function initializeViewer(containerId, documentId, role) {
        var viewerContainer = document.getElementById(containerId);
        var viewer = new Autodesk.Viewing.Private.GuiViewer3D(
            viewerContainer);
        viewer.start();

        Autodesk.Viewing.Document.load(documentId,
                                       function (document) {
                                           var rootItem = document.getRootItem();
                                           var geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(
                                               rootItem,
                                               { 'type': 'geometry', 'role': role },
                                               true);

                                           viewer.addEventListener(
                                               Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                                               function(event) {
                                                   loadExtensions(viewer);
                                               });

                                           viewer.load(document.getViewablePath(geometryItems[0]));
                                       },

                                       // onErrorCallback
                                       function (msg) {
                                           console.log("Error loading document: " + msg);
                                       }
                                      );
    }

    function loadExtensions(viewer) {
        viewer.loadExtension("ExtensionEditor");
    }

    function initialize() {
        var _this = this;
        _this.timeZero = Date.now();
        var options = {
            env: "AutodeskProduction",
            getAccessToken: getToken,
            refreshToken: getToken,
            eventCallback: function(entry) {
                if (!entry) return;
                var cat = entry.category;
                var output = entry;
                if (typeof output !== 'string')
                    output = JSON.stringify(output);
                var totalSeconds = Math.round((new Date().getTime() - _this.timeZero) / 1000);
                var seconds = totalSeconds % 60;
                var minutes = Math.floor(totalSeconds / 60);
                var timeLabel = (minutes < 10 ? '0'+minutes : ''+minutes) + ':' +
                    (seconds < 10 ? '0'+seconds : ''+seconds) + ' ';

                // Doing this is lame.
                $('#viewer-log-output').append(timeLabel + output + '\n');
            }
        };

        Autodesk.Viewing.Initializer(options, function () {
            initializeViewer('viewerDiv', urn, '3d');
        });
    }

    initialize();
});

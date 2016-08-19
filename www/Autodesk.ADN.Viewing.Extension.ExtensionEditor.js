AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.ExtensionEditor = function (viewer, options) {

    Autodesk.Viewing.Extension.call(this, viewer, options);

    // Viewer variables
    var _panelBaseId = newGUID();
    var _viewer = viewer;
    var _panel = null;
    var _this = this;

    // Editor variables
    var editor; 
    var mode = 0; // 0 -> vertex | 1 -> fragment
    var text = [
        'AutodeskNamespace("Viewing.Extension");',
        '',
        'Viewing.Extension.Workshop = function (viewer, options) {',
        '',
        '  Autodesk.Viewing.Extension.call(this, viewer, options);',
        '  var _self = this;',
        '  var _viewer = viewer;',
        '',
        '  _self.load = function () {',
        '    console.log("Viewing.Extension.Workshop loaded");',
        '    return true;',
        '  };',
        '',
        '  _self.unload = function () {',
        '    console.log("unloaded");',
        '    return true;',
        '  };',
        '};',
        '',
        'Viewing.Extension.Workshop.prototype =',
        '  Object.create(Autodesk.Viewing.Extension.prototype);',
        '',
        'Viewing.Extension.Workshop.prototype.constructor =',
        '  Viewing.Extension.Workshop;',
        '',
        'Autodesk.Viewing.theExtensionManager.registerExtension(',
        '  "test",',
        '  Viewing.Extension.Workshop);'
    ].join("\r\n");
    var doc = ace.createEditSession(text, "ace/mode/javascript");
    doc.setUseWrapMode(true);

    var isDragging = false; // used for panel resize listener

    //////////////////////////////////////////////////////////
    // load callback
    //
    //////////////////////////////////////////////////////////
    _this.load = function () {

        _panel = new Autodesk.ADN.Viewing.Extension.ExtensionEditor.Panel(
            _viewer.container,
            _panelBaseId);

        // creates controls if specified in
        _panel.setVisible(true);

        console.log('Autodesk.ADN.Viewing.Extension.ExtensionEditor loaded');

        return true;
    };

    /////////////////////////////////////////////////////////
    // unload callback
    //
    /////////////////////////////////////////////////////////
    _this.unload = function () {

        _panel.setVisible(false);

        console.log('Autodesk.ADN.Viewing.Extension.ExtensionEditor unloaded');

        return true;
    };

    /////////////////////////////////////////////////////////
    // Panel implementation
    //
    /////////////////////////////////////////////////////////
    Autodesk.ADN.Viewing.Extension.ExtensionEditor.Panel = function(
        parentContainer, baseId) {

        this.content = document.createElement('div');
        
        this.content.id = baseId + 'extensionEditorContent';
        this.content.className = 'extensionEditor-content';

        Autodesk.Viewing.UI.DockingPanel.call(
            this,
            parentContainer,
            baseId,
            "Extension Editor",
            {shadow:true});

        this.container.style.top = "10px";
        this.container.style.left = "10px";
        this.container.style.width = "450px";
        this.container.style.height = "300px";
        this.container.style.resize = "auto";

        var titleHeight = 35;
        var errorHeight = 100;
        var resizeTabHeight = 20;
        $("#" + baseId + "extensionEditorContent").css({
            width: "100%",
            height: "calc(100% - " + (resizeTabHeight + titleHeight) + "px)",
            position: "relative"
        });
        
        $("#" + baseId + "extensionEditorContent").append("<div id='extensionContainer'></div>");
        $("#extensionContainer").css({
            position: "relative",
            width: "100%",
            height: "calc(100% - " + (errorHeight) + "px)",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        });
        
        $('#' + baseId + 'extensionEditorContent')
            .append('<button id="editor-submit" class="editor-button btn btn-xs">Apply</button>');
        $('#' + baseId + 'extensionEditorContent')
            .append('<textarea id="viewer-log-output" rows=8></textarea>');

        $(".editor-button").css({
            position: 'absolute',
            right: '10px',
            top: 'calc(100% - ' + resizeTabHeight + 'px)'
        });

        $("#viewer-log-output").css({
            resize: 'none',
            width: '100%',
            height: '100px',
            margin: '2 2 2 2'
        });

        editor = genEditor(baseId, this);
    };

    function genEditor(baseId, panel) {

        var editor = ace.edit("extensionContainer");
        editor.setTheme("ace/theme/twilight");
        editor.setShowPrintMargin(false);
        editor.setAutoScrollEditorIntoView(true);
        editor.setSession(doc);

        $("#editor-submit").click(function(e) {
            if (_viewer.loadedExtensions.test) {
                _viewer.loadedExtensions.test.unload();
                Autodesk.Viewing.theExtensionManager.unregisterExtension('test');
                delete _viewer.loadedExtensions.test;
            }
            var str = editor.session.getValue();
            eval(str);
            _viewer.loadExtension("test");
        });

        // hack for getting panel resize listener
        $("#" + baseId)
            .mousedown(function() {
                isDragging = false;
            })
            .mousemove(function() {
                var wasDragging = isDragging;
                isDragging = true;
                if (wasDragging)
                    editor.resize();
            })
            .mouseup(function() {
                var wasDragging = isDragging;
                isDragging = false;
                if (!wasDragging) {
                    editor.resize();
                }
            });
        
        return editor;
    }

    Autodesk.ADN.Viewing.Extension.ExtensionEditor.Panel.prototype = Object.create(
        Autodesk.Viewing.UI.DockingPanel.prototype);

    Autodesk.ADN.Viewing.Extension.ExtensionEditor.Panel.prototype.constructor =
        Autodesk.ADN.Viewing.Extension.ExtensionEditor.Panel;

    Autodesk.ADN.Viewing.Extension.ExtensionEditor.Panel.prototype.initialize = function()
    {
        // Override DockingPanel initialize() to:
        // - create a standard title bar
        // - click anywhere on the panel to move

        this.title = this.createTitleBar(
            this.titleLabel ||
                this.container.id);
        $(this.title).attr("id", "editor-title");

        this.closer = this.createCloseButton();

        this.container.appendChild(this.title);
        this.title.appendChild(this.closer);
        this.container.appendChild(this.content);

        this.initializeMoveHandlers(this.title);
        this.initializeCloseHandler(this.closer);
        
    };

    /////////////////////////////////////////////////////////
    // new GUID util
    //
    /////////////////////////////////////////////////////////
    function newGUID() {

        var d = new Date().getTime();

        var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
                /[xy]/g,
            function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });

        return guid;
    };


};

Autodesk.ADN.Viewing.Extension.ExtensionEditor.prototype =
    Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.ExtensionEditor.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.ExtensionEditor;

Autodesk.Viewing.theExtensionManager.registerExtension(
    'ExtensionEditor',
    Autodesk.ADN.Viewing.Extension.ExtensionEditor);

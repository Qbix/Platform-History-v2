(function ($, window, undefined) {
    var _icons = {
        addItem: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>',
        removeItem: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 16.538l-4.592-4.548 4.546-4.587-1.416-1.403-4.545 4.589-4.588-4.543-1.405 1.405 4.593 4.552-4.547 4.592 1.405 1.405 4.555-4.596 4.591 4.55 1.403-1.416z"/></svg>',
    }
    var ua=navigator.userAgent;
    var _isiOS = false;
    var _isAndroid = false;
    var _isiOSCordova = false;
    var _isAndroidCordova = false;
    if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;
    if(ua.indexOf('Android')!=-1) _isAndroid = true;
    if(typeof cordova != 'undefined' && _isiOS) _isiOSCordova = true;
    if(typeof cordova != 'undefined' && _isAndroid) _isAndroidCordova = true;


    /**
     * Streams/fileManager tool.
     * Allows to create and manage files and folders
     * @module Streams
     * @class Streams fileManager
     * @constructor
     * @param {Object} options
     */
    Q.Tool.define("Streams/fileManager", function(options) {
        var tool = this;
        tool.state = Q.extend({}, this.state, options);

        Q.addStylesheet('{{Streams}}/css/tools/fileManager.css?ts=' + performance.now(), function () {
            tool.create();
        });

        },

        {
            onSelect: new Q.Event(),
            openInDialog: true,
            currentDirStreamName: 'Streams/fileManager/main',
            history: {streams:[], currentIndex:0}
        },

        {
            create: function() {
                var tool = this;
                tool.state.history.streams.push(tool.state.currentDirStreamName);

                var userId = Q.Users.loggedInUserId();

                var fileManagerCon = document.createElement('DIV');
                fileManagerCon.className = 'Streams_fileManager_con';
                var fileManagerInner = document.createElement('DIV');
                fileManagerInner.className = 'Streams_fileManager_inner';
                fileManagerCon.appendChild(fileManagerInner);


                var fileManagerControlsCon = document.createElement('DIV');
                fileManagerControlsCon.className = 'Streams_fileManager_controls_con';
                var fileManagerControlsInner = document.createElement('DIV');
                fileManagerControlsInner.className = 'Streams_fileManager_controls_inner';

                var fileManagerControlsBackCon = document.createElement('DIV');
                fileManagerControlsBackCon.className = 'Streams_fileManager_controls_item Streams_fileManager_controls_back_con';
                var fileManagerControlsBackIcon = document.createElement('DIV');
                fileManagerControlsBackIcon.className = 'Streams_fileManager_controls_back_icon';
                fileManagerControlsBackCon.appendChild(fileManagerControlsBackIcon);
                fileManagerControlsInner.appendChild(fileManagerControlsBackCon);

                var fileManagerControlsForwardCon = document.createElement('DIV');
                fileManagerControlsForwardCon.className = 'Streams_fileManager_controls_item Streams_fileManager_controls_forward_con';
                var fileManagerControlsForwardIcon = document.createElement('DIV');
                fileManagerControlsForwardIcon.className = 'Streams_fileManager_controls_forward_icon';
                fileManagerControlsForwardCon.appendChild(fileManagerControlsForwardIcon);
                fileManagerControlsInner.appendChild(fileManagerControlsForwardCon);

                var fileManagerControlsAddCon = document.createElement('DIV');
                fileManagerControlsAddCon.className = 'Streams_fileManager_controls_item Streams_fileManager_controls_add_con';
                var fileManagerControlsAddIcon = document.createElement('DIV');
                fileManagerControlsAddIcon.className = 'Streams_fileManager_controls_add_icon';
                fileManagerControlsAddIcon.innerHTML = _icons.addItem ;
                var fileManagerControlsAddText = document.createElement('DIV');
                fileManagerControlsAddText.className = 'Streams_fileManager_controls_add_text';
                fileManagerControlsAddText.innerHTML =  'Add New';
                fileManagerControlsAddCon.appendChild(fileManagerControlsAddIcon);
                fileManagerControlsAddCon.appendChild(fileManagerControlsAddText);
                fileManagerControlsInner.appendChild(fileManagerControlsAddCon);


                var fileManagerControlsCloseDialog = document.createElement('DIV');
                fileManagerControlsCloseDialog.className = 'Streams_fileManager_controls_close';
                if(tool.state.openInDialog) fileManagerControlsInner.appendChild(fileManagerControlsCloseDialog);

                fileManagerControlsCon.appendChild(fileManagerControlsInner);
                fileManagerInner.appendChild(fileManagerControlsCon);


                var fileManagerExplorerCon= document.createElement('DIV')
                fileManagerExplorerCon.className = 'Streams_fileManager_explorer_con';
                var fileManagerExplorerInner= document.createElement('DIV');
                fileManagerExplorerInner.className = 'Streams_fileManager_explorer_inner';
                fileManagerExplorerCon.appendChild(fileManagerExplorerInner);
                fileManagerInner.appendChild(fileManagerExplorerCon);

                if(!tool.state.openInDialog) tool.element.appendChild(fileManagerCon);

                fileManagerControlsCloseDialog.addEventListener('click', function () {
                    tool.closeDialog();
                })

                fileManagerControlsBackCon.addEventListener('click', function () {
                    var inderToSwitch = tool.state.history.currentIndex - 1;
                    var prevDirStream = tool.state.history.streams[inderToSwitch];
                    if(!prevDirStream) return;
                    tool.state.history.currentIndex = inderToSwitch;
                    tool.state.currentDirStreamName = prevDirStream;
                    tool.refresh();
                })

                fileManagerControlsForwardCon.addEventListener('click', function () {
                    var inderToSwitch = tool.state.history.currentIndex + 1;
                    var prevDirStream = tool.state.history.streams[inderToSwitch];
                    if(!prevDirStream) return;
                    tool.state.history.currentIndex = inderToSwitch;
                    tool.state.currentDirStreamName = prevDirStream;
                    tool.refresh();
                })

                tool.explorerEl = fileManagerExplorerInner;
                tool.fileManagerEl = fileManagerCon;

                tool.createContextualMenu(fileManagerControlsAddCon);
                tool.refresh();

                return fileManagerCon;
            },
            createContextualMenu: function(fileManagerControlsAddCon) {
                var tool = this;
                var userId = Q.Users.loggedInUserId();

                Q.addScript("{{Q}}/js/contextual.js", function () {
                    $(fileManagerControlsAddCon).plugin('Q/contextual', {
                        className: "Streams_fileManager_uploadFile",
                        fadeTime: 300,
                        doubleBlink: true,
                        onConstruct: function (contextual, cid) {
                            tool.addonsContextual = this;
                            contextualToolLoadHandler();
                        }
                    });
                });

                function contextualToolLoadHandler() {
                    var title = Q.getObject(["types", "Streams/image", "newItem"], tool.text) || "Add Image";
                    tool.addMenuItem('image', {
                        title: title,
                        icon: '{{Streams}}/img/icons/Streams/image/40.png',
                        className: "Streams_image_chat",
                        handler: function () {
                            if(tool.imagePreviewElement) {
                                Q.Tool.remove(tool.imagePreviewElement[0], true, true);
                                tool.imagePreviewElement = null;
                            }
                            Q.activate(
                                $("<div>").css("display", "none").appendTo(tool.element).tool("Streams/preview", {
                                    publisherId: userId,
                                    related: {
                                        publisherId: userId,
                                        streamName: tool.state.currentDirStreamName,
                                        type: "Streams/image"
                                    },
                                    onRefresh: function () {
                                        tool.refresh();
                                    },
                                    onLoad: function () {
                                        tool.refresh();
                                    },
                                    creatable: { skipComposer: true }
                                }).tool("Streams/image/preview", {
                                    updateTitle: true,
                                    sendOriginal: true,
                                    dontSetSize: true
                                }),
                                {},
                                function () {
                                    tool.imagePreviewElement = $(this.element);
                                    setTimeout(function () {
                                        $(".Q_imagepicker", tool.imagePreviewElement).plugin('Q/imagepicker', 'click');
                                    }, 0);
                                }
                            )
                        }
                    });

                    var title = Q.getObject(["types", "Streams/video", "newItem"], tool.text) || "Add Video";
                    tool.addMenuItem('video', {
                        title: title,
                        icon: '{{Streams}}/img/icons/Streams/video/40.png',
                        className: "Streams_video_chat",
                        handler: function () {
                            $("<div>").tool("Streams/preview", {
                                publisherId: userId
                            }).tool("Streams/video/preview").activate(function () {
                                var videoPreviewTool = this;

                                var videoPreview = Q.Tool.from(videoPreviewTool.element, "Streams/video/preview");
                                videoPreview.state.onLoad.add(function () {
                                    videoPreview.composer(function (params) {
                                        var fields = Q.extend({
                                            publisherId: userId,
                                            type: "Streams/video"
                                        }, 10, params);

                                        Q.Streams.create(fields, function Streams_preview_afterCreate(err, stream, extra) {

                                            if (err) {
                                                return err;
                                            }

                                            tool.refresh();
                                        }, {
                                            publisherId: userId,
                                            streamName: tool.state.currentDirStreamName,
                                            type: "Streams/video"
                                        });
                                    });
                                });

                            });
                        }
                    });

                    var title = Q.getObject(["types", "Streams/audio", "newItem"], tool.text) || "Add Audio";
                    tool.addMenuItem('audio', {
                        title: title,
                        icon: "{{Streams}}/img/icons/Streams/audio/40.png",
                        className: "Streams_audio_chat",
                        handler: function () {
                            $("<div>").tool("Streams/preview", {
                                publisherId: userId
                            }).tool("Streams/audio/preview").activate(function () {
                                let audioPreview = Q.Tool.from(this.element, "Streams/audio/preview");

                                audioPreview.composer(function (params) {
                                    let fields = Q.extend({
                                        publisherId: userId,
                                        type: "Streams/audio"
                                    }, 10, params);

                                    Q.Streams.create(fields, function Streams_preview_afterCreate(err, stream, extra) {

                                        if (err) {
                                            return err;
                                        }
                                        tool.refresh();
                                    }, {
                                        publisherId: userId,
                                        streamName: tool.state.currentDirStreamName,
                                        type: "Streams/audio"
                                    });
                                });
                            });
                        }
                    });

                    var title = Q.getObject(["types", "Streams/category", "newItem"], tool.text) || "Add Folder";
                    tool.addMenuItem('category', {
                        title: title,
                        icon: "{{Streams}}/img/icons/Streams/category/40.png",
                        className: "Streams_category_chat",
                        handler: function () {
                            var fields = {
                                publisherId: userId,
                                type: "Streams/category"
                            };

                            Q.Streams.create(fields, function Streams_preview_afterCreate(err, stream, extra) {

                                if (err) {
                                    return err;
                                }
                                tool.refresh();
                            }, {
                                publisherId: userId,
                                streamName: tool.state.currentDirStreamName,
                                type: "Streams/category"
                            });
                        }
                    });
                }
            },
            addMenuItem: function (params) {
                var tool = this;
                var $element = $("<li class='Streams_fileManager_add_item'></li>");

                $("<div class='Streams_chat_addon_icon'><img src='" + Q.url(params.icon) + "' /></div>").appendTo($element);

                $("<span class='Streams_chat_addon_title'>" + params.title + "</span>").appendTo($element);

                if (params.className) {
                    $element.addClass(params.className);
                }

                if (Q.typeOf(params.attributes) === "object") {
                    $element.attr(params.attributes);
                }

                if (Q.typeOf(params.handler) === "function") {
                    $element.data("handler", params.handler);
                }

                $("ul.Q_listing", tool.addonsContextual).append($element);

                return $element;
            },
            refresh: function() {
                var tool = this;

                Q.req("Streams/fileManager", ["list"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }

                    tool.loadFilesList(response.slots.list);
                }, {
                    method: 'get',
                    fields: {
                        currentDirStreamName: tool.state.currentDirStreamName
                    }
                });
            },
            loadFilesList: function (files) {
                var tool = this;
                tool.explorerEl.innerHTML = '';
                var userId = Q.Users.loggedInUserId();
                for(let f in files) {
                    let fileStream = files[f];
                    let fileItem = document.createElement('DIV');
                    fileItem.className = 'Streams_fileManager_file_item';
                    let fileItemWrapper = document.createElement('DIV');
                    fileItemWrapper.className = 'Streams_fileManager_file_item_wrapper';
                    let fileItemInner= document.createElement('DIV');
                    fileItemInner.className = 'Streams_fileManager_file_item_inner';
                    let fileItemDummy= document.createElement('DIV');
                    fileItemDummy.className = 'Streams_fileManager_file_item_dummy_el';
                    fileItem.appendChild(fileItemDummy);
                    fileItemWrapper.appendChild(fileItemInner);
                    fileItem.appendChild(fileItemWrapper);

                    let removeItem = function () {
                        if(fileItem.parentElement) {
                            fileItem.parentElement.removeChild(fileItem);
                        }
                    }

                    //var attributes = JSON.parse(fileStream['attributes']);
                    if(fileStream.fields.type == 'Streams/video') {
                        $(fileItemInner).tool("Streams/preview", {
                            publisherId: fileStream.fields.publisherId,
                            streamName: fileStream.fields.name,
                            type: "Streams/video"
                        }).tool("Streams/video/preview").activate(function () {
                            var streamsPreview = Q.Tool.from(fileItemInner, "Streams/preview");
                            streamsPreview.state.onClose.add(function () {
                                removeItem();
                            })

                            var videoPreview = Q.Tool.from(fileItemInner, "Streams/video/preview");
                            videoPreview.preview.options.actions.position = 'tr';
                            videoPreview.preview.options.actions.size = '16';
                            videoPreview.state.onRefresh.add(function () {
                                var icon = videoPreview.element.querySelector('.Streams_preview_icon');
                                var iconCon = document.createElement('DIV');
                                iconCon.className = 'Streams_fileManager_file_icon_con';
                                if(icon && icon.parentElement != null) icon.parentElement.insertBefore(iconCon, icon);
                                iconCon.appendChild(icon);
                            })
                        });
                    } else  if(fileStream.fields.type == 'Streams/audio') {
                        $(fileItemInner).tool("Streams/preview", {
                            publisherId: fileStream.fields.publisherId,
                            streamName: fileStream.fields.name,
                            type: "Streams/audio"
                        }).tool("Streams/audio/preview").activate(function () {
                            var streamsPreview = Q.Tool.from(fileItemInner, "Streams/preview");
                            streamsPreview.state.onClose.add(function () {
                                removeItem();
                            })

                            var audioPreview = Q.Tool.from(fileItemInner, "Streams/audio/preview");
                            audioPreview.preview.options.actions.position = 'tr';
                            audioPreview.preview.options.actions.size = '16';
                            audioPreview.state.onRefresh.add(function () {
                                var durationElement = audioPreview.element.querySelector('.Streams_preview_audio_duration');
                                durationElement.style.display = 'none';
                            })


                        });
                    } else if(fileStream.fields.type == 'Streams/image') {
                        $(fileItemInner).tool("Streams/preview", {
                            publisherId: fileStream.fields.publisherId,
                            streamName: fileStream.fields.name,
                            type: "Streams/image"
                        }).tool("Streams/image/preview").activate(function () {
                            var streamsPreview = Q.Tool.from(fileItemInner, "Streams/preview");
                            streamsPreview.state.onClose.add(function () {
                                removeItem();
                            })
                            var imagePreview = Q.Tool.from(fileItemInner, "Streams/image/preview");
                            imagePreview.preview.options.actions.position = 'tr';
                            imagePreview.preview.options.actions.size = '16';
                            imagePreview.options.templates.edit.name = 'Streams/fileManager/image/preview/edit';
                        });
                    } else if(fileStream.fields.type == 'Streams/category') {
                        $(fileItemInner).tool("Streams/preview", {
                            publisherId: fileStream.fields.publisherId,
                            streamName: fileStream.fields.name,
                            type: "Streams/image"
                        }).tool("Streams/category/preview").activate(function () {
                            var categoryPreview = Q.Tool.from(fileItemInner, "Streams/category/preview");
                            categoryPreview.state.templates.edit.name = 'Streams/fileManager/category/preview/edit';
                            categoryPreview.preview.options.actions.position = 'tr';
                            categoryPreview.preview.options.actions.size = '16';
                        });
                    }

                    tool.explorerEl.appendChild(fileItem);

                    fileItem.addEventListener('click', function (e) {
                        if(fileStream.fields.type == 'Streams/category') {
                            tool.state.currentDirStreamName = fileStream.fields.name;
                           // tool.state.history.streams.push(fileStream.fields.name);
                            var elementsToRemove = tool.state.history.streams.length - tool.state.history.currentIndex - 1;
                            tool.state.history.streams.splice(tool.state.history.currentIndex + 1, elementsToRemove, fileStream.fields.name);
                            tool.state.history.currentIndex = tool.state.history.streams.length - 1;
                            tool.refresh();

                            e.preventDefault();
                            return;
                        }
                        Q.handle(tool.state.onSelect, tool, [fileStream]);
                        e.preventDefault();
                    })
                }
            },
            showDialog: function () {
                var tool = this;
                var dialogCon = tool.fileManagerDialog = document.createElement('DIV');
                dialogCon.className = 'Streams_fileManager_dialog_con';
                var dialogInner = document.createElement('DIV');
                dialogInner.className = 'Streams_fileManager_dialog_inner';

                dialogInner.appendChild(tool.fileManagerEl);
                dialogCon.appendChild(dialogInner);
                tool.element.appendChild(dialogCon);
                tool.refresh();
            },
            closeDialog: function () {
                var tool = this;
                if(tool.fileManagerDialog && tool.fileManagerDialog.parentElement) {
                    tool.fileManagerDialog.parentElement.removeChild(tool.fileManagerDialog);
                }
            }
        }

    );

    Q.Template.set('Streams/fileManager/image/preview/edit',
        '<div class="Streams_preview_container Streams_preview_edit Q_clearfix">'
        + '<div class="Streams_fileManager_file_icon_con">'
        + '<img alt="{{alt}}" class="Streams_image_preview_icon">'
        + '</div>'
        + '<div class="Streams_image_preview_title Streams_preview_contents{{titleClass}}">'
        + '{{#if showTitle}}'
        + '<{{titleTag}} class="Streams_preview_title">{{{inplace}}}</{{titleTag}}>'
        + '{{/if}}'
        + '</div></div>'
    );
    Q.Template.set('Streams/fileManager/category/preview/edit',
        '<div class="Streams_preview_container Streams_preview_edit Q_clearfix">'
        + '<div class="Streams_fileManager_file_icon_con">'
        + '<img alt="{{alt}}" class="Streams_preview_icon">'
        + '</div>'
        + '<div class="Streams_preview_contents {{titleClass}}">'
        + '<{{titleTag}} class="Streams_preview_title">{{{inplace}}}</{{titleTag}}>'
        + '</div></div>'
    );
})(window.jQuery, window);
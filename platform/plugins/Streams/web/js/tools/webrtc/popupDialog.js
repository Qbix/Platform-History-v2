(function ($, window, undefined) {

    function PopupDialog(element, options) {
        var pupupInstance = this;
        this.element = element;
        this.content = options.content;
        this.closeButtonEl = null;
        this.popupDialogEl = null;
        this.hoverTimeout = null;
        this.active = false;
        this.hide = function (e) {
            if (!e || (e && (e.target == this.closeButtonEl || !pupupInstance.popupDialogEl.contains(e.target)))) {
                if (pupupInstance.popupDialogEl.parentElement) pupupInstance.popupDialogEl.parentElement.removeChild(pupupInstance.popupDialogEl);

                togglePopupClassName('', false, false);
                pupupInstance.active = false;

                if (!Q.info.useTouchEvents) {
                    window.removeEventListener('click', pupupInstance.hide);
                } else {
                    window.removeEventListener('touchend', pupupInstance.hide);
                }
            }
        }

        this.show = function (e) {
            pupupInstance.popupDialogEl.style.top = '';
            pupupInstance.popupDialogEl.style.left = '';
            pupupInstance.popupDialogEl.style.maxHeight = '';
            pupupInstance.popupDialogEl.style.maxWidth = '';
            togglePopupClassName('', false, false);
            let existingPopupDialog = document.querySelector('.webrtc-popup-dialog');
            if (existingPopupDialog && existingPopupDialog.parentElement) existingPopupDialog.parentElement.removeChild(existingPopupDialog);

            let triggeringElementRect = pupupInstance.element.getBoundingClientRect();

            pupupInstance.popupDialogEl.style.position = 'fixed';
            pupupInstance.popupDialogEl.style.visibility = 'hidden';
            pupupInstance.popupDialogEl.style.top = triggeringElementRect.y + triggeringElementRect.height + 20 + 'px';
            pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x + (triggeringElementRect.width / 2)) + 'px';

            if (pupupInstance.content instanceof Array) {
                for (let i in pupupInstance.content) {
                    pupupInstance.popupDialogEl.appendChild(pupupInstance.content[i])
                }
            } else {
                pupupInstance.popupDialogEl.appendChild(pupupInstance.content)
            }

            document.body.appendChild(pupupInstance.popupDialogEl);

            let popupRect = pupupInstance.popupDialogEl.getBoundingClientRect();
            pupupInstance.popupDialogEl.style.left = ((triggeringElementRect.x + (triggeringElementRect.width / 2)) - (popupRect.width / 2)) + 'px';

            //if ther is no room below (bottom) of button, show dialog above if there is enough room

            let roomBelowButton = window.innerHeight - (triggeringElementRect.y + triggeringElementRect.height);
            let roomBelowStartOfButton = window.innerHeight - triggeringElementRect.y;
            let roomBelowMidOfButton = window.innerHeight - (triggeringElementRect.y + (triggeringElementRect.height / 2));
            let roomAboveButton = triggeringElementRect.y;
            let roomAboveEndOfButton = triggeringElementRect.y + triggeringElementRect.height;
            let roomAboveMidOfButton = triggeringElementRect.y + (triggeringElementRect.height / 2);
            let roomToLeftOfButton = triggeringElementRect.x;
            let roomToRightOfStartOfButton = (window.innerWidth - triggeringElementRect.x);
            let roomToLeftOfMidButton = triggeringElementRect.x + (triggeringElementRect.x / 2);
            let roomToRightOfButton = (window.innerWidth - (triggeringElementRect.x + triggeringElementRect.width));
            let roomToRightOfMidButton = (window.innerWidth - (triggeringElementRect.x + (triggeringElementRect.width / 2)));
            let roomToLeftOfEndOfButton = triggeringElementRect.x + triggeringElementRect.width;
            let midYOfTriggeringElement = triggeringElementRect.y + triggeringElementRect.height / 2;
            let midXOfTriggeringElement = triggeringElementRect.x + triggeringElementRect.width / 2;

            if (roomBelowButton >= popupRect.height + 20) {
                //log('show 1');
                if (roomToLeftOfMidButton >= (popupRect.width / 2) && roomToRightOfMidButton >= (popupRect.width / 2)) {
                    //log('show 1.1');
                    pupupInstance.popupDialogEl.style.top = triggeringElementRect.y + triggeringElementRect.height + 20 + 'px';
                    pupupInstance.popupDialogEl.style.left = ((triggeringElementRect.x + (triggeringElementRect.width / 2)) - (popupRect.width / 2)) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-mid-below-position', false, false);
                } else if (roomToRightOfStartOfButton >= popupRect.width) {
                    //log('show 1.2');
                    pupupInstance.popupDialogEl.style.top = triggeringElementRect.y + triggeringElementRect.height + 20 + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-right-below-position', false, false);
                } else if (roomToLeftOfEndOfButton >= popupRect.width) {
                    //log('show 1.3');
                    pupupInstance.popupDialogEl.style.top = triggeringElementRect.y + triggeringElementRect.height + 20 + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x + triggeringElementRect.width) - popupRect.width + 'px';

                    togglePopupClassName('webrtc-popup-dialog-left-below-position', false, false);
                } else if (popupRect.width <= window.innerWidth) {
                    //log('show 1.4');
                    pupupInstance.popupDialogEl.style.top = triggeringElementRect.y + triggeringElementRect.height + 20 + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x - roomToLeftOfButton) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-winmid-below-position', false, false);
                } else {
                    //log('show 1.5');
                    pupupInstance.popupDialogEl.style.top = triggeringElementRect.y + triggeringElementRect.height + 20 + 'px';
                    pupupInstance.popupDialogEl.style.left = '0px';

                    togglePopupClassName('webrtc-popup-dialog-fullwidth-below-position', true, false);
                }
            } else if (roomAboveButton >= popupRect.height + 20) {
                //log('show 2');
                if (roomToLeftOfMidButton >= (popupRect.width / 2) && roomToRightOfMidButton >= (popupRect.width / 2)) {
                    //log('show 2.1');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y - popupRect.height - 20) + 'px';
                    pupupInstance.popupDialogEl.style.left = ((triggeringElementRect.x + (triggeringElementRect.width / 2)) - (popupRect.width / 2)) + 'px';
                    togglePopupClassName('webrtc-popup-dialog-mid-above-position', false, false);
                } else if (roomToRightOfStartOfButton >= popupRect.width) {
                    //log('show 2.2');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y - popupRect.height - 20) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-right-above-position', false, false);
                } else if (roomToLeftOfEndOfButton >= popupRect.width) {
                    //log('show 2.3');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y - popupRect.height - 20) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x + triggeringElementRect.width - popupRect.width) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-left-above-position', false, false);
                } else if (window.innerWidth >= popupRect.width) {
                    //log('show 2.4');;
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y - popupRect.height - 20) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x - popupRect.width / 2) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-winmid-above-position', false, false);
                } else {
                    //log('show 2.5');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y - popupRect.height - 20) + 'px';
                    pupupInstance.popupDialogEl.style.left = '0px';

                    togglePopupClassName('webrtc-popup-dialog-fullwidth-above-position', true, false);
                }
            } else if (Math.min(roomBelowMidOfButton, roomAboveMidOfButton) >= popupRect.height / 2) {
                //log('show 3');
                if (roomToRightOfButton >= popupRect.width + 20) {
                    //log('show 3.1');
                    pupupInstance.popupDialogEl.style.top = midYOfTriggeringElement - (popupRect.height / 2) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x + triggeringElementRect.width + 20) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-right-mid-position', false, false);
                } else if (roomToLeftOfButton >= popupRect.width + 20) {
                    //log('show 3.2');
                    pupupInstance.popupDialogEl.style.top = midYOfTriggeringElement - (popupRect.height / 2) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x - popupRect.width - 20) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-left-mid-position', false, false);
                } else {
                    //log('show 3.3');
                    pupupInstance.popupDialogEl.style.top = midYOfTriggeringElement - (popupRect.height / 2) + 'px';
                    pupupInstance.popupDialogEl.style.left = '0px';

                    togglePopupClassName('webrtc-popup-dialog-fullwidth-mid-position', true, false);
                }
            } else if (roomBelowStartOfButton >= popupRect.height) {
                //log('show 4');
                if (roomToRightOfButton >= popupRect.width + 20) {
                    //log('show 4.1');
                    pupupInstance.popupDialogEl.style.top = triggeringElementRect.y + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x + triggeringElementRect.width + 20) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-right-belowtop-position', false, false);
                } else if (roomToLeftOfButton >= popupRect.width + 20) {
                    //log('show 4.2');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x - popupRect.width - 20) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-left-belowtop-position', false, false);
                } else {
                    //log('show 4.3');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y) + 'px';
                    pupupInstance.popupDialogEl.style.left = '0px';

                    togglePopupClassName('webrtc-popup-dialog-fullwidth-belowtop-position', true, false);
                }
            } else if (roomAboveEndOfButton >= popupRect.height) {
                //log('show 5');
                if (roomToRightOfButton >= popupRect.width + 20) {
                    //log('show 5.1');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y + triggeringElementRect.height - popupRect.height) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x + triggeringElementRect.width + 20) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-right-abovebottom-position', false, false);
                } else if (roomToLeftOfButton >= popupRect.width + 20) {
                    //log('show 5.2');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y + triggeringElementRect.height - popupRect.height) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x - popupRect.width - 20) + 'px';

                    togglePopupClassName('webrtc-popup-dialog-left-abovebottom-position', false, false);
                } else {
                    //log('show 5.3');
                    pupupInstance.popupDialogEl.style.top = (triggeringElementRect.y + triggeringElementRect.height - popupRect.height) + 'px';
                    pupupInstance.popupDialogEl.style.left = '0px';

                    togglePopupClassName('webrtc-popup-dialog-fullwidth-abovebottom-position', false, false);
                }
            } else if (popupRect.height + 20 < window.innerHeight) {
                //log('show 6');
                if (roomToRightOfButton >= popupRect.width + 20) {
                    //log('show 6.1');
                    pupupInstance.popupDialogEl.style.top = (window.innerHeight / 2) - (popupRect.height / 2) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x + triggeringElementRect.width + 20) + 'px';
                    togglePopupClassName('webrtc-popup-dialog-right-winmid-position', false, false);

                } else if (roomToLeftOfButton >= popupRect.width + 20) {
                    //log('show 6.2');

                    pupupInstance.popupDialogEl.style.top = (window.innerHeight / 2) - (popupRect.height / 2) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x - 20 - popupRect.width) + 'px';
                    togglePopupClassName('webrtc-popup-dialog-left-winmid-position', false, false);
                } else if (popupRect.width <= window.innerWidth) {
                    //log('show 6.3');

                    pupupInstance.popupDialogEl.style.top = (window.innerHeight / 2) - (popupRect.height / 2) + 'px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x - roomToLeftOfButton) + 'px';
                    togglePopupClassName('webrtc-popup-dialog-winmid-winmid-position', false, false);
                } else {
                    //log('show 6.4');

                    pupupInstance.popupDialogEl.style.top = (window.innerHeight / 2) - (popupRect.height / 2) + 'px';
                    pupupInstance.popupDialogEl.style.left = '0px';
                    togglePopupClassName('webrtc-popup-dialog-fullwidth-winmid-position', true, false);
                }
            } else {
                //log('show 7');
                if (roomToRightOfButton >= popupRect.width + 20) {
                    //log('show 7.1');
                    pupupInstance.popupDialogEl.style.top = '0px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x + triggeringElementRect.width + 20) + 'px';
                    togglePopupClassName('webrtc-popup-dialog-right-fullheight-position', false, false);

                } else if (roomToLeftOfButton >= popupRect.width + 20) {
                    //log('show 7.2');

                    pupupInstance.popupDialogEl.style.top = '0px';
                    pupupInstance.popupDialogEl.style.left = (triggeringElementRect.x - 20 - popupRect.width) + 'px';
                    togglePopupClassName('webrtc-popup-dialog-left-fullheight-position', false, false);
                } else if (popupRect.width <= window.innerWidth) {
                    //log('show 7.3');

                    pupupInstance.popupDialogEl.style.top = (window.innerHeight / 2) - (popupRect.height / 2) + 'px';
                    pupupInstance.popupDialogEl.style.left = (window.innerWidth / 2) - (popupRect.width / 2) + 'px';
                    togglePopupClassName('webrtc-popup-dialog-winmid-fullheight-position', false, true);
                } else {
                    //log('show 7.4');
                    pupupInstance.popupDialogEl.style.top = '0px';
                    pupupInstance.popupDialogEl.style.left = '0px';
                    togglePopupClassName('webrtc-popup-dialog-fullwidth-fullheight-position', true, true);
                }
            }
            //log('show 7', pupupInstance.popupDialogEl);

            pupupInstance.popupDialogEl.style.visibility = '';

            pupupInstance.active = true;

            setTimeout(function () {
                if (!Q.info.useTouchEvents) {
                    window.addEventListener('click', pupupInstance.hide);
                } else {
                    window.addEventListener('touchend', pupupInstance.hide);
                }
            }, 0);
        }

        this.destroy = function () {
            this.element.removeEventListener('mouseenter', onElementMouseEnterListener);
            this.element.removeEventListener('mouseleave', onElementMouseLeaveListener);
            delete pupupInstance;
        }

        function togglePopupClassName(classNameToApply, addXScrollClass, addYScrollClass) {
            let classes = [
                'webrtc-popup-dialog-mid-below-position',
                'webrtc-popup-dialog-right-below-position',
                'webrtc-popup-dialog-left-below-position',
                'webrtc-popup-dialog-winmid-below-position',
                'webrtc-popup-dialog-fullwidth-below-position',
                'webrtc-popup-dialog-mid-above-position',
                'webrtc-popup-dialog-right-above-position',
                'webrtc-popup-dialog-left-above-position',
                'webrtc-popup-dialog-winmid-above-position',
                'webrtc-popup-dialog-fullwidth-above-position',
                'webrtc-popup-dialog-right-mid-position',
                'webrtc-popup-dialog-left-mid-position',
                'webrtc-popup-dialog-fullwidth-mid-position',
                'webrtc-popup-dialog-right-belowtop-position',
                'webrtc-popup-dialog-left-belowtop-position',
                'webrtc-popup-dialog-mid-belowtop-position',
                'webrtc-popup-dialog-fullwidth-belowtop-position',
                'webrtc-popup-dialog-right-abovebottom-position',
                'webrtc-popup-dialog-left-abovebottom-position',
                'webrtc-popup-dialog-fullwidth-abovebottom-position',
                'webrtc-popup-dialog-right-winmid-position',
                'webrtc-popup-dialog-left-winmid-position',
                'webrtc-popup-dialog-winmid-winmid-position',
                'webrtc-popup-dialog-fullwidth-winmid-position',
                'webrtc-popup-dialog-right-fullheight-position',
                'webrtc-popup-dialog-left-fullheight-position',
                'webrtc-popup-dialog-winmid-fullheight-position',
                'webrtc-popup-dialog-fullwidth-fullheight-position',
                'webrtc-popup-dialog-x-scroll',
                'webrtc-popup-dialog-y-scroll',
            ];
            for (let i in classes) {
                if (classes[i] == classNameToApply || (classes[i] == 'webrtc-popup-dialog-x-scroll' && addXScrollClass) || (classes[i] == 'webrtc-popup-dialog-y-scroll' && addYScrollClass)) {
                    continue;
                }
                pupupInstance.popupDialogEl.classList.remove(classes[i]);
            }

            if (classNameToApply && classNameToApply != '' && !pupupInstance.popupDialogEl.classList.contains(classNameToApply)) {
                pupupInstance.popupDialogEl.classList.add(classNameToApply);
            }

            if (addXScrollClass) {
                pupupInstance.popupDialogEl.classList.add('webrtc-popup-dialog-x-scroll');
            }
            if (addYScrollClass) {
                pupupInstance.popupDialogEl.classList.add('webrtc-popup-dialog-y-scroll');
            }
        }

        this.popupDialogEl = document.createElement('DIV');
        this.popupDialogEl.className = 'webrtc-popup-dialog';
        if (options.className) {
            this.popupDialogEl.classList.add(options.className);
        }
        this.closeButtonEl = document.createElement('DIV');
        this.closeButtonEl.className = 'webrtc-close-sign';
        this.popupDialogEl.appendChild(this.closeButtonEl);

        this.closeButtonEl.addEventListener('click', function (e) {
            pupupInstance.hide(e);
        });

        if (!Q.info.useTouchEvents) {
            if(options.triggerOn == 'hover') {
                this.element.addEventListener('mouseenter', onElementMouseEnterListener);

                this.element.addEventListener('mouseleave', onElementMouseLeaveListener);
    
                this.popupDialogEl.addEventListener('mouseenter', function (e) {
                    removeHoverTimerIfExists();
                })
                this.popupDialogEl.addEventListener('mouseleave', function (e) {
                    pupupInstance.hoverTimeout = setTimeout(function () {
                        pupupInstance.hide();
                    }, 600)
    
                });
            } else {
                this.element.addEventListener('click', function (e) {
                    if (pupupInstance.active) {
                        console.log('popupDialog: hide')
                        pupupInstance.hide(e);
                    } else {
                        console.log('popupDialog: show')
                        pupupInstance.show(e);
                    }
    
                });
            }

        } else {
            this.element.addEventListener('touchend', function (e) {
                if (pupupInstance.active) {
                    pupupInstance.hide(e);
                } else {
                    pupupInstance.show(e);
                }

            });
        }

        function onElementMouseEnterListener(e) {
            removeHoverTimerIfExists();
            pupupInstance.show(e);
        }

        function onElementMouseLeaveListener(e) {
            pupupInstance.hoverTimeout = setTimeout(function () {
                pupupInstance.hide(e);
            }, 600)
        }

        function removeHoverTimerIfExists() {
            if (pupupInstance.hoverTimeout != null) {
                clearTimeout(pupupInstance.hoverTimeout);
                pupupInstance.hoverTimeout = null;
            }
        }
    }


    Q.Tool.define("Streams/webrtc/popupDialog", function (options) {
        var tool = this;
        tool.initPopupDialog();
    },

        {
            className: null,
            content: null,
            triggerOn: 'hover'
        },

        {
            initPopupDialog: function () {
                var tool = this;
                tool.popupDialog = new PopupDialog(tool.element, {
                    className: tool.state.className,
                    content: tool.state.content,
                    triggerOn: tool.state.triggerOn,
                })
            },
            hide: function () {
                var tool = this;
                if(tool.popupDialog) {
                    tool.popupDialog.hide();
                }
            },
            destroy: function () {
                var tool = this;
                if(tool.popupDialog) {
                    tool.popupDialog.destroy();
                }
            }
        }

    );

})(window.jQuery, window);
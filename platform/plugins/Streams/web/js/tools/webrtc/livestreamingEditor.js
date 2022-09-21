(function ($, window, undefined) {
    var _streamingIcons = {
        addItem: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>',
        removeItem: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 16.538l-4.592-4.548 4.546-4.587-1.416-1.403-4.545 4.589-4.588-4.543-1.405 1.405 4.593 4.552-4.547 4.592 1.405 1.405 4.555-4.596 4.591 4.55 1.403-1.416z"/></svg>',
        moveUp: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11.574 3.712c.195-.323.662-.323.857 0l9.37 15.545c.2.333-.039.757-.429.757l-18.668-.006c-.385 0-.629-.422-.428-.758l9.298-15.538zm.429-2.483c-.76 0-1.521.37-1.966 1.111l-9.707 16.18c-.915 1.523.182 3.472 1.965 3.472h19.416c1.783 0 2.879-1.949 1.965-3.472l-9.707-16.18c-.446-.741-1.205-1.111-1.966-1.111z"/></svg>',
        moveDown: '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><path d="M12.431,19.509c-0.195,0.323-0.662,0.323-0.857,0L2.205,3.964c-0.2-0.333,0.039-0.757,0.429-0.757l18.668,0.006 c0.385,0,0.629,0.422,0.428,0.758L12.431,19.509z M12.002,21.992c0.76,0,1.521-0.37,1.966-1.111l9.707-16.179 c0.915-1.523-0.183-3.473-1.965-3.473H2.294c-1.783,0-2.879,1.949-1.965,3.473l9.707,16.179 C10.482,21.622,11.242,21.992,12.002,21.992z"/></svg>',
        visible: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z"/></svg>',
        hidden: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11.885 14.988l3.104-3.098.011.11c0 1.654-1.346 3-3 3l-.115-.012zm8.048-8.032l-3.274 3.268c.212.554.341 1.149.341 1.776 0 2.757-2.243 5-5 5-.631 0-1.229-.13-1.785-.344l-2.377 2.372c1.276.588 2.671.972 4.177.972 7.733 0 11.985-8.449 11.985-8.449s-1.415-2.478-4.067-4.595zm1.431-3.536l-18.619 18.58-1.382-1.422 3.455-3.447c-3.022-2.45-4.818-5.58-4.818-5.58s4.446-7.551 12.015-7.551c1.825 0 3.456.426 4.886 1.075l3.081-3.075 1.382 1.42zm-13.751 10.922l1.519-1.515c-.077-.264-.132-.538-.132-.827 0-1.654 1.346-3 3-3 .291 0 .567.055.833.134l1.518-1.515c-.704-.382-1.496-.619-2.351-.619-2.757 0-5 2.243-5 5 0 .852.235 1.641.613 2.342z"/></svg>',
        enabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="25px" height="24px" viewBox="0 0 25 24" enable-background="new 0 0 25 24" xml:space="preserve"> <path d="M9.981,19.759c0,0.068-0.088,0.089-0.122,0.151c-0.013,0.021-0.07,0.045-0.088,0.064c-0.035,0.039-0.102,0.067-0.15,0.088 c-0.025,0.01-0.063,0.015-0.088,0.016c-0.025,0.004-0.06,0.003-0.084-0.001c-0.069-0.011-0.086-0.136-0.147-0.17L4.59,16.266H0.603 c-0.028,0-0.056,0.104-0.084,0.1c-0.027-0.01-0.053,0.035-0.077,0.021c-0.05-0.026-0.089-0.04-0.118-0.09 c-0.014-0.024-0.076-0.037-0.083-0.063c-0.007-0.026-0.062-0.041-0.062-0.07V6.845c0-0.028,0.055-0.057,0.062-0.084 c0.007-0.027,0.044-0.053,0.058-0.078C0.312,6.66,0.343,6.638,0.363,6.617c0.04-0.04,0.096-0.098,0.15-0.113 c0.026-0.007,0.062-0.04,0.09-0.04h3.988l4.708-3.505c0.022-0.013,0.044-0.014,0.067-0.024c0.065-0.028,0.086-0.014,0.156-0.017 C9.549,2.924,9.574,2.934,9.599,2.94c0.023,0.011,0.048,0.022,0.07,0.037C9.69,2.992,9.711,3.01,9.729,3.029 c0.036,0.039,0.146,0.087,0.158,0.138C9.892,3.193,9.979,3.22,9.979,3.246v16.513H9.981z"/> <path d="M11.871,19.104c-0.117,0-0.234-0.043-0.324-0.129c-0.184-0.182-0.188-0.478-0.01-0.662 c6.658-6.859,0.281-13.344,0.008-13.617c-0.186-0.182-0.186-0.477-0.004-0.66c0.182-0.183,0.477-0.184,0.66-0.002 c0.074,0.074,7.297,7.416,0.006,14.932C12.117,19.059,11.994,19.104,11.871,19.104z"/> <path d="M14.943,21.036c-0.094,0.096-0.215,0.144-0.336,0.144c-0.117,0-0.234-0.046-0.324-0.132 c-0.186-0.181-0.189-0.478-0.012-0.659c8.684-8.95,0.362-17.407,0.01-17.764c-0.188-0.182-0.188-0.477-0.004-0.66 c0.182-0.184,0.477-0.184,0.658-0.003C15.031,2.056,24.258,11.433,14.943,21.036z"/> </svg>',
        disabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="25px" height="24px" viewBox="0 0 25 24" enable-background="new 0 0 25 24" xml:space="preserve"> <path d="M9.979,3.246c0-0.026-0.087-0.053-0.092-0.079C9.875,3.116,9.765,3.068,9.729,3.029C9.711,3.01,9.69,2.992,9.669,2.977 C9.647,2.962,9.622,2.951,9.599,2.94c-0.025-0.006-0.05-0.016-0.077-0.022c-0.07,0.003-0.091-0.011-0.156,0.017 c-0.023,0.01-0.045,0.011-0.067,0.024L4.591,6.464H0.603c-0.028,0-0.064,0.033-0.09,0.04c-0.054,0.015-0.11,0.073-0.15,0.113 C0.343,6.638,0.312,6.66,0.299,6.683C0.285,6.708,0.248,6.734,0.241,6.761C0.234,6.788,0.179,6.817,0.179,6.845v9.317 c0,0.029,0.055,0.044,0.062,0.07c0.007,0.026,0.069,0.039,0.083,0.063c0.029,0.05,0.068,0.063,0.118,0.09 c0.024,0.015,0.05-0.03,0.077-0.021c0.028,0.004,0.056-0.1,0.084-0.1H4.59l1.396,1.079l3.993-4.638V3.246z"/> <path d="M9.302,19.907c0.061,0.034,0.078,0.159,0.147,0.17c0.024,0.004,0.059,0.005,0.084,0.001 c0.025-0.001,0.063-0.006,0.088-0.016c0.048-0.021,0.115-0.049,0.15-0.088c0.018-0.02,0.075-0.043,0.088-0.064 c0.034-0.063,0.122-0.083,0.122-0.151H9.979v-4.622l-2.738,3.178L9.302,19.907z"/> <path d="M14.483,7.478c-0.949-2.085-2.251-3.412-2.282-3.443c-0.184-0.182-0.479-0.181-0.66,0.002 c-0.182,0.183-0.182,0.478,0.004,0.66c0.121,0.121,1.444,1.467,2.297,3.525l0.35-0.406L14.483,7.478z"/> <path d="M14.394,10.011c0.475,2.369,0.058,5.299-2.856,8.301c-0.178,0.185-0.174,0.48,0.01,0.662 c0.09,0.086,0.207,0.129,0.324,0.129c0.123,0,0.246-0.045,0.336-0.138c3.443-3.549,3.648-7.058,2.899-9.783l-0.063,0.074 L14.394,10.011z"/> <path d="M16.937,4.629c-0.997-1.646-1.97-2.637-2.001-2.667c-0.182-0.181-0.477-0.181-0.658,0.003 c-0.185,0.183-0.185,0.478,0.004,0.66c0.116,0.117,1.094,1.115,2.045,2.714l0.392-0.455L16.937,4.629z"/> <path d="M17.113,6.853c1.516,3.375,2.169,8.372-2.842,13.536c-0.178,0.182-0.174,0.479,0.012,0.659 c0.09,0.086,0.207,0.132,0.324,0.132c0.121,0,0.242-0.048,0.336-0.144c5.503-5.673,4.534-11.267,2.8-14.915l-0.028,0.033 L17.113,6.853z"/> <polygon points="20.305,1.034 19.104,0 15.508,4.175 14.896,4.884 12.988,7.102 12.371,7.815 8.158,12.707 4.162,17.348 0.179,21.971 1.38,23.006 5.418,18.316 8.158,15.137 13.223,9.257 13.869,8.506 15.895,6.155 16.506,5.445 18.203,3.473 18.811,2.768 "/> </svg>',
        liveOn: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="26px" height="15px" viewBox="-0.034668 -0.6616211 26 15" enable-background="new -0.034668 -0.6616211 26 15" xml:space="preserve"> <defs> </defs> <path fill="#C12337" d="M23.887207,0.0009766h-2.0361328L3.1806641,0H1.1430664 C0.5151367,0,0.0043945,0.2900391,0.0019531,0.6479492L0.0009766,12.2397461L0,13.4038086 c0.0009766,0.3574219,0.5117188,0.6494141,1.1420898,0.6494141l20.7070313,0.0019531h2.0371094 c0.6298828,0,1.1416016-0.2929688,1.1416016-0.6513672L25.0288086,0.652832 C25.0288086,0.2929688,24.5170898,0.0009766,23.887207,0.0009766z M7.340332,10.9155273H3.0019531V3.1391602h1.0146484v6.9326172 H7.340332V10.9155273z M9.4628906,10.9155273H8.4477539V3.1391602h1.0151367V10.9155273z M14.0317383,10.9155273h-1.1074219 l-2.5498047-7.7763672h1.0961914l1.2109375,3.8300781c0.3237305,1.0507813,0.612793,1.9960938,0.831543,2.9082031h0.0234375 c0.2197266-0.9013672,0.53125-1.8818359,0.8886719-2.8969727l1.3154297-3.8413086h1.0722656L14.0317383,10.9155273z M22.027832,10.9155273h-4.3867188V3.1391602h4.2128906v0.8422852h-3.1962891v2.4575195h3.0117188v0.8305664h-3.0117188v2.8041992 h3.3701172V10.9155273z"/> </svg>',
        liveOff: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="26px" height="24px" viewBox="-0.034668 -0.8662109 26 24" enable-background="new -0.034668 -0.8662109 26 24" xml:space="preserve"> <defs> </defs> <path fill="#C12337" d="M6.9995117,15.390625H3.0019531V7.6142578h1.0146484v6.9326172H7.340332v0.4482422l1.1074219-1.2851563 V7.6142578h1.0151367V12.53125l1.828125-2.1225586l-0.9165039-2.7944336h1.0961914l0.5981445,1.8916016l4.3320313-5.0302734 L3.1806641,4.4750977H1.1430664c-0.6279297,0-1.1386719,0.2900391-1.1411133,0.6479492L0.0009766,16.7148438L0,17.8789063 c0.0009766,0.3574219,0.5117188,0.6494141,1.1420898,0.6494141H4.296875L6.9995117,15.390625z"/> <path fill="#C12337" d="M23.887207,4.4760742h-2.0361328h-3.3583984l-2.703125,3.1381836h1.0234375l-2.78125,7.7763672h-1.1074219 l-1.0566406-3.2226563l-2.4047852,2.7919922v0.4306641H9.0922852l-2.703125,3.1376953l15.4599609,0.0019531h2.0371094 c0.6298828,0,1.1416016-0.2929688,1.1416016-0.6513672l0.0009766-12.7509766 C25.0288086,4.7680664,24.5170898,4.4760742,23.887207,4.4760742z M22.027832,15.390625h-4.3867188V7.6142578h4.2128906V8.456543 h-3.1962891v2.4575195h3.0117188v0.8305664h-3.0117188v2.8041992h3.3701172V15.390625z"/> <path fill="#C12337" d="M13.5131836,14.3525391h0.0234375c0.2197266-0.9013672,0.53125-1.8818359,0.8886719-2.8969727 l1.2832031-3.7460938l-3.078125,3.5732422l0.0512695,0.1616211C13.0053711,12.4951172,13.2944336,13.4404297,13.5131836,14.3525391z "/> <polygon id="StreamsWebrtcCrossline_1_" points="22.6928711,1.0341797 21.4916992,0 2.5673828,21.9707031 3.7685547,23.0058594 "/> </svg>',
        disabledEnabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="25px" height="24px" viewBox="0 0 25 24" enable-background="new 0 0 25 24" xml:space="preserve"> <path d="M9.302,19.907c0.061,0.034,0.078,0.159,0.147,0.17c0.024,0.004,0.059,0.005,0.084,0.001 c0.025-0.001,0.063-0.006,0.088-0.016c0.048-0.021,0.115-0.049,0.15-0.088c0.018-0.02,0.075-0.043,0.088-0.064 c0.034-0.063,0.122-0.083,0.122-0.151H9.979v-4.622l-2.738,3.178L9.302,19.907z"/> <polygon class="StreamsWebrtcDisabledparts" points="5.986,17.345 7.241,18.314 9.979,15.137 9.979,12.707 "/> <path d="M9.979,3.246c0-0.026-0.087-0.053-0.092-0.079C9.875,3.116,9.765,3.068,9.729,3.029C9.711,3.01,9.69,2.992,9.669,2.977 C9.647,2.962,9.622,2.951,9.599,2.94c-0.025-0.006-0.05-0.016-0.077-0.022c-0.07,0.003-0.091-0.011-0.156,0.017 c-0.023,0.01-0.045,0.011-0.067,0.024L4.591,6.464H0.603c-0.028,0-0.064,0.033-0.09,0.04c-0.054,0.015-0.11,0.073-0.15,0.113 C0.343,6.638,0.312,6.66,0.299,6.683C0.285,6.708,0.248,6.734,0.241,6.761C0.234,6.788,0.179,6.817,0.179,6.845v9.317 c0,0.029,0.055,0.044,0.062,0.07c0.007,0.026,0.069,0.039,0.083,0.063c0.029,0.05,0.068,0.063,0.118,0.09 c0.024,0.015,0.05-0.03,0.077-0.021c0.028,0.004,0.056-0.1,0.084-0.1H4.59l1.396,1.079l3.993-4.638V3.246z"/> <g id="StreamsWebrtcWaves"> <path class="StreamsWebrtcWaves1" d="M14.483,7.478c-0.949-2.085-2.251-3.412-2.282-3.443c-0.184-0.182-0.479-0.181-0.66,0.002 c-0.182,0.183-0.182,0.478,0.004,0.66c0.121,0.121,1.444,1.467,2.297,3.525l0.35-0.406L14.483,7.478z"/> <path class="StreamsWebrtcWaves1" d="M14.394,10.011c0.475,2.369,0.058,5.299-2.856,8.301c-0.178,0.185-0.174,0.48,0.01,0.662 c0.09,0.086,0.207,0.129,0.324,0.129c0.123,0,0.246-0.045,0.336-0.138c3.443-3.549,3.648-7.058,2.899-9.783l-0.063,0.074 L14.394,10.011z"/> <path class="StreamsWebrtcWaves2" d="M16.937,4.629c-0.997-1.646-1.97-2.637-2.001-2.667c-0.182-0.181-0.477-0.181-0.658,0.003 c-0.185,0.183-0.185,0.478,0.004,0.66c0.116,0.117,1.094,1.115,2.045,2.714l0.392-0.455L16.937,4.629z"/> <path class="StreamsWebrtcWaves2" d="M17.113,6.853c1.516,3.375,2.169,8.372-2.842,13.536c-0.178,0.182-0.174,0.479,0.012,0.659 c0.09,0.086,0.207,0.132,0.324,0.132c0.121,0,0.242-0.048,0.336-0.144c5.503-5.673,4.534-11.267,2.8-14.915l-0.028,0.033 L17.113,6.853z"/> <path class="StreamsWebrtcWaves1 StreamsWebrtcDisabledparts" d="M14.191,7.815l-0.35,0.406c0.228,0.55,0.423,1.148,0.552,1.79l0.649-0.754l0.063-0.074 c-0.168-0.612-0.385-1.182-0.623-1.706L14.191,7.815z"/> <path class="StreamsWebrtcDisabledparts StreamsWebrtcWaves2" d="M16.718,4.884l-0.392,0.455c0.272,0.457,0.54,0.964,0.787,1.514l0.602-0.698l0.028-0.033 c-0.258-0.543-0.533-1.042-0.807-1.492L16.718,4.884z"/> </g> <polygon id="StreamsWebrtcCrossline" points="20.305,1.034 19.104,0 0.179,21.971 1.38,23.006 "/> </svg>',
        playIcon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="44px" height="50px" viewBox="-0.53 0 44 50" enable-background="new -0.53 0 44 50" xml:space="preserve"> <defs> </defs> <polygon points="0,0 43.143,24.91 0,49.82 "/> </svg>',
        pauseIcon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="44px" height="51px" viewBox="-0.53 -0.91 44 51" enable-background="new -0.53 -0.91 44 51" xml:space="preserve"> <defs> </defs> <rect width="16.173" height="50"/> <rect x="26.97" y="0.09" width="16.173" height="50"/> </svg>'
    }

    var ua = navigator.userAgent;
    var _isMobile = false;
    var _isiOS = false;
    var _isAndroid = false;
    var _isiOSCordova = false;
    var _isAndroidCordova = false;
    if (ua.indexOf('iPad') != -1 || ua.indexOf('iPhone') != -1 || ua.indexOf('iPod') != -1) _isiOS = true;
    if (ua.indexOf('Android') != -1) _isAndroid = true;
    if (ua.indexOf('Android') != -1 || ua.indexOf('iPhone') != -1) _isMobile = true;
    if (typeof cordova != 'undefined' && _isiOS) _isiOSCordova = true;
    if (typeof cordova != 'undefined' && _isAndroid) _isAndroidCordova = true;

    function copyToClipboard(el) {
        if(Q.info.platform === 'ios') {
            var oldContentEditable = el.contentEditable,
                oldReadOnly = el.readOnly,
                range = document.createRange();

            el.contentEditable = true;
            el.readOnly = false;
            range.selectNodeContents(el);

            var s = window.getSelection();
            s.removeAllRanges();
            s.addRange(range);

            el.setSelectionRange(0, 999999); // A big number, to cover anything that could be inside the element.

            el.contentEditable = oldContentEditable;
            el.readOnly = oldReadOnly;

            document.execCommand('copy');
            return;
        }
        var tempEl = document.createElement('textarea');
        tempEl.value = el.value || el.innerText;
        tempEl.setAttribute('readonly', '');
        tempEl.style.position = 'absolute';
        tempEl.style.left = '-9999px';
        document.body.appendChild(tempEl);
        var selected =
            document.getSelection().rangeCount > 0
                ? document.getSelection().getRangeAt(0)
                : false;
        tempEl.select();
        document.execCommand('copy');
        document.body.removeChild(tempEl);
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
    };

    /**
     * Streams/webrtc/control tool.
     * Users can chat with each other via WebRTC using Twilio or raw streams
     * @module Streams
     * @class Streams webrtc
     * @constructor
     * @param {Object} options
     *  Hash of possible options
     */
    Q.Tool.define("Streams/webrtc/streamingEditor", function(options) {
            this.advancedLiveStreamingBox = null;

            /*if (!options.webRTClibraryInstance) {
                throw "Video room should be created";
            }*/

            this.state = Q.extend({}, this.state, options);
        },

        {
            managingScenes: true,
            managingVisualSources: true,
            managingAudioSources: true
        },

        {
            create: function() {
                if(this.advancedLiveStreamingBox != null) return this.advancedLiveStreamingBox;
                var tool = this;
                var controlsTool = this.state.controlsTool;
                var roomStream = controlsTool.WebRTCClass.roomStream();
                var desktopDialogueEl = null;
                var mobileHorizontaldialogueEl = null;
                var mobileVerticaldialogueEl = null;
                var activeDialogue = null;
                var isHidden = true;
                var dialogWidth = 996;

                var _dialogueEl = null;
                var _previewEl = null;
                var _resizingElement = null;
                var _resizingElementTool = null;
                var _fileManagerTool = null;
                var _streamingCanvas = null;
                var _scenesEl = null;
                var _sourcesEl = null;
                var _optionsEl = null;

                var scenesInterface = (function () {

                    var _scenesList = [];
                    var _activeScene = null;

                    var SceneListItem = function (name) {
                        var sceneListInstance = this;
                        this._title = name != null ? name : null;
                        this.itemEl = null;
                        this.sceneInstance = null;
                        this.remove = function () {
                            var currentItem = this;
                            if (this.itemEl != null && this.itemEl.parentNode != null) this.itemEl.parentNode.removeChild(this.itemEl);
                            for (var i in _scenesList) {
                                if (_scenesList[i] == currentItem) {
                                    _scenesList.splice(i, 1);
                                    break;
                                }
                            }
                        };
                        this.isActive = function () {
                            var scenes = controlsTool.WebRTCLib.mediaManager.canvasComposer.getScenes();
                            for (let i in scenes) {
                                if (scenes[i] == this.sceneInstance) {
                                    return true;
                                }
                            }
                            return false;
                        };

                        var itemEl = document.createElement('DIV');
                        itemEl.className = 'Streams_webrtc_popup-scenes-item';
                        this.itemEl = itemEl;

                        itemEl.addEventListener('click', function (e) {
                            selectScene(sceneListInstance);
                        })

                    }
                    Object.defineProperties(SceneListItem.prototype, {
                        'title': {
                            'set': function (val) {
                                this._title = val;
                                if (this.itemEl) this.itemEl.innerHTML = val;
                            },
                            'get': function (val) {
                                return this._title;
                            }
                        }
                    });

                    function addNewScene(name) {
                        controlsTool.WebRTCLib.mediaManager.canvasComposer.createScene(name);
                        syncList();
                    }

                    function selectScene(sceneItem) {
                        console.log('selectScene', sceneItem, sceneItem.itemEl);
                        if (sceneItem.itemEl && !sceneItem.itemEl.classList.contains('Streams_webrtc_popup-scenes-item-active')) {
                            console.log('selectScene add class');
                            sceneItem.itemEl.classList.add('Streams_webrtc_popup-scenes-item-active');
                        }
                        var switchScene = _activeScene != sceneItem;
                        _activeScene = sceneItem;
                        let sources = sourcesInterface.visualSources.getSourcesList();
                        for(let s in sources) {
                            if(sources[s].resizingElement != null && sources[s].resizingElement.parentElement) {
                                sources[s].resizingElement.parentElement.removeChild(sources[s].resizingElement);
                            }
                        }
                        controlsTool.WebRTCLib.mediaManager.canvasComposer.selectScene(_activeScene.sceneInstance);
                        for (var i in _scenesList) {
                            if (_scenesList[i] == sceneItem) continue;
                            if (_scenesList[i].itemEl.classList.contains('Streams_webrtc_popup-scenes-item-active')) _scenesList[i].itemEl.classList.remove('Streams_webrtc_popup-scenes-item-active');
                        }

                        sourcesInterface.update();
                    }

                    function moveSceneUp() {
                        console.log('moveUp');
                        controlsTool.WebRTCLib.mediaManager.canvasComposer.moveSceneUp(_activeScene.sceneInstance);

                        sortScenesList();
                    }

                    function moveSceneDown() {
                        console.log('moveSceneDown');
                        controlsTool.WebRTCLib.mediaManager.canvasComposer.moveSceneDown(_activeScene.sceneInstance);

                        sortScenesList();
                    }

                    function removeScene() {
                        console.log('removeScene', _activeScene);
                        if (_activeScene != null) {
                            let sceneToRemove = _activeScene;
                            let indexOfScreneToRemove;
                            let sceneToSwitchTo;
                            if (_scenesList.length > 1) {
                                for (let s in _scenesList) {
                                    if (_scenesList[s] == _activeScene) {
                                        indexOfScreneToRemove = s;
                                        break;
                                    }
                                }

                                if (_scenesList[indexOfScreneToRemove + 1] != null) {
                                    selectScene(_scenesList[indexOfScreneToRemove + 1]);
                                } else if (_scenesList[indexOfScreneToRemove - 1] != null) {
                                    selectScene(_scenesList[indexOfScreneToRemove - 1]);
                                }

                                controlsTool.WebRTCLib.mediaManager.canvasComposer.removeScene(sceneToRemove.sceneInstance);
                                syncList();
                            } else {
                                //at least once scene should exist
                            }

                        };
                    }

                    function createSceneItem(item) {
                        if (item == null) return;
                        var itemEl = document.createElement('DIV');
                        itemEl.className = 'Streams_webrtc_popup-scenes-item';
                        item.itemEl = itemEl;
                        _scenesList.push(item)
                        _scenesEl.appendChild(itemEl);
                        _scenesEl.addEventListener('click', function (e) {
                            selectScene(item);
                        })

                    }

                    function addSceneItemToList(item) {
                        console.log('scenesInterface: addSceneItemToList', item, item.title)

                        if (item == null || _scenesEl == null) return;
                        _scenesList.push(item)
                        _scenesEl.appendChild(item.itemEl);
                    }

                    function sortScenesList(type) {
                        var listArr = _scenesList;
                        var listEl = _scenesEl;
                        var scenes = controlsTool.WebRTCLib.mediaManager.canvasComposer.getScenes();

                        console.log('sortList: scenes', scenes, listArr);

                        if (scenes.length !== listArr.length) {
                            return;
                        }
                        listArr.sort((a, b) => {
                            return scenes.findIndex(p => p === a.sceneInstance) - scenes.findIndex(p => p === b.sceneInstance);
                        });

                        console.log('sortList: listArr', listArr.map(el => { return el.itemEl.innerText }));
                        console.log('sortList: NOT sortedElements', Array.from(listEl.childNodes).map(el => { return el.innerText }))

                        listEl.innerHTML == '';
                        for (let e = 0; e < listArr.length; e++) {
                            listEl.appendChild(listArr[e].itemEl)
                        }

                    }

                    function syncList() {

                        console.log('scenes: syncList _scenesList', _scenesList.length);

                        for (let i = _scenesList.length - 1; i >= 0; i--) {
                            console.log('scenes: syncList _scenesList', _scenesList[i]);
                            if (_scenesList[i] == null) continue;

                            if (_scenesList[i].isActive() == false) {
                                console.log('scenes: syncList remove', _scenesList[i]);

                                _scenesList[i].remove();
                                continue;
                            }
                        }

                        var scenes = controlsTool.WebRTCLib.mediaManager.canvasComposer.getScenes();

                        console.log('scenesInterface: all', scenes);

                        for (let s in scenes) {
                            console.log('CONTROLS ADD SCENES', scenes[s])
                            console.log('CONTROLS ADD SOURCES', scenes[s].sources)
                            let sceneAlreadyExists = false;
                            for (let e in _scenesList) {
                                if (_scenesList[e].sceneInstance == scenes[s]) sceneAlreadyExists = true;
                            }
                            if (sceneAlreadyExists) continue;
                            console.log('scenesInterface: not exist')

                            var item = new SceneListItem()
                            item.title = scenes[s].title;
                            item.sceneInstance = scenes[s];
                            addSceneItemToList(item);

                            if (scenes[s].title == 'default') {
                                item.title = 'default';
                                selectScene(item)
                            }

                        }

                        //sortList('visual');
                    }

                    var addNewScenePopup = (function () {
                        var _dialogueEl = null;
                        var _isHidden = true;

                        console.log('addNewScenePopup')
                        var dialogue = document.createElement('DIV');
                        dialogue.className = 'Streams_webrtc_dialog-box Streams_webrtc_popup-add-scene Streams_webrtc_hidden';
                        _dialogueEl = dialogue;
                        var close = document.createElement('div');
                        close.className = 'Streams_webrtc_close-dialog-sign';
                        close.style.backgroundImage = 'url("' + Q.url("{{Q}}/img/close.png") + '"';
                        close.style.backgroundRepeat = 'no-repeat';
                        close.style.backgroundSize = 'cover';

                        var dialogTitle = document.createElement('H3');
                        dialogTitle.innerHTML = 'Add scene';
                        dialogTitle.className = 'Streams_webrtc_dialog-header Q_dialog_title';

                        var dialogInner = document.createElement('DIV');
                        dialogInner.className = 'Streams_webrtc_dialog-inner';
                        var boxContent = document.createElement('DIV');
                        boxContent.className = 'Streams_webrtc_popup-streaming-box Streams_webrtc_popup-box';

                        var sceneNameInputCon = document.createElement('DIV');
                        sceneNameInputCon.className = 'Streams_webrtc_dialog-name-con';
                        var sceneNameInputText = document.createElement('SPAN');
                        sceneNameInputText.className = 'Streams_webrtc_dialog-name-text';
                        sceneNameInputText.innerHTML = 'Please, enter name of scene';
                        var sceneNameInput = document.createElement('INPUT');
                        sceneNameInput.className = 'Streams_webrtc_dialog-name';
                        sceneNameInput.type = 'text';
                        sceneNameInput.placeholder = 'Enter name of scene';
                        sceneNameInput.name = 'nameOfScene';

                        var buttonsCon = document.createElement('DIV');
                        buttonsCon.className = 'Streams_webrtc_dialog-buttons';
                        var okButton = document.createElement('BUTTON');
                        okButton.className = 'Streams_webrtc_dialog-ok-btn';
                        okButton.innerHTML = 'OK';

                        sceneNameInputCon.appendChild(sceneNameInputText);
                        sceneNameInputCon.appendChild(sceneNameInput);
                        boxContent.appendChild(sceneNameInputCon);
                        buttonsCon.appendChild(okButton);
                        boxContent.appendChild(buttonsCon);
                        dialogInner.appendChild(dialogTitle);

                        dialogue.appendChild(close);
                        dialogInner.appendChild(boxContent);
                        dialogue.appendChild(dialogInner);

                        controlsTool.WebRTCClass.roomsMediaContainer().appendChild(dialogue);

                        setTimeout(function () {
                            Q.activate(
                                Q.Tool.setUpElement(
                                    dialogue, // or pass an existing element
                                    "Q/resize",
                                    {
                                        move: true,
                                        activateOnElement: dialogTitle,
                                        resize: false,
                                        active: true,
                                        moveWithinArea: 'window',
                                    }
                                ),
                                {},
                                function () {

                                }
                            );
                        }, 3000)

                        var dialogWidth = 400;
                        dialogue.style.width = dialogWidth + 'px';
                        console.log('dialogWidth', dialogWidth);
                        if (_isMobile) {
                            dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                            dialogue.style.bottom = '10px';
                        } else {
                            dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                            dialogue.style.top = (window.innerHeight / 2 - 100) + 'px';
                        }

                        close.addEventListener('click', function () {
                            hideDialog();
                        });

                        okButton.addEventListener('click', function () {
                            if (sceneNameInput.value != '') {
                                var val = sceneNameInput.value;
                                addNewScene(val);
                                hideDialog();
                                sceneNameInput.value = '';
                            }
                        });

                        function setDefaultSceneName() {
                            sceneNameInput.value = 'Scene ' + parseInt(_scenesList.length + 1)
                        }

                        function closeOnWindowClick(e) {
                            if (!(_dialogueEl.contains(e.target) || e.target.matches('.Streams_webrtc_popup-add-image'))
                                && !dropUpMenu.classList.contains('Streams_webrtc_hidden')) {
                                dropUpMenu.classList.add('Streams_webrtc_hidden');
                                window.removeEventListener('click', closeOnWindowClick)
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }

                        function showDialog(e) {
                            sceneNameInput.value = '';
                            if (_dialogueEl.classList.contains('Streams_webrtc_hidden')) {
                                _dialogueEl.classList.remove('Streams_webrtc_hidden');
                                var _clientX = e.clientX;
                                var _clientY = e.clientY;

                                _isHidden = false;

                                if (_isMobile) {
                                    dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                    dialogue.style.top = '10px';
                                } else {
                                    dialogue.style.left = (_clientX + 50) + 'px';
                                    dialogue.style.top = (_clientY - 200) + 'px';
                                }
                                window.removeEventListener('click', closeOnWindowClick)
                                setDefaultSceneName();

                            }
                        }

                        function hideDialog() {
                            if (!_dialogueEl.classList.contains('Streams_webrtc_hidden')) {
                                _dialogueEl.classList.add('Streams_webrtc_hidden');
                                _isHidden = true;
                            }
                        }

                        function toggle(e) {
                            if (_isHidden) {
                                showDialog(e);
                            } else hideDialog(e);
                        }

                        return {
                            hideDialog: hideDialog,
                            showDialog: showDialog,
                            toggle: toggle
                        }
                    }())

                    function createScenesCol() {
                        var scenesColumn = document.createElement('DIV');
                        scenesColumn.className = 'Streams_webrtc_popup-scenes';
                        var scenesColumnTitle = document.createElement('DIV');
                        scenesColumnTitle.className = 'Streams_webrtc_popup-scenes-title';
                        var scenesColumnTitleInner = document.createElement('DIV');
                        scenesColumnTitleInner.className = 'Streams_webrtc_popup-scenes-title-inner';
                        var scenesColumnTitleTab = document.createElement('DIV');
                        scenesColumnTitleTab.className = 'Streams_webrtc_popup-scenes-title-tab Streams_webrtc_popup-scenes-title-tab-active';
                        var scenesColumnTitleTabInner = document.createElement('DIV');
                        scenesColumnTitleTabInner.className = 'Streams_webrtc_popup-scenes-title-tab-inner';
                        scenesColumnTitleTabInner.innerHTML = 'Scenes';
                        scenesColumnTitleTab.appendChild(scenesColumnTitleTabInner);
                        scenesColumnTitleInner.appendChild(scenesColumnTitleTab);
                        scenesColumnTitle.appendChild(scenesColumnTitleInner);
                        scenesColumn.appendChild(scenesColumnTitle);
                        var scenesColumnBody = document.createElement('DIV');
                        scenesColumnBody.className = 'Streams_webrtc_popup-scenes-body';
                        var scenesColumnBodyInner = document.createElement('DIV');
                        scenesColumnBodyInner.className = 'Streams_webrtc_popup-scenes-body-inner';
                        scenesColumnBody.appendChild(scenesColumnBodyInner);

                        //var scenesColumnControl = document.createElement('DIV');
                        //scenesColumnControl.className = 'Streams_webrtc_popup-scenes-control';
                        //scenesColumnBody.appendChild(scenesColumnControl);
                        var scenesColumnControl = document.createElement('DIV');
                        scenesColumnControl.className = 'Streams_webrtc_popup-scenes-control';

                        var scenesColumnControlAddBtn = document.createElement('DIV');
                        scenesColumnControlAddBtn.className = 'Streams_webrtc_popup-scenes-control-btn Streams_webrtc_popup-scenes-control-btn-add';
                        if(!tool.state.managingScenes) scenesColumnControlAddBtn.classList.add('Streams_webrtc_inactive');
                        scenesColumnControlAddBtn.innerHTML = _streamingIcons.addItem;

                        scenesColumnControlAddBtn.addEventListener('click', function (event) {
                            addNewScenePopup.showDialog(event);
                        });

                        scenesColumnControl.appendChild(scenesColumnControlAddBtn);

                        var scenesColumnControlBtn = document.createElement('DIV');
                        scenesColumnControlBtn.className = 'Streams_webrtc_popup-scenes-control-btn Streams_webrtc_popup-scenes-control-btn-remove';
                        if(!tool.state.managingScenes) scenesColumnControlBtn.classList.add('Streams_webrtc_inactive');
                        scenesColumnControlBtn.innerHTML = _streamingIcons.removeItem;
                        scenesColumnControlBtn.addEventListener('click', function () {
                            removeScene();
                        })
                        scenesColumnControl.appendChild(scenesColumnControlBtn);

                        var scenesColumnControlBtn = document.createElement('DIV');
                        scenesColumnControlBtn.className = 'Streams_webrtc_popup-scenes-control-btn';
                        scenesColumnControlBtn.innerHTML = _streamingIcons.moveUp;
                        scenesColumnControlBtn.addEventListener('click', function () {
                            moveSceneUp();
                        })
                        scenesColumnControl.appendChild(scenesColumnControlBtn);
                        var scenesColumnControlBtn = document.createElement('DIV');
                        scenesColumnControlBtn.className = 'Streams_webrtc_popup-scenes-control-btn';
                        scenesColumnControlBtn.innerHTML = _streamingIcons.moveDown;
                        scenesColumnControlBtn.addEventListener('click', function () {
                            moveSceneDown();
                        })
                        scenesColumnControl.appendChild(scenesColumnControlBtn);

                        scenesColumnBody.appendChild(scenesColumnControl);
                        scenesColumn.appendChild(scenesColumnBody);
                        _scenesEl = scenesColumnBodyInner;
                        return scenesColumn;
                    }

                    function getActiveScene() {
                        return _activeScene;
                    }


                    return {
                        createScenesCol: createScenesCol,
                        syncList: syncList,
                        getActive: getActiveScene
                    }

                }())

                var sourcesInterface = (function () {
                    var _activeInterface = null;
                    var _visualList = [];
                    var _audioList = [];
                    var _selectedSource = null;
                    var _dialogueBody = null;
                    var _sourcesTabs = null;
                    var _visualSourcesEl = null;
                    var _visualSourcesListEl = null;
                    var _audioSourcesListEl = null;
                    var _audioSourcesEl = null;

                    var ListItem = function (name) {
                        this.active = true;
                        this.title = name != null ? name : null;
                        this.itemEl = null;
                        this.visibilityEl = null;
                        this._sourceInstance = null;
                    }

                    function sortList(type) {
                        var listArr, listEl, sources;

                        if(type == 'visual') {
                            listArr = _visualList;
                            listEl = _visualSourcesListEl;
                            sources = scenesInterface.getActive().sceneInstance.sources;
                        } else {
                            listArr = _audioList;
                            listEl = _audioSourcesListEl;
                            sources = scenesInterface.getActive().sceneInstance.audioSources;
                        }
                        console.log('sortList: sources', sources, listArr);

                        if(sources.length !== listArr.length) {
                            return;
                        }

                        listArr.sort((a, b) => {
                            return sources.findIndex(p => p === a.sourceInstance) - sources.findIndex(p => p === b.sourceInstance);
                        });

                        console.log('sortList: listArr', listArr.map(el => { return el.itemEl.innerText }));
                        console.log('sortList: NOT sortedElements', Array.from(listEl.childNodes).map(el => { return el.innerText }))

                        listEl.innerHTML == '';
                        for (let e = 0; e < listArr.length; e++) {
                            listEl.appendChild(listArr[e].itemEl)
                        }
                        for(let i in listArr) {
                            console.log('source level for', i)
                            console.log('source level parentGroup', listArr[i].sourceInstance.parentGroup)

                            let level = 0;
                            let currentListItem = listArr[i].sourceInstance.parentGroup;
                            while (currentListItem) {
                                console.log('source level for f', currentListItem,  listArr[i].sourceInstance)

                                currentListItem = currentListItem.parentGroup ? currentListItem.parentGroup.parentGroup : null;
                                level++;
                            }
                            if(level != 0) listArr[i].itemEl.style.paddingLeft = 20*level + 'px';
                            console.log('source level', level)
                        }
                    }

                    function moveItem(old_index, new_index, listArr) {
                        console.log('moveItem', old_index, new_index);
                        /*while (old_index < 0) {
                                old_index += this.list.length;
                            }*/
                        if (new_index < 0) {
                            new_index = 0;
                        }
                        if (new_index >= listArr.length) {
                            new_index = listArr.length - 1;
                            /*var k = new_index - this.list.length;
                                while ((k--) + 1) {
                                    this.list.push(undefined);
                                }*/
                        }
                        listArr.splice(new_index, 0, listArr.splice(old_index, 1)[0]);
                        return listArr;
                    }

                    var visualSources = (function () {
                        var VisualListItem = function (name) {
                            var sourceInstance =this;
                            this.listType = 'video';
                            this.title = name != null ? name : null;
                            this.remove = function () {
                                var currentitem = this;
                                if(this.itemEl != null && this.itemEl.parentNode != null) this.itemEl.parentNode.removeChild(this.itemEl);
                                for(var i in _visualList) {
                                    if(_visualList[i] == currentitem) {
                                        _visualList.splice(i, 1);
                                        break;
                                    }
                                }
                            };
                            this.isActive = function() {
                                console.log('isActive', this)
                                var currentitem = this;
                                var sources = scenesInterface.getActive().sceneInstance.sources;
                                console.log('isActive active', scenesInterface.getActive().sceneInstance.sources)

                                for(let s in sources) {
                                    console.log('isActive for', sources[s], currentitem._sourceInstance)

                                    if(sources[s] == currentitem._sourceInstance) {
                                        console.log('isActive active')

                                        return true;
                                    }
                                }
                                console.log('isActive inactive')

                                return false;
                            };
                            this.show = function() {
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.showSource(this.sourceInstance);

                                //this.sourceInstance.active = true;
                                this.switchVisibilityIcon(true);
                                syncList();
                            };
                            this.hide = function() {
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.hideSource(this.sourceInstance);
                                //this.sourceInstance.active = false;
                                this.switchVisibilityIcon(false);
                                syncList();
                            };
                            this.switchVisibilityIcon = function (visibility) {
                                if(visibility === true) {
                                    this.visibilityEl.innerHTML = _streamingIcons.visible;
                                } else if (visibility === false) {
                                    this.visibilityEl.innerHTML = _streamingIcons.hidden;
                                }
                            };
                            this.toggle = function() {
                                if(sourceInstance.sourceInstance.active == true) {
                                    sourceInstance.hide();
                                } else {
                                    sourceInstance.show();
                                }
                            };
                            this.params = {
                                _loop: controlsTool.WebRTCLib.getOptions().liveStreaming.loopVideo,
                                _localOutput:controlsTool.WebRTCLib.getOptions().liveStreaming.localOutput,

                                set loop(value) {this._loop = value;},
                                set localOutput(value) {this._localOutput = value;},
                                get localOutput() {return typeof this._localOutput == 'object' ? this._localOutput.checked : this._localOutput;},
                                get loop() {return typeof this._loop == 'object' ? this._loop.checked : this._loop;}
                            };

                            var itemEl = document.createElement('DIV');
                            itemEl.className = 'Streams_webrtc_popup-sources-item';
                            var itemElText = document.createElement('DIV');
                            itemElText.innerHTML = name ? name : '';
                            itemElText.className = 'Streams_webrtc_popup-sources-item-text';
                            var itemElControl = document.createElement('DIV');
                            itemElControl.className = 'Streams_webrtc_popup-sources-item-control';
                            var itemElControlVisibility = document.createElement('DIV');
                            itemElControlVisibility.className = 'Streams_webrtc_popup-sources-item-visibility';
                            itemElControlVisibility.innerHTML = _streamingIcons.visible;
                            itemElControl.appendChild(itemElControlVisibility);
                            itemEl.appendChild(itemElText);
                            itemEl.appendChild(itemElControl);
                            this.visibilityEl = itemElControlVisibility;
                            this.itemEl = itemEl;
                            this.titleEl = itemElText;
                            this.itemEl.addEventListener('click', function () {
                                console.log('sourceInstance.sourceInstance', sourceInstance.sourceInstance.sourceType);
                                selectSource(sourceInstance);

                                optionsColumn.update();
                            })
                            itemElControlVisibility.addEventListener('click', this.toggle)
                        }

                        VisualListItem.prototype = new ListItem();

                        Object.defineProperties(VisualListItem.prototype, {
                            'sourceInstance': {
                                'set': function(instance) {
                                    console.log('sourceInstance set', instance)

                                    this._sourceInstance = instance;
                                    //if(instance == null) return;
                                    var sourceItem = this;
                                    sourceItem.title = instance.name;
                                    instance.on('nameChanged', function (newName) {
                                        console.log('nameChanged set', instance)

                                        sourceItem.title = newName;
                                    })
                                },
                                'get': function() {
                                    return this._sourceInstance;
                                }
                            }
                        });
                        Object.defineProperties(VisualListItem.prototype, {
                            'title': {
                                'set': function(val) { if(this.titleEl) this.titleEl.innerHTML = val; }
                            }
                        });

                        function syncList() {
                            var sources = scenesInterface.getActive().sceneInstance.sources;
                            console.log('visual: syncList _visualList', _visualList.length);
                            console.log('visual: syncList sources', sources.length);

                            for (let i = _visualList.length - 1; i >= 0; i--) {
                                console.log('visual: syncList _visualList', _visualList[i]);
                                if(_visualList[i] == null) continue;

                                if(_visualList[i].isActive() == false) {
                                    console.log('visual: syncList remove',  _visualList[i]);

                                    _visualList[i].remove();
                                    continue;
                                }
                                if(_visualList[i].sourceInstance.active === true) {
                                    _visualList[i].switchVisibilityIcon(true);
                                } else if(_visualList[i].sourceInstance.active === false) {
                                    _visualList[i].switchVisibilityIcon(false);
                                }
                            }

                            for (let s in sources) {
                                if(sources[s].sourceType == 'webrtcrect' || sources[s].sourceType == 'webrtctext') continue;
                                let newSource = true;
                                for (let i in _visualList) {
                                    if(sources[s] == _visualList[i].sourceInstance) {
                                        newSource = false;
                                        break;
                                    }
                                }

                                if(newSource) {
                                    var title = sources[s].title ? sources[s
                                        ].title : (sources[s].name != null ? sources[s].name : sources[s].sourceType);
                                    var listItem = new VisualListItem(title);
                                    listItem.sourceInstance = sources[s];
                                    console.log('visual: syncList add',  listItem);
                                    if(sources[s].active === true) {
                                        listItem.switchVisibilityIcon(true);
                                    } else if(sources[s].active === false) {
                                        listItem.switchVisibilityIcon(false);
                                    }
                                    addItem(listItem);
                                }
                            }

                            sortList('visual');
                        }

                        window.syncList = syncList;

                        function addItem(item) {
                            if(item == null || _visualSourcesListEl == null) return;
                            console.log('visual: addItem', item)
                            console.log('visual: addItem itemEl', item.itemEl)
                            _visualList.push(item)
                            console.log('visual: addItem element', _visualSourcesListEl)

                            _visualSourcesListEl.insertBefore(item.itemEl, _visualSourcesListEl.firstChild);
                        }

                        function loadList(sourcesList) {
                            if(sourcesList == null) return;
                            console.log('loadList', sourcesList)
                            for(let s in sourcesList) {
                                console.log('loadList for', sourcesList[s])
                                var listItem = new VisualListItem(sourcesList[s].title);
                                listItem.sourceInstance = sourcesList[s];
                                addItem(listItem, _visualSourcesListEl);
                            }
                        }

                        function addWatermark(e, options) {
                            console.log('addWatermark');
                            if(options.type == 'image') {
                                if (typeof e == 'string') {
                                    var pathhInfo = e.split('/');
                                    var title = pathhInfo[pathhInfo.length - 1];

                                    var img = new Image();
                                    img.src = e;
                                    img.onload = function () {
                                        controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                            sourceType: 'imageOverlay',
                                            imageInstance: img,
                                            position: options.position,
                                            opacity: options.opacity
                                        });
                                    };
                                } else {
                                    var tgt = e.target || window.event.srcElement,
                                        files = tgt.files;

                                    function loadImage(fileReader) {
                                        var img = new Image();
                                        img.src = fileReader.result;
                                        img.onload = function () {
                                            controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                                sourceType: 'imageOverlay',
                                                title: files[0].name,
                                                imageInstance: img,
                                            });
                                        };

                                    }

                                    if (FileReader && files && files.length) {
                                        var fr = new FileReader();
                                        fr.onload = () => loadImage(fr);
                                        fr.readAsDataURL(files[0]);
                                    }
                                }
                            } else {

                            }
                        }

                        function addBackground(e, options) {
                            console.log('addBackground');
                            if(options.type == 'image') {
                                if (typeof e == 'string') {
                                    var img = new Image();
                                    img.src = e;
                                    img.onload = function () {
                                        controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                            sourceType: 'imageBackground',
                                            imageInstance: img
                                        });
                                    };
                                } else {
                                    var tgt = e.target || window.event.srcElement,
                                        files = tgt.files;

                                    function loadImage(fileReader) {
                                        var img = new Image();
                                        img.src = fileReader.result;
                                        img.onload = function () {
                                            controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                                sourceType: 'img',
                                                title: files[0].name,
                                                imageInstance: img,
                                            });
                                        };

                                    }

                                    if (FileReader && files && files.length) {
                                        var fr = new FileReader();
                                        fr.onload = () => loadImage(fr);
                                        fr.readAsDataURL(files[0]);
                                    }
                                }
                            } else {
                                if(typeof e == 'string') {

                                    var pathhInfo = e.split('/');
                                    var title = pathhInfo[pathhInfo.length - 1];
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                        sourceType: 'videoBackground',
                                        title: title,
                                        url: e,
                                    });
                                } else {


                                }
                            }
                        }

                        function addImageSource(e) {
                            if(typeof e == 'string') {
                                var pathhInfo = e.split('/');
                                var title = pathhInfo[pathhInfo.length - 1];

                                var img = new Image();
                                img.src = e;
                                img.onload = function () {
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                        sourceType: 'image',
                                        title: title,
                                        imageInstance: img,
                                    });
                                };
                            } else {
                                var tgt = e.target || window.event.srcElement,
                                    files = tgt.files;

                                function loadImage(fileReader) {
                                    var img = new Image();
                                    img.src = fileReader.result;
                                    img.onload = function () {
                                        controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                            sourceType: 'image',
                                            title: files[0].name,
                                            imageInstance: img,
                                        });
                                    };

                                }

                                if (FileReader && files && files.length) {
                                    var fr = new FileReader();
                                    fr.onload = () => loadImage(fr);
                                    fr.readAsDataURL(files[0]);
                                }
                            }
                        }

                        function addVideoSource(e) {
                            if(typeof e == 'string') {

                                var pathhInfo = e.split('/');
                                var title = pathhInfo[pathhInfo.length - 1];
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                    sourceType: 'video',
                                    title: title,
                                    url: e,
                                });
                            } else {
                                var tgt = e.target || window.event.srcElement,
                                    files = tgt.files;

                                if (FileReader && files && files.length) {
                                    let file = files[0], mime = file.type;
                                    let reader = new  FileReader();
                                    reader.readAsArrayBuffer(file);
                                    reader.addEventListener('loadstart', loadStartHandler);
                                    reader.addEventListener('load', loadHandler);
                                    reader.addEventListener('loadend', loadEndHandler);
                                    reader.addEventListener('progress', updateProgress);
                                    reader.addEventListener('error', errorHandler);
                                    reader.addEventListener('abort', abortHandler);

                                    var loadProgressBar = new ProgressBar();
                                    loadProgressBar.show();

                                    function loadHandler(e) {
                                        // The file reader gives us an ArrayBuffer:
                                        let buffer = e.target.result;

                                        // We have to convert the buffer to a blob:
                                        let videoBlob = new Blob([new Uint8Array(buffer)], { type: mime });

                                        // The blob gives us a URL to the video file:
                                        let url = window.URL.createObjectURL(videoBlob);

                                        controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.addSource({
                                            sourceType: 'video',
                                            title: files[0].name,
                                            url: url,
                                        }, function () {
                                            loadProgressBar.updateTextStatus('loaded');
                                            loadProgressBar.hide();
                                        }, function (e) {
                                            loadProgressBar.updateTextStatus('<span style="color:#ff9f9f;">' + e.message + '</span>');
                                        });

                                        loadProgressBar.updateProgress(100);


                                    }

                                    function loadStartHandler(evt) {

                                    }

                                    function loadEndHandler(evt) {

                                    }

                                    function abortHandler(evt) {
                                        loadProgressBar.updateTextStatus('<span style="color:#ff9f9f;">File read cancelled</span>');
                                    }

                                    function errorHandler(evt) {
                                        console.log('errorHandler',  evt.target.error)

                                        switch (evt.target.error.code) {
                                            case evt.target.error.NOT_FOUND_ERR:
                                                loadProgressBar.updateTextStatus('<span style="color:#ff9f9f;">File Not Found!</span>');
                                                break;
                                            case evt.target.error.NOT_READABLE_ERR:
                                                loadProgressBar.updateTextStatus('<span style="color:#ff9f9f;">File is not readable</span>');
                                                break;
                                            case evt.target.error.ABORT_ERR:
                                                break; // noop
                                            default:
                                                loadProgressBar.updateTextStatus('<span style="color:#ff9f9f;">An error occurred reading this file.</span>');
                                        };
                                    }

                                    function updateProgress(evt) {
                                        // evt is an ProgressEvent.
                                        if (evt.lengthComputable) {
                                            var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
                                            // Increase the progress bar length.
                                            if (percentLoaded < 100) {
                                                loadProgressBar.updateProgress(percentLoaded);
                                            }
                                        }
                                    }

                                    function ProgressBar() {
                                        var _progrssBarPopup = null;
                                        var _barProggressEl = null;
                                        var _progressText = null;
                                        var _isHidden = true;
                                        var _barWidth = 300;
                                        var _barheight = 100;

                                        console.log('createProgressBar')
                                        var dialogue=document.createElement('DIV');
                                        dialogue.className = 'Streams_webrtc_popup-progress-bar-popup';
                                        dialogue.style.width = _barWidth + 'px';
                                        dialogue.style.height = _barheight + 'px';
                                        _progrssBarPopup = dialogue;

                                        var dialogInner=document.createElement('DIV');
                                        dialogInner.className = 'Streams_webrtc_popup-progress-bar-popup-inner';
                                        var boxContent=document.createElement('DIV');
                                        boxContent.className = 'Streams_webrtc_popup-streaming-box  Streams_webrtc_popup-box';
                                        var boxContentText = _progressText = document.createElement('DIV');
                                        boxContentText.innerHTML = 'loading...';
                                        var progressBar = document.createElement('DIV');
                                        progressBar.className = 'Streams_webrtc_popup-progress-bar';
                                        var progressEl = _barProggressEl = document.createElement('SPAN');
                                        progressEl.className = 'Streams_webrtc_popup-progress-el';


                                        progressBar.appendChild(progressEl);
                                        boxContent.appendChild(boxContentText);
                                        boxContent.appendChild(progressBar);

                                        var close=document.createElement('div');
                                        close.className = 'Streams_webrtc_close-dialog-sign';
                                        close.innerHTML = '&#10005;';
                                        var popupinstance = this;
                                        close.addEventListener('click', function() {
                                            popupinstance.hide();
                                        });
                                        dialogue.appendChild(close);

                                        dialogInner.appendChild(boxContent);
                                        dialogue.appendChild(dialogInner);

                                        this.show = function() {
                                            var boxRect = activeDialogue.dialogueEl.getBoundingClientRect();
                                            var x = (boxRect.width / 2) - (_barWidth / 2);
                                            var y = (boxRect.height / 2) - (_barheight / 2);
                                            _progrssBarPopup.style.top = y + 'px';
                                            _progrssBarPopup.style.left = x + 'px';
                                            activeDialogue.dialogueEl.appendChild(_progrssBarPopup);
                                        }

                                        this.hide = function() {
                                            if(!activeDialogue.dialogueEl.contains(_progrssBarPopup)) return;
                                            activeDialogue.dialogueEl.removeChild(_progrssBarPopup);
                                        }

                                        this.updateProgress = function(percemt) {
                                            _barProggressEl.style.width = percemt + '%';
                                            _barProggressEl.innerHTML = percemt + '%';
                                        }

                                        this.updateTextStatus = function(text) {
                                            _progressText.innerHTML = text;
                                        }
                                    }

                                }

                            }
                        }

                        function selectSource(sourceItem) {
                            console.log('selectSource', _visualList)
                            console.log('selectSource sourceItem', sourceItem)
                            if(sourceItem.itemEl && !sourceItem.itemEl.classList.contains('Streams_webrtc_popup-sources-item-active')) (sourceItem.itemEl).classList.add('Streams_webrtc_popup-sources-item-active');

                            _selectedSource = sourceItem;
                            for(var i in _visualList) {
                                console.log('selectSource for', _visualList[i], _selectedSource)
                                if(_visualList[i] == _selectedSource) continue;
                                console.log('selectSource for --', sourceItem.itemEl, (sourceItem.itemEl).classList.contains('Streams_webrtc_popup-sources-item-active'))

                                if((_visualList[i].itemEl).classList.contains('Streams_webrtc_popup-sources-item-active')) {
                                    console.log('selectSource remove');

                                    (_visualList[i].itemEl).classList.remove('Streams_webrtc_popup-sources-item-active');
                                }
                            }

                            console.log('selectSource _selectedSource', _selectedSource)

                            var left = 0, top = 0;
                            if(_streamingCanvas != null) {
                                left = _streamingCanvas.offsetLeft;
                                top = _streamingCanvas.offsetTop;
                            }
                            var canvasSize = controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.getCanvasSize();
                            var prmtr1 = canvasSize.width * 2 + canvasSize.height * 2
                            var realcanvasSize = _streamingCanvas.getBoundingClientRect();
                            var prmtr2 = realcanvasSize.width * 2 + realcanvasSize.height * 2
                            var timesBigger = prmtr1 >= prmtr2 ? prmtr1 / prmtr2 : prmtr2 / prmtr1;
                            console.log('selectSource timesbigger', prmtr1, prmtr2, timesBigger)
                            if(_resizingElementTool != null) {
                                _resizingElementTool.state.onMoving.removeAllHandlers();
                                _resizingElementTool.state.onResizing.removeAllHandlers();
                            }
                            if(_selectedSource.sourceInstance.sourceType == 'group' && _selectedSource.sourceInstance.groupType == 'webrtc') {
                                var webrtcLayoutRect = controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.getWebrtcLayoutRect();
                                console.log('selectSource if1')


                                _resizingElement.style.width = webrtcLayoutRect.width / timesBigger + 'px';
                                _resizingElement.style.height = webrtcLayoutRect.height / timesBigger+ 'px';
                                _resizingElement.style.top = top + webrtcLayoutRect.y / timesBigger + 'px';
                                _resizingElement.style.left = left + webrtcLayoutRect.x / timesBigger + 'px';
                                _resizingElement.style.border = '1px solid ' + _selectedSource.sourceInstance.color;
                                _resizingElementTool.state.onMoving.set(function (x, y) {
                                    let currentRect = controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.getWebrtcLayoutRect();
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.setWebrtcLayoutRect(currentRect.width, currentRect.height, (x - left) * timesBigger, (y - top)  * timesBigger);
                                });
                                _resizingElementTool.state.onResizing.set(function (width, height, x, y) {
                                    let currentRect = controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.getWebrtcLayoutRect()
                                    let outWidth = width != null ? width * timesBigger : currentRect.width;
                                    let outHeight = height != null ? height * timesBigger : currentRect.height;
                                    let outLeft = x != null ? (x - left) * timesBigger : currentRect.x;
                                    let outTop = y != null ? (y - top) * timesBigger : currentRect.y;
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.setWebrtcLayoutRect(outWidth, outHeight, outLeft, outTop);
                                });
                            } else if(_selectedSource.sourceInstance.sourceType == 'image' || _selectedSource.sourceInstance.sourceType == 'video') {
                                console.log('selectSource if2')

                                var sourceRect = _selectedSource.sourceInstance.rect;
                                console.log('selectSource sourceRect', sourceRect)
                                console.log('selectSource sourceRect 1', sourceRect.width,  sourceRect.height,  sourceRect.x,  sourceRect.y)

                                _resizingElement.style.width = sourceRect._width / timesBigger + 'px';
                                _resizingElement.style.height = sourceRect._height / timesBigger+ 'px';
                                _resizingElement.style.top = top + sourceRect._y / timesBigger + 'px';
                                _resizingElement.style.left = left + sourceRect._x / timesBigger + 'px';
                                _resizingElement.style.border = '1px solid ' + _selectedSource.sourceInstance.color;


                                _resizingElementTool.state.onMoving.set(function (x, y) {
                                    _selectedSource.sourceInstance.rect.x = (x - left) * timesBigger;
                                    _selectedSource.sourceInstance.rect.y = (y - top)  * timesBigger;
                                });

                                _resizingElementTool.state.onResizing.set(function (width, height, x, y) {
                                    if(width != null) _selectedSource.sourceInstance.rect.width = width * timesBigger;
                                    if(height != null) _selectedSource.sourceInstance.rect.height = height * timesBigger;
                                    if(x != null) _selectedSource.sourceInstance.rect.x = (x - left) * timesBigger;
                                    if(y != null) _selectedSource.sourceInstance.rect.y = (y - top) * timesBigger;
                                });

                            }

                        }

                        controlsTool.WebRTCLib.mediaManager.canvasComposer.on('sourceAdded', function (source) {
                            syncList();
                            /*setTimeout(function(){
                        if(source.sourceType == 'webrtc' && source.participant != null) {
                            controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.displayName(source.participant);
                        }
                    }, 3000)*/

                        })

                        controlsTool.WebRTCLib.mediaManager.canvasComposer.on('sourceRemoved', function () {
                            syncList();
                        })

                        controlsTool.WebRTCLib.mediaManager.canvasComposer.on('sourceMoved', function () {
                            syncList();
                        })

                        function moveForward() {
                            console.log('moveForward');
                            controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.moveSourceForward(_selectedSource.sourceInstance);

                            sortList('visual');
                            return false;
                        }

                        function moveBackward() {
                            console.log('moveBackward', _selectedSource);
                            controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.moveSourceBackward(_selectedSource.sourceInstance);

                            sortList('visual');
                            return false;
                        }

                        function getSelectedSource() {
                            return _selectedSource;
                        }

                        function removeSource() {
                            if(_selectedSource != null) {
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.removeSource(_selectedSource.sourceInstance);
                                syncList();
                                _selectedSource = null;
                            };
                            _resizingElement.style.width = '0px'
                            _resizingElement.style.height = '0px'
                            _resizingElement.style.border = 'none'
                            optionsColumn.update();
                        }

                        function createAddSourceMenu() {
                            var dropUp = document.createElement('DIV');
                            dropUp.className = 'Streams_webrtc_popup-sources-add-menu';
                            var imageItem = document.createElement('DIV');
                            imageItem.className = 'Streams_webrtc_popup-sources-add-menu-item Streams_webrtc_popup-sources-add-image';
                            var imageItemIcon = document.createElement('DIV');
                            imageItemIcon.className = 'Streams_webrtc_popup-sources-add-menu-icon';
                            var imageItemIconText = document.createElement('DIV');
                            imageItemIconText.className = 'Streams_webrtc_popup-sources-add-menu-text';
                            imageItemIconText.innerHTML = 'Image';
                            imageItem.addEventListener('click', function (e) {
                                addImagePopup.showDialog(e);
                            })
                            /*var imageItemInput = document.createElement('INPUT');
                                imageItemInput.className = 'Streams_webrtc_popup-sources-add-menu-file';
                                imageItemInput.type = 'file';
                                imageItemInput.name = 'fileImageSource';
                                imageItemInput.accept = 'image/png, image/jpeg'
                                imageItemInput.addEventListener('change', function (e) {
                                    addImagePopup.showDialog();
                                    //addImageSource(e);
                                })*/
                            imageItem.appendChild(imageItemIcon);
                            imageItem.appendChild(imageItemIconText);
                            //imageItem.appendChild(imageItemInput);
                            dropUp.appendChild(imageItem);
                            var videoItem = document.createElement('DIV');
                            videoItem.className = 'Streams_webrtc_popup-sources-add-menu-item';
                            var videoItemIcon = document.createElement('DIV');
                            imageItemIcon.className = 'Streams_webrtc_popup-sources-add-menu-icon';
                            var videoItemIconText = document.createElement('DIV');
                            videoItemIconText.className = 'Streams_webrtc_popup-sources-add-menu-text';
                            videoItemIconText.innerHTML = 'Video';
                            videoItem.addEventListener('click', function (e) {
                                addVideoPopup.showDialog(e);
                            })
                            /*var videoItemInput = document.createElement('INPUT');
                                videoItemInput.className = 'Streams_webrtc_popup-sources-add-menu-file';
                                videoItemInput.type = 'file';
                                videoItemInput.name = 'fileVideoSource';
                                videoItemInput.addEventListener('change', function (e) {
                                    addVideoSource(e);
                                })*/
                            videoItem.appendChild(videoItemIcon);
                            videoItem.appendChild(videoItemIconText);
                            //videoItem.appendChild(videoItemInput);
                            dropUp.appendChild(videoItem);

                            var savedMedia = document.createElement('DIV');
                            savedMedia.className = 'Streams_webrtc_popup-sources-add-menu-item';
                            var savedMediaIcon = document.createElement('DIV');
                            savedMediaIcon.className = 'Streams_webrtc_popup-sources-add-menu-icon';
                            var savedMediaIconText = document.createElement('DIV');
                            savedMediaIconText.className = 'Streams_webrtc_popup-sources-add-menu-text';
                            savedMediaIconText.innerHTML = 'Saved Media';
                            savedMedia.addEventListener('click', function (e) {
                                console.log('_fileManagerTool', _fileManagerTool)
                                if(!_fileManagerTool) return;

                                _fileManagerTool.showDialogue();

                                _fileManagerTool.state.onSelect.set(function (stream) {
                                    console.log('Streams/fileManager onSelect', stream)
                                    if(stream.fields.attributes == '') {
                                        console.error('Q.file.url is missing')
                                        return;
                                    }
                                    var attributes = JSON.parse(stream.fields.attributes);
                                    var link = Q.url(attributes['Q.file.url']);
                                    console.log('Streams/fileManager attributes', link)
                                    if(stream.fields.type == 'Streams/video') {
                                        addVideoSource(link);
                                    } else if(stream.fields.type == 'Streams/image') {
                                        addImageSource(link);
                                    } else {
                                        alert('Wrong type of file')
                                    }

                                    _fileManagerTool.closeDialogue();
                                }, 'importVisual')
                            })

                            savedMedia.appendChild(savedMediaIcon);
                            savedMedia.appendChild(savedMediaIconText);
                            dropUp.appendChild(savedMedia);

                            //_dialogueEl.appendChild(dropUp);
                            return dropUp;
                        }

                        function createVisualSourcesList() {
                            if(_visualSourcesEl != null) return _visualSourcesEl;
                            var dialogBody = document.createElement('DIV');
                            dialogBody.className = 'Streams_webrtc_popup-sources-visual-body';
                            var dialogBodyInner = document.createElement('DIV');
                            dialogBodyInner.className = 'Streams_webrtc_popup-sources-body-inner';
                            _visualSourcesEl = dialogBody;
                            _visualSourcesListEl = dialogBodyInner;

                            var sourcesColumnControl = document.createElement('DIV');
                            sourcesColumnControl.className = 'Streams_webrtc_popup-sources-control';

                            var dropUpMenu = createAddSourceMenu();

                            var sourcesColumnControlAddBtn = document.createElement('DIV');
                            sourcesColumnControlAddBtn.className = 'Streams_webrtc_popup-sources-control-btn Streams_webrtc_popup-sources-control-btn-add';
                            if(!tool.state.managingVisualSources) sourcesColumnControlAddBtn.classList.add('Streams_webrtc_inactive');
                            sourcesColumnControlAddBtn.innerHTML = _streamingIcons.addItem;
                            sourcesColumnControlAddBtn.appendChild(dropUpMenu);

                            sourcesColumnControlAddBtn.addEventListener('click', function (event) {
                                function hideOnClick(e) {
                                    if (!(sourcesColumnControlAddBtn.contains(e.target) || e.target.matches('.Streams_webrtc_popup-sources-add-menu'))
                                        && dropUpMenu.classList.contains('Streams_webrtc_popup-sources-add-menu-show')) {
                                        dropUpMenu.classList.remove('Streams_webrtc_popup-sources-add-menu-show');
                                        window.removeEventListener('click', hideOnClick)
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }
                                console.log('background', dropUpMenu)
                                if (dropUpMenu.classList.contains('Streams_webrtc_popup-sources-add-menu-show')) {
                                    console.log('background 2')
                                    dropUpMenu.classList.remove('Streams_webrtc_popup-sources-add-menu-show');
                                } else {
                                    console.log('background 3')

                                    dropUpMenu.classList.add('Streams_webrtc_popup-sources-add-menu-show');
                                    window.addEventListener('mousedown', hideOnClick)
                                }
                            });

                            sourcesColumnControl.appendChild(sourcesColumnControlAddBtn);

                            var sourcesColumnControlBtn = document.createElement('DIV');
                            sourcesColumnControlBtn.className = 'Streams_webrtc_popup-sources-control-btn Streams_webrtc_popup-sources-control-btn-remove';
                            if(!tool.state.managingVisualSources) sourcesColumnControlBtn.classList.add('Streams_webrtc_inactive');
                            sourcesColumnControlBtn.innerHTML = _streamingIcons.removeItem;
                            sourcesColumnControlBtn.addEventListener('click', function () {
                                removeSource();
                            })
                            sourcesColumnControl.appendChild(sourcesColumnControlBtn);
                            var sourcesColumnControlBtn = document.createElement('DIV');
                            sourcesColumnControlBtn.className = 'Streams_webrtc_popup-sources-control-btn';
                            sourcesColumnControlBtn.innerHTML = _streamingIcons.moveUp;
                            sourcesColumnControlBtn.addEventListener('click', function () {
                                moveForward();
                            })
                            sourcesColumnControl.appendChild(sourcesColumnControlBtn);
                            var sourcesColumnControlBtn = document.createElement('DIV');
                            sourcesColumnControlBtn.className = 'Streams_webrtc_popup-sources-control-btn';
                            sourcesColumnControlBtn.innerHTML = _streamingIcons.moveDown;
                            sourcesColumnControlBtn.addEventListener('click', function () {
                                moveBackward();
                            })
                            sourcesColumnControl.appendChild(sourcesColumnControlBtn);

                            dialogBody.appendChild(dialogBodyInner)
                            dialogBody.appendChild(sourcesColumnControl)

                            return dialogBody;
                        }

                        function getSourcesList() {
                            return _visualList;
                        }

                        var addVideoPopup = (function () {
                            var _dialogueEl = null;
                            var _isHidden = true;

                            console.log('addVideoPopup')
                            var dialogue=document.createElement('DIV');
                            dialogue.className = 'Streams_webrtc_dialog-box Streams_webrtc_popup-streaming-box Streams_webrtc_popup-add-video Streams_webrtc_hidden';
                            _dialogueEl = dialogue;
                            var dialogTitle=document.createElement('H3');
                            dialogTitle.innerHTML = 'Add video';
                            dialogTitle.className = 'Streams_webrtc_dialog-header Q_dialog_title';

                            var dialogInner=document.createElement('DIV');
                            dialogInner.className = 'Streams_webrtc_dialog-inner';
                            var boxContent=document.createElement('DIV');
                            boxContent.className = 'Streams_webrtc_popup-streaming-box  Streams_webrtc_popup-box';
                            var boxContentText=document.createElement('DIV');
                            boxContentText.innerHTML = 'Please choose file from your computer or enter the link.';
                            var videoItemInput = document.createElement('INPUT');
                            videoItemInput.className = 'Streams_webrtc_popup-sources-add-menu-file';
                            videoItemInput.type = 'file';
                            videoItemInput.name = 'fileVideoSource';
                            videoItemInput.accept = 'video/mp4, video/*'
                            videoItemInput.addEventListener('change', function (e) {
                                addVideoSource(e);
                                hideDialog();
                            })

                            var boxContentText2=document.createElement('DIV');
                            boxContentText2.innerHTML = 'OR';
                            var imageItemLinkInput = document.createElement('INPUT');
                            imageItemLinkInput.className = 'Streams_webrtc_popup-sources-add-menu-file';
                            imageItemLinkInput.type = 'text';
                            imageItemLinkInput.placeholder = 'Enter the link';
                            imageItemLinkInput.name = 'fileImageLink';

                            boxContent.appendChild(boxContentText);
                            boxContent.appendChild(videoItemInput);
                            boxContent.appendChild(boxContentText2);
                            boxContent.appendChild(imageItemLinkInput);

                            var close=document.createElement('div');
                            close.className = 'Streams_webrtc_close-dialog-sign';
                            close.style.backgroundImage = 'url("' + Q.url("{{Q}}/img/close.png") + '"';
                            close.style.backgroundRepeat = 'no-repeat';
                            close.style.backgroundSize = 'cover';
                            close.addEventListener('click', function() {
                                if(imageItemLinkInput.value != '') {
                                    var val = imageItemLinkInput.value;
                                    addVideoSource(val);
                                    hideDialog();
                                    imageItemLinkInput.value = '';
                                }
                            });
                            dialogInner.appendChild(dialogTitle);

                            dialogue.appendChild(close);
                            dialogInner.appendChild(boxContent);
                            dialogue.appendChild(dialogInner);

                            controlsTool.WebRTCClass.roomsMediaContainer().appendChild(dialogue);
                            setTimeout(function () {
                                Q.activate(
                                    Q.Tool.setUpElement(
                                        dialogue, // or pass an existing element
                                        "Q/resize",
                                        {
                                            move: true,
                                            activateOnElement: dialogTitle,
                                            resize: false,
                                            active: true,
                                            moveWithinArea: 'window',
                                        }
                                    ),
                                    {},
                                    function () {

                                    }
                                );
                            }, 3000)

                            var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                            var dialogWidth = 400;
                            dialogue.style.width = dialogWidth + 'px';
                            console.log('dialogWidth', dialogWidth);
                            if(Q.info.isMobile) {
                                dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                dialogue.style.bottom = (controlsRect.height + 10) + 'px';
                            } else {
                                dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                dialogue.style.top = (window.innerHeight/ 2 - 100) + 'px';
                            }


                            close.addEventListener('click', function () {
                                hideDialog();
                            });

                            function closeOnWindowClick(e) {
                                if (!(_dialogueEl.contains(e.target) || e.target.matches('.Streams_webrtc_popup-add-image'))
                                    && !dropUpMenu.classList.contains('Streams_webrtc_hidden')) {
                                    dropUpMenu.classList.add('Streams_webrtc_hidden');
                                    window.removeEventListener('click', closeOnWindowClick)
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }

                            function showDialog(e) {
                                videoItemInput.value = '';
                                if(_dialogueEl.classList.contains('Streams_webrtc_hidden')) {
                                    _dialogueEl.classList.remove('Streams_webrtc_hidden');
                                    var _clientX = e.clientX;
                                    var _clientY = e.clientY;

                                    _isHidden = false;

                                    var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                                    if(Q.info.isMobile) {
                                        dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                        dialogue.style.top = (controlsRect.height + 10) + 'px';
                                    } else {
                                        dialogue.style.left = (_clientX + 50) + 'px';
                                        dialogue.style.top = (_clientY - 200) + 'px';
                                    }
                                    window.removeEventListener('click', closeOnWindowClick)

                                }
                            }

                            function hideDialog() {
                                if(!_dialogueEl.classList.contains('Streams_webrtc_hidden')){
                                    _dialogueEl.classList.add('Streams_webrtc_hidden');
                                    _isHidden = true;
                                }
                            }

                            function toggle(e) {
                                if(_isHidden) {
                                    showDialog(e);
                                } else hideDialog(e);
                            }

                            return {
                                hideDialog: hideDialog,
                                showDialog: showDialog,
                                toggle: toggle
                            }
                        }())

                        var addImagePopup = (function () {
                            var _dialogueEl = null;
                            var _isHidden = true;

                            console.log('addImagePopup')
                            var dialogue=document.createElement('DIV');
                            dialogue.className = 'Streams_webrtc_dialog-box Streams_webrtc_popup-streaming-box Streams_webrtc_popup-add-image Streams_webrtc_hidden';
                            _dialogueEl = dialogue;
                            var dialogTitle=document.createElement('H3');
                            dialogTitle.innerHTML = 'Add image';
                            dialogTitle.className = 'Streams_webrtc_dialog-header Q_dialog_title';

                            var dialogInner=document.createElement('DIV');
                            dialogInner.className = 'Streams_webrtc_dialog-inner';
                            var boxContent=document.createElement('DIV');
                            boxContent.className = 'Streams_webrtc_popup-streaming-box  Streams_webrtc_popup-box';
                            var boxContentText=document.createElement('DIV');
                            boxContentText.innerHTML = 'Please choose file from your computer or enter the link.';
                            var imageItemInput = document.createElement('INPUT');
                            imageItemInput.className = 'Streams_webrtc_popup-sources-add-menu-file';
                            imageItemInput.type = 'file';
                            imageItemInput.name = 'fileImageSource';
                            imageItemInput.accept = 'image/png, image/jpeg'
                            imageItemInput.addEventListener('change', function (e) {
                                addImageSource(e);
                                hideDialog();
                            })

                            var boxContentText2=document.createElement('DIV');
                            boxContentText2.innerHTML = 'OR';
                            var imageItemLinkInput = document.createElement('INPUT');
                            imageItemLinkInput.className = 'Streams_webrtc_popup-sources-add-menu-file';
                            imageItemLinkInput.type = 'text';
                            imageItemLinkInput.placeholder = 'Enter the link';
                            imageItemLinkInput.name = 'fileImageLink';

                            boxContent.appendChild(boxContentText);
                            boxContent.appendChild(imageItemInput);
                            boxContent.appendChild(boxContentText2);
                            boxContent.appendChild(imageItemLinkInput);

                            var close=document.createElement('div');
                            close.className = 'Streams_webrtc_close-dialog-sign';
                            close.style.backgroundImage = 'url("' + Q.url("{{Q}}/img/close.png") + '"';
                            close.style.backgroundRepeat = 'no-repeat';
                            close.style.backgroundSize = 'cover';
                            close.addEventListener('click', function() {
                                if(imageItemLinkInput.value != '') {
                                    var val = imageItemLinkInput.value;
                                    addImageSource(val);
                                    hideDialog();
                                    imageItemLinkInput.value = '';
                                }
                            });
                            dialogInner.appendChild(dialogTitle);

                            dialogue.appendChild(close);
                            dialogInner.appendChild(boxContent);
                            dialogue.appendChild(dialogInner);

                            controlsTool.WebRTCClass.roomsMediaContainer().appendChild(dialogue);
                            setTimeout(function () {
                                Q.activate(
                                    Q.Tool.setUpElement(
                                        dialogue, // or pass an existing element
                                        "Q/resize",
                                        {
                                            move: true,
                                            activateOnElement: dialogTitle,
                                            resize: false,
                                            active: true,
                                            moveWithinArea: 'window',
                                        }
                                    ),
                                    {},
                                    function () {

                                    }
                                );
                            }, 3000)

                            var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                            var dialogWidth = 400;
                            dialogue.style.width = dialogWidth + 'px';
                            console.log('dialogWidth', dialogWidth);
                            if(Q.info.isMobile) {
                                dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                dialogue.style.bottom = (controlsRect.height + 10) + 'px';
                            } else {
                                dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                dialogue.style.top = (window.innerHeight/ 2 - 100) + 'px';
                            }


                            close.addEventListener('click', function () {
                                hideDialog();
                            });

                            function closeOnWindowClick(e) {
                                if (!(_dialogueEl.contains(e.target) || e.target.matches('.Streams_webrtc_popup-add-image'))
                                    && !dropUpMenu.classList.contains('Streams_webrtc_hidden')) {
                                    dropUpMenu.classList.add('Streams_webrtc_hidden');
                                    window.removeEventListener('click', closeOnWindowClick)
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }

                            function showDialog(e) {
                                imageItemInput.value = '';
                                if(_dialogueEl.classList.contains('Streams_webrtc_hidden')) {
                                    _dialogueEl.classList.remove('Streams_webrtc_hidden');
                                    var _clientX = e.clientX;
                                    var _clientY = e.clientY;

                                    _isHidden = false;

                                    var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                                    if(Q.info.isMobile) {
                                        dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                        dialogue.style.top = (controlsRect.height + 10) + 'px';
                                    } else {
                                        dialogue.style.left = (_clientX + 50) + 'px';
                                        dialogue.style.top = (_clientY - 200) + 'px';
                                    }
                                    window.removeEventListener('click', closeOnWindowClick)

                                }
                            }

                            function hideDialog() {
                                if(!_dialogueEl.classList.contains('Streams_webrtc_hidden')){
                                    _dialogueEl.classList.add('Streams_webrtc_hidden');
                                    _isHidden = true;
                                }
                            }

                            function toggle(e) {
                                if(_isHidden) {
                                    showDialog(e);
                                } else hideDialog(e);
                            }

                            return {
                                hideDialog: hideDialog,
                                showDialog: showDialog,
                                toggle: toggle
                            }
                        }())

                        return {
                            syncList: syncList,
                            loadList: loadList,
                            moveForward: moveForward,
                            moveBackward: moveBackward,
                            removeSource: removeSource,
                            addImageSource: addImageSource,
                            addWatermark: addWatermark,
                            addBackground: addBackground,
                            addVideoSource: addVideoSource,
                            getSelectedSource: getSelectedSource,
                            getSourcesList: getSourcesList,
                            createOrGet: createVisualSourcesList
                        }
                    }())

                    var audioSources = (function () {
                        var AudioListItem = function (name) {
                            var sourceInstance =this;
                            this.listType = 'audio';
                            this.title = name != null ? name : null;
                            this.remove = function () {
                                var currentitem = this;
                                if(this.itemEl != null && this.itemEl.parentNode != null) this.itemEl.parentNode.removeChild(this.itemEl);
                                for(var i in _audioList) {
                                    if(_audioList[i] == currentitem) {
                                        _audioList.splice(i, 1);
                                        break;
                                    }
                                }
                            };
                            this.isActive = function() {
                                console.log('isActive', this)
                                var currentitem = this;
                                var sources = scenesInterface.getActive().sceneInstance.audioSources;
                                console.log('isActive active', scenesInterface.getActive().sceneInstance.audioSources)

                                for(let s in sources) {
                                    console.log('isActive for', sources[s], currentitem._sourceInstance)

                                    if(sources[s] == currentitem._sourceInstance) {
                                        console.log('isActive active')

                                        return true;
                                    }
                                }
                                console.log('isActive inactive')

                                return false;
                            };
                            this.unmute = function() {
                                console.log('mute')

                                this.sourceInstance.active = true;
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.audioComposer.unmuteSource(this.sourceInstance, this.params.localOutput);
                                this.switchVisibilityIcon(true);
                                syncList();
                            };
                            this.mute = function() {
                                console.log('mute')
                                this.sourceInstance.active = false;
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.audioComposer.muteSource(this.sourceInstance, this.params.localOutput);
                                this.switchVisibilityIcon(false);

                                syncList();
                            };
                            this.switchVisibilityIcon = function (visibility) {
                                if(visibility === true) {
                                    this.visibilityEl.innerHTML = _streamingIcons.liveOn;
                                } else if (visibility === false) {
                                    this.visibilityEl.innerHTML = _streamingIcons.liveOff;
                                }
                            };
                            this.toggle = function() {
                                if(sourceInstance.sourceInstance.active == true) {
                                    sourceInstance.mute();
                                } else {
                                    sourceInstance.unmute();
                                }
                            };
                            this.params = {
                                _loop: controlsTool.WebRTCLib.getOptions().liveStreaming.loopAudio,
                                _localOutput:controlsTool.WebRTCLib.getOptions().liveStreaming.localOutput,

                                set loop(value) {this._loop = value;},
                                set localOutput(value) {this._localOutput = value;},
                                get localOutput() {return typeof this._localOutput == 'object' ? this._localOutput.checked : this._localOutput;},
                                get loop() {return typeof this._loop == 'object' ? this._loop.checked : this._loop;}
                            };

                            var itemEl = document.createElement('DIV');
                            itemEl.className = 'Streams_webrtc_popup-sources-item';
                            var itemElText = document.createElement('DIV');
                            itemElText.innerHTML = name ? name : '';
                            itemElText.className = 'Streams_webrtc_popup-sources-item-text';
                            var itemElControl = document.createElement('DIV');
                            itemElControl.className = 'Streams_webrtc_popup-sources-item-control';
                            var itemElControlVisibility = document.createElement('DIV');
                            itemElControlVisibility.className = 'Streams_webrtc_popup-sources-item-visibility';
                            itemElControlVisibility.innerHTML = _streamingIcons.liveOn;
                            itemElControl.appendChild(itemElControlVisibility);
                            itemEl.appendChild(itemElText);
                            itemEl.appendChild(itemElControl);
                            this.visibilityEl = itemElControlVisibility;
                            this.itemEl = itemEl;
                            this.titleEl = itemElText;
                            this.itemEl.addEventListener('click', function () {
                                console.log('sourceInstance.sourceInstance', sourceInstance.sourceInstance.sourceType);
                                selectSource(sourceInstance);

                                optionsColumn.update();
                            })
                            itemElControlVisibility.addEventListener('click', this.toggle)
                        }

                        Object.defineProperties(AudioListItem.prototype, {
                            'sourceInstance': {
                                'set': function(instance) {
                                    console.log('sourceInstance set', instance)

                                    this._sourceInstance = instance;
                                    //if(instance == null) return;
                                    var sourceItem = this;
                                    sourceItem.title = instance.name;
                                    instance.on('nameChanged', function (newName) {
                                        console.log('nameChanged set', instance)

                                        sourceItem.title = newName;
                                    })
                                },
                                'get': function() {
                                    return this._sourceInstance;
                                }
                            }
                        });
                        Object.defineProperties(AudioListItem.prototype, {
                            'title': {
                                'set': function(val) { if(this.titleEl) this.titleEl.innerHTML = val; }
                            }
                        });

                        AudioListItem.prototype = new ListItem();

                        function addItem(item) {
                            if (item == null || _audioSourcesListEl == null) return;
                            console.log('visual: addItem', item)
                            console.log('visual: addItem itemEl', item.itemEl)
                            if(item.sourceInstance.sourceType == 'webrtc' && item.sourceInstance.participant.isLocal) {
                                controlsTool.WebRTCLib.event.on('micDisabled', function () {
                                    item.mute();
                                });
                                controlsTool.WebRTCLib.event.on('micEnabled', function () {
                                    item.unmute();
                                });
                            }
                            _audioList.push(item)
                            console.log('visual: addItem element', _audioSourcesListEl)

                            _audioSourcesListEl.insertBefore(item.itemEl, _audioSourcesListEl.firstChild);
                        }

                        function syncList() {
                            var sources = scenesInterface.getActive().sceneInstance.audioSources;
                            console.log('audio: syncList _audioList', _audioList.length);
                            console.log('audio: syncList sources', sources.length);

                            for (let i = _audioList.length - 1; i >= 0; i--) {
                                console.log('audio: syncList _audioList', _audioList[i]);
                                if(_audioList[i] == null) continue;

                                if(_audioList[i].isActive() == false) {
                                    console.log('audio: syncList remove',  _audioList[i]);

                                    _audioList[i].remove();
                                    continue;
                                }
                                if(_audioList[i].sourceInstance.active === true) {
                                    _audioList[i].switchVisibilityIcon(true);
                                } else if(_audioList[i].sourceInstance.active === false) {
                                    _audioList[i].switchVisibilityIcon(false);
                                }
                            }

                            for (let s in sources) {
                                if(sources[s].sourceType == 'webrtcrect' || sources[s].sourceType == 'webrtctext') continue;
                                let newSource = true;
                                for (let i in _audioList) {
                                    if(sources[s] == _audioList[i].sourceInstance) {
                                        newSource = false;
                                        break;
                                    }
                                }

                                if(newSource) {
                                    var title = sources[s].title ? sources[s
                                        ].title : (sources[s].name != null ? sources[s].name : sources[s].sourceType);
                                    var listItem = new AudioListItem(title);
                                    listItem.sourceInstance = sources[s];
                                    console.log('audio: syncList add',  listItem);
                                    if(sources[s].active === true) {
                                        listItem.switchVisibilityIcon(true);
                                    } else if(sources[s].active === false) {
                                        listItem.switchVisibilityIcon(false);
                                    }
                                    addItem(listItem);
                                }
                            }

                            sortList('audio');
                        }

                        function selectSource(sourceItem) {
                            console.log('selectSource', sourceItem)
                            if(sourceItem.itemEl && !sourceItem.itemEl.classList.contains('Streams_webrtc_popup-sources-item-active')) (sourceItem.itemEl).classList.add('Streams_webrtc_popup-sources-item-active');

                            _selectedSource = sourceItem;
                            for(var i in _audioList) {
                                console.log('selectSource for', _audioList[i], _selectedSource)
                                if(_audioList[i] == _selectedSource) continue;
                                console.log('selectSource for --', sourceItem.itemEl, (sourceItem.itemEl).classList.contains('Streams_webrtc_popup-sources-item-active'))

                                if((_audioList[i].itemEl).classList.contains('Streams_webrtc_popup-sources-item-active')) {
                                    console.log('selectSource remove');

                                    (_audioList[i].itemEl).classList.remove('Streams_webrtc_popup-sources-item-active');
                                }
                            }

                            console.log('selectSource _selectedSource', _selectedSource)

                            var left = 0, top = 0;
                            if(_streamingCanvas != null) {
                                left = _streamingCanvas.offsetLeft;
                                top = _streamingCanvas.offsetTop;
                            }
                            var canvasSize = controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.getCanvasSize();
                            var prmtr1 = canvasSize.width * 2 + canvasSize.height * 2
                            var realcanvasSize = _streamingCanvas.getBoundingClientRect();
                            var prmtr2 = realcanvasSize.width * 2 + realcanvasSize.height * 2
                            var timesBigger = prmtr1 >= prmtr2 ? prmtr1 / prmtr2 : prmtr2 / prmtr1;
                            console.log('selectSource timesbigger', prmtr1, prmtr2, timesBigger)
                        }

                        function createAddSourceMenu() {
                            var dropUp = document.createElement('DIV');
                            dropUp.className = 'Streams_webrtc_popup-sources-add-menu';
                            var audioItem = document.createElement('DIV');
                            audioItem.className = 'Streams_webrtc_popup-sources-add-menu-item Streams_webrtc_popup-sources-add-image';
                            var audioItemIcon = document.createElement('DIV');
                            audioItemIcon.className = 'Streams_webrtc_popup-sources-add-menu-icon';
                            var audioItemIconText = document.createElement('DIV');
                            audioItemIconText.className = 'Streams_webrtc_popup-sources-add-menu-text';
                            audioItemIconText.innerHTML = 'Browse Audio';
                            audioItem.addEventListener('click', function (e) {
                                addAudioPopup.showDialog(event);
                            })

                            audioItem.appendChild(audioItemIcon);
                            audioItem.appendChild(audioItemIconText);
                            dropUp.appendChild(audioItem);

                            var savedMedia = document.createElement('DIV');
                            savedMedia.className = 'Streams_webrtc_popup-sources-add-menu-item';
                            var savedMediaIcon = document.createElement('DIV');
                            savedMediaIcon.className = 'Streams_webrtc_popup-sources-add-menu-icon';
                            var savedMediaIconText = document.createElement('DIV');
                            savedMediaIconText.className = 'Streams_webrtc_popup-sources-add-menu-text';
                            savedMediaIconText.innerHTML = 'Saved Media';
                            savedMedia.addEventListener('click', function (e) {
                                console.log('_fileManagerTool', _fileManagerTool)

                                if(!_fileManagerTool) return;

                                _fileManagerTool.showDialogue();

                                _fileManagerTool.state.onSelect.set(function (stream) {
                                    console.log('Streams/fileManager onSelect', stream)
                                    if(stream.fields.attributes == '') {
                                        console.error('Q.file.url is missing')
                                        return;
                                    }
                                    var attributes = JSON.parse(stream.fields.attributes);
                                    var link = Q.url(attributes['Q.file.url']);
                                    console.log('Streams/fileManager attributes', link)
                                    if(stream.fields.type == 'Streams/audio') {
                                        addAudioSource(link);
                                    } else {
                                        alert('Wrong file type')
                                    }

                                    _fileManagerTool.closeDialogue();
                                }, 'importAudio')
                            })

                            savedMedia.appendChild(savedMediaIcon);
                            savedMedia.appendChild(savedMediaIconText);
                            dropUp.appendChild(savedMedia);


                            //_dialogueEl.appendChild(dropUp);
                            return dropUp;
                        }

                        function createAudioSourcesList() {
                            if(_audioSourcesEl != null) return _audioSourcesEl;
                            var dialogBody = document.createElement('DIV');
                            dialogBody.className = 'Streams_webrtc_popup-sources-audio-body';
                            var dialogBodyInner = document.createElement('DIV');
                            dialogBodyInner.className = 'Streams_webrtc_popup-sources-body-inner';
                            _audioSourcesEl = dialogBody;
                            _audioSourcesListEl = dialogBodyInner;

                            var sourcesColumnControl = document.createElement('DIV');
                            sourcesColumnControl.className = 'Streams_webrtc_popup-sources-control';

                            var dropUpMenu = createAddSourceMenu();

                            var sourcesColumnControlAddBtn = document.createElement('DIV');
                            sourcesColumnControlAddBtn.className = 'Streams_webrtc_popup-sources-control-btn Streams_webrtc_popup-sources-control-btn-add';
                            if(!tool.state.managingAudioSources) sourcesColumnControlAddBtn.classList.add('Streams_webrtc_inactive');
                            sourcesColumnControlAddBtn.innerHTML = _streamingIcons.addItem;
                            sourcesColumnControlAddBtn.appendChild(dropUpMenu);

                            sourcesColumnControlAddBtn.addEventListener('click', function (event) {
                                //addAudioPopup.showDialog(event);
                                function hideOnClick(e) {
                                    if (!(sourcesColumnControlAddBtn.contains(e.target) || e.target.matches('.Streams_webrtc_popup-sources-add-menu'))
                                        && dropUpMenu.classList.contains('Streams_webrtc_popup-sources-add-menu-show')) {
                                        dropUpMenu.classList.remove('Streams_webrtc_popup-sources-add-menu-show');
                                        window.removeEventListener('click', hideOnClick)
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }
                                console.log('background', dropUpMenu)
                                if (dropUpMenu.classList.contains('Streams_webrtc_popup-sources-add-menu-show')) {
                                    dropUpMenu.classList.remove('Streams_webrtc_popup-sources-add-menu-show');
                                } else {
                                    dropUpMenu.classList.add('Streams_webrtc_popup-sources-add-menu-show');
                                    window.addEventListener('mousedown', hideOnClick)
                                }
                            });

                            sourcesColumnControl.appendChild(sourcesColumnControlAddBtn);

                            var sourcesColumnControlBtn = document.createElement('DIV');
                            sourcesColumnControlBtn.className = 'Streams_webrtc_popup-sources-control-btn Streams_webrtc_popup-sources-control-btn-remove';
                            if(!tool.state.managingAudioSources) sourcesColumnControlBtn.classList.add('Streams_webrtc_inactive');
                            sourcesColumnControlBtn.innerHTML = _streamingIcons.removeItem;
                            sourcesColumnControlBtn.addEventListener('click', function () {
                                removeAudioSource(_selectedSource);
                            })
                            sourcesColumnControl.appendChild(sourcesColumnControlBtn);

                            dialogBody.appendChild(dialogBodyInner);
                            dialogBody.appendChild(sourcesColumnControl)
                            return dialogBody;
                        }

                        function addAudioSource(e) {
                            console.log('addAudioSource', e)
                            if(typeof e == 'string') {
                                var pathhInfo = e.split('/');
                                var title = pathhInfo[0] + '//.../' + pathhInfo[pathhInfo.length - 1];
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.audioComposer.addSource({
                                    sourceType: 'audio',
                                    title: title,
                                    url: e,
                                });
                            } else {
                                var tgt = e.target || window.event.srcElement,
                                    files = tgt.files;
                                console.log('addAudioSource 2')

                                if (FileReader && files && files.length) {
                                    let file = files[0], mime = file.type;
                                    let reader = new  FileReader();
                                    reader.readAsArrayBuffer(file);
                                    reader.onload = function(e) {
                                        // The file reader gives us an ArrayBuffer:
                                        let buffer = e.target.result;

                                        // We have to convert the buffer to a blob:
                                        let audioBlob = new Blob([new Uint8Array(buffer)], { type: mime });
                                        console.log('addAudioSource onload', audioBlob)

                                        // The blob gives us a URL to the video file:
                                        let url = window.URL.createObjectURL(audioBlob);

                                        controlsTool.WebRTCLib.mediaManager.canvasComposer.audioComposer.addSource({
                                            sourceType: 'audio',
                                            title: files[0].name,
                                            url: url,
                                        });
                                    }

                                }

                            }
                        }

                        function removeAudioSource() {
                            if(_selectedSource != null) {
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.audioComposer.removeSource(_selectedSource.sourceInstance);
                                syncList();
                                _selectedSource = null;
                            };
                            optionsColumn.update();
                        }

                        controlsTool.WebRTCLib.mediaManager.canvasComposer.on('sourceAdded', function (source) {
                            syncList();
                            /*setTimeout(function(){
                        if(source.sourceType == 'webrtc' && source.participant != null) {
                            controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.displayName(source.participant);
                        }
                    }, 3000)*/

                        })

                        controlsTool.WebRTCLib.mediaManager.canvasComposer.on('sourceRemoved', function () {
                            syncList();
                        })

                        controlsTool.WebRTCLib.mediaManager.canvasComposer.on('sourceMoved', function () {
                            syncList();
                        })


                        var addAudioPopup = (function () {
                            var _dialogueEl = null;
                            var _isHidden = true;

                            console.log('addVideoPopup')
                            var dialogue=document.createElement('DIV');
                            dialogue.className = 'Streams_webrtc_dialog-box Streams_webrtc_popup-streaming-box Streams_webrtc_popup-add-audio Streams_webrtc_hidden';
                            _dialogueEl = dialogue;
                            var dialogTitle=document.createElement('H3');
                            dialogTitle.innerHTML = 'Add audio';
                            dialogTitle.className = 'Streams_webrtc_dialog-header Q_dialog_title';

                            var dialogInner=document.createElement('DIV');
                            dialogInner.className = 'Streams_webrtc_dialog-inner';
                            var boxContent=document.createElement('DIV');
                            boxContent.className = 'Streams_webrtc_popup-streaming-box  Streams_webrtc_popup-box';
                            var boxContentText=document.createElement('DIV');
                            boxContentText.innerHTML = 'Please choose file from your computer or enter the link.';
                            var videoItemInput = document.createElement('INPUT');
                            videoItemInput.className = 'Streams_webrtc_popup-sources-add-menu-file';
                            videoItemInput.type = 'file';
                            videoItemInput.name = 'fileAudioSource';
                            videoItemInput.accept = 'audio/mp3, audio/*'
                            videoItemInput.addEventListener('change', function (e) {
                                addAudioSource(e);
                                hideDialog();
                            })

                            var boxContentText2=document.createElement('DIV');
                            boxContentText2.innerHTML = 'OR';
                            var imageItemLinkInput = document.createElement('INPUT');
                            imageItemLinkInput.className = 'Streams_webrtc_popup-sources-add-menu-file';
                            imageItemLinkInput.type = 'text';
                            imageItemLinkInput.placeholder = 'Enter the link';
                            imageItemLinkInput.name = 'fileImageLink';

                            boxContent.appendChild(boxContentText);
                            boxContent.appendChild(videoItemInput);
                            boxContent.appendChild(boxContentText2);
                            boxContent.appendChild(imageItemLinkInput);

                            var close=document.createElement('div');
                            close.className = 'Streams_webrtc_close-dialog-sign';
                            close.style.backgroundImage = 'url("' + Q.url("{{Q}}/img/close.png") + '"';
                            close.style.backgroundRepeat = 'no-repeat';
                            close.style.backgroundSize = 'cover';
                            close.addEventListener('click', function() {
                                /* if(imageItemLinkInput.value != '') {
                                        var val = imageItemLinkInput.value;
                                        addVideoSource(val);
                                        hideDialog();
                                        imageItemLinkInput.value = '';
                                    }*/
                            });
                            dialogInner.appendChild(dialogTitle);

                            dialogue.appendChild(close);
                            dialogInner.appendChild(boxContent);
                            dialogue.appendChild(dialogInner);

                            controlsTool.WebRTCClass.roomsMediaContainer().appendChild(dialogue);
                            setTimeout(function () {
                                Q.activate(
                                    Q.Tool.setUpElement(
                                        dialogue, // or pass an existing element
                                        "Q/resize",
                                        {
                                            move: true,
                                            activateOnElement: dialogTitle,
                                            resize: false,
                                            active: true,
                                            moveWithinArea: 'window',
                                        }
                                    ),
                                    {},
                                    function () {

                                    }
                                );
                            }, 3000)

                            var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                            var dialogWidth = 400;
                            dialogue.style.width = dialogWidth + 'px';
                            console.log('dialogWidth', dialogWidth);
                            if(Q.info.isMobile) {
                                dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                dialogue.style.bottom = (controlsRect.height + 10) + 'px';
                            } else {
                                dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                dialogue.style.top = (window.innerHeight/ 2 - 100) + 'px';
                            }


                            close.addEventListener('click', function () {
                                hideDialog();
                            });

                            function closeOnWindowClick(e) {
                                if (!(_dialogueEl.contains(e.target) || e.target.matches('.Streams_webrtc_popup-add-image'))
                                    && !dropUpMenu.classList.contains('Streams_webrtc_hidden')) {
                                    dropUpMenu.classList.add('Streams_webrtc_hidden');
                                    window.removeEventListener('click', closeOnWindowClick)
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }

                            function showDialog(e) {
                                videoItemInput.value = '';
                                if(_dialogueEl.classList.contains('Streams_webrtc_hidden')) {
                                    _dialogueEl.classList.remove('Streams_webrtc_hidden');
                                    var _clientX = e.clientX;
                                    var _clientY = e.clientY;

                                    _isHidden = false;

                                    var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                                    if(Q.info.isMobile) {
                                        dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                                        dialogue.style.top = (controlsRect.height + 10) + 'px';
                                    } else {
                                        dialogue.style.left = (_clientX + 50) + 'px';
                                        dialogue.style.top = (_clientY - 200) + 'px';
                                    }
                                    window.removeEventListener('click', closeOnWindowClick)

                                }
                            }

                            function hideDialog() {
                                if(!_dialogueEl.classList.contains('Streams_webrtc_hidden')){
                                    _dialogueEl.classList.add('Streams_webrtc_hidden');
                                    _isHidden = true;
                                }
                            }

                            function toggle(e) {
                                if(_isHidden) {
                                    showDialog(e);
                                } else hideDialog(e);
                            }

                            return {
                                hideDialog: hideDialog,
                                showDialog: showDialog,
                                toggle: toggle
                            }
                        }())

                        return {
                            syncList: syncList,
                            createOrGet: createAudioSourcesList,
                            removeSource: removeAudioSource,
                        }
                    }())


                    function showVisualSources() {
                        _sourcesEl.innerHTML = '';
                        _sourcesEl.appendChild(visualSources.createOrGet());
                        visualSources.syncList();
                    }

                    function showAudioSources() {
                        _sourcesEl.innerHTML = '';
                        _sourcesEl.appendChild(audioSources.createOrGet());
                        audioSources.syncList();
                    }

                    function tabHandler(e) {
                        var tabEl = e.currentTarget;
                        console.log('tabHandler tabEl', tabEl)

                        var tabName = tabEl.dataset.tab;
                        if(!tabName) return;
                        if(tabName == 'visual') {
                            _activeInterface = visualSources;
                            showVisualSources();
                        } else if(tabName == 'audio') {
                            _activeInterface = audioSources;
                            showAudioSources();
                        }

                        for(let e in _sourcesTabs.children) {
                            if(typeof _sourcesTabs.children[e] != 'object') continue;
                            console.log('tabHandler', _sourcesTabs.children[e])
                            if(_sourcesTabs.children[e] == tabEl) {
                                if(!_sourcesTabs.children[e].classList.contains('Streams_webrtc_popup-sources-title-tab-active')) {
                                    _sourcesTabs.children[e].classList.add('Streams_webrtc_popup-sources-title-tab-active');
                                }
                                continue;
                            }
                            if(_sourcesTabs.children[e].classList.contains('Streams_webrtc_popup-sources-title-tab-active')) {
                                _sourcesTabs.children[e].classList.remove('Streams_webrtc_popup-sources-title-tab-active');
                            }
                        }
                    }

                    function createSourcesCol() {
                        var sourcesColumn = document.createElement('DIV');
                        sourcesColumn.className = 'Streams_webrtc_popup-sources';
                        var sourcesColumnInner = document.createElement('DIV');
                        sourcesColumnInner.className = 'Streams_webrtc_popup-sources-inner';
                        var sourcesColumnTitle = document.createElement('DIV');
                        sourcesColumnTitle.className = 'Streams_webrtc_popup-sources-title';
                        var sourcesColumnTitleInner = _sourcesTabs = document.createElement('DIV');
                        sourcesColumnTitleInner.className = 'Streams_webrtc_popup-sources-title-inner';
                        var sourcesColumnTitleTab = document.createElement('DIV');
                        sourcesColumnTitleTab.className = 'Streams_webrtc_popup-sources-title-tab Streams_webrtc_popup-sources-title-tab-active';
                        sourcesColumnTitleTab.dataset.tab = 'visual';
                        var sourcesColumnTitleTabInner = document.createElement('DIV');
                        sourcesColumnTitleTabInner.className = 'Streams_webrtc_popup-sources-title-tab-inner';
                        sourcesColumnTitleTabInner.innerHTML = 'Sources';
                        sourcesColumnTitleTab.appendChild(sourcesColumnTitleTabInner);
                        sourcesColumnTitleInner.appendChild(sourcesColumnTitleTab);
                        var audioColumnTitleTab = document.createElement('DIV');
                        audioColumnTitleTab.className = 'Streams_webrtc_popup-sources-title-tab';
                        audioColumnTitleTab.dataset.tab = 'audio';
                        var audioColumnTitleTabInner = document.createElement('DIV');
                        audioColumnTitleTabInner.className = 'Streams_webrtc_popup-sources-title-tab-inner';
                        audioColumnTitleTabInner.innerHTML = 'Audio';
                        audioColumnTitleTab.appendChild(audioColumnTitleTabInner);
                        sourcesColumnTitleInner.appendChild(audioColumnTitleTab);
                        sourcesColumnTitle.appendChild(sourcesColumnTitleInner);


                        var sourcesColumnBody = document.createElement('DIV');
                        sourcesColumnBody.className = 'Streams_webrtc_popup-sources-body';
                        sourcesColumnInner.appendChild(sourcesColumnTitle);
                        sourcesColumnInner.appendChild(sourcesColumnBody);
                        sourcesColumn.appendChild(sourcesColumnInner);
                        _sourcesEl = sourcesColumnBody;

                        _sourcesEl.appendChild(visualSources.createOrGet());
                        audioSources.createOrGet();
                        _activeInterface = visualSources;

                        sourcesColumnTitleTab.addEventListener('click', tabHandler);
                        audioColumnTitleTab.addEventListener('click', tabHandler);

                        return sourcesColumn;
                    }

                    function update() {
                        visualSources.syncList();
                        audioSources.syncList();
                    }

                    function loadSources(scene) {
                        if(scene == null) return;
                        console.log('loadSources', scene)
                        //visualSources.loadList(scene.sources)
                        //audioSources.loadList(scene.audioSources)
                    }

                    function getSelectedSource() {
                        return _selectedSource;
                        if(_activeInterface == visualSources) {
                            return visualSources.getSelectedSource();
                        } else {
                            return audioSources.getSelectedSource();
                        }
                    }

                    return {
                        createSourcesCol: createSourcesCol,
                        update: update,
                        loadSources: loadSources,
                        getSelectedSource: getSelectedSource,
                        visualSources: visualSources
                    }

                }())

                var optionsColumn = (function () {
                    var _activeView = null;

                    function hideActiveView() {
                        if(_activeView != null) {
                            _activeView.hide();
                        }
                        /*if(_activeView && _activeView.parentNode != null) {
                                _activeView.parentNode.removeChild(_activeView);
                            }*/
                    }

                    function createMediaControls(source) {
                        console.log('createMediaControls',  source.params);

                        var mediaElement = source.sourceInstance.audioInstance || source.sourceInstance.videoInstance;

                        var dialogControlsBody = document.createElement('DIV');
                        dialogControlsBody.className = 'Streams_webrtc_popup-options-params-mediacontrols';

                        var seektimeCon = document.createElement('DIV');
                        seektimeCon.className = 'Streams_webrtc_popup-options-params-seekbar-con';
                        var seektimeEl = document.createElement('DIV');
                        seektimeEl.className = 'Streams_webrtc_popup-options-params-seekbar';
                        var seektimeProgress = document.createElement('span');
                        seektimeProgress.className = 'Streams_webrtc_popup-options-params-seekbar-btn';
                        seektimeEl.appendChild(seektimeProgress);
                        seektimeCon.appendChild(seektimeEl);
                        dialogControlsBody.appendChild(seektimeCon);

                        var audioControlsCon = document.createElement('DIV');
                        audioControlsCon.className = 'Streams_webrtc_popup-options-params-controls-con';
                        var playPauseCon = document.createElement('DIV');
                        playPauseCon.className = 'Streams_webrtc_popup-options-params-controls-con';
                        var playPauseInner = document.createElement('DIV');
                        playPauseInner.className = 'Streams_webrtc_popup-options-params-controls-inner';
                        var playPauseBtn = document.createElement('DIV');
                        playPauseBtn.className = 'Streams_webrtc_popup-options-params-controls-btn';
                        playPauseBtn.innerHTML = mediaElement.paused ? _streamingIcons.playIcon : _streamingIcons.pauseIcon;
                        playPauseInner.appendChild(playPauseBtn);
                        playPauseCon.appendChild(playPauseInner);
                        audioControlsCon.appendChild(playPauseCon);


                        var volumeCon = document.createElement('DIV');
                        volumeCon.className = 'Streams_webrtc_popup-options-params-controls-volume-con';
                        var volumeIcon = document.createElement('DIV');
                        volumeIcon.className = 'Streams_webrtc_popup-options-params-controls-volume-icon'
                        volumeIcon.innerHTML = _streamingIcons.disabledEnabledSpeaker;
                        var volumeSliderCon = document.createElement('DIV');
                        volumeSliderCon.className = 'Streams_webrtc_popup-options-params-volume-slider-con';
                        var volume = document.createElement('DIV');
                        volume.className = 'Streams_webrtc_popup-options-params-controls-volume'
                        var volumeSlider = document.createElement('SPAN');
                        volumeSlider.className = 'Streams_webrtc_popup-options-params-controls-volume-slider';
                        volumeSlider.style.width = mediaElement.volume * 100 + '%';
                        volume.appendChild(volumeSlider);
                        volumeSliderCon.appendChild(volume);
                        volumeCon.appendChild(volumeIcon);
                        volumeCon.appendChild(volumeSliderCon);
                        audioControlsCon.appendChild(volumeCon);

                        var audioTimeCon = document.createElement('DIV');
                        audioTimeCon.className = 'Streams_webrtc_popup-options-params-audio-time-con';
                        var audioTimeInner = document.createElement('DIV');
                        audioTimeInner.className = 'Streams_webrtc_popup-options-params-audio-time-inner';
                        var audioTimeCurrent = document.createElement('SPAN');
                        audioTimeCurrent.className = 'Streams_webrtc_popup-options-params-audio-time-cur';
                        var audioTimeSpliter = document.createElement('SPAN');
                        audioTimeSpliter.className = 'Streams_webrtc_popup-options-params-audio-time-split';
                        audioTimeSpliter.innerHTML = '/';
                        var audioTimeDuration = document.createElement('SPAN');
                        audioTimeDuration.className = 'Streams_webrtc_popup-options-params-audio-time-dur';
                        audioTimeInner.appendChild(audioTimeCurrent);
                        audioTimeInner.appendChild(audioTimeSpliter);
                        audioTimeInner.appendChild(audioTimeDuration);
                        audioTimeCon.appendChild(audioTimeInner);
                        audioControlsCon.appendChild(audioTimeCon);


                        var loopAndLocalPlayCon = document.createElement('DIV');
                        loopAndLocalPlayCon.className = 'Streams_webrtc_popup-options-params-loopplay-con';
                        var loopAudioCon = document.createElement('DIV');
                        loopAudioCon.className = 'Streams_webrtc_popup-options-params-loopaudio-con';
                        var loopAudioLabel = document.createElement('LABEL');
                        loopAudioLabel.className = 'Streams_webrtc_popup-options-params-looplabel';
                        var loopPlayCheckbox = document.createElement('INPUT');
                        loopPlayCheckbox.type = 'checkbox';
                        loopPlayCheckbox.name = 'loopAudio';
                        loopPlayCheckbox.checked = source.params.loop;
                        var loopPlayCheckboxText = document.createTextNode('Loop');
                        loopAudioLabel.appendChild(loopPlayCheckbox);
                        loopAudioLabel.appendChild(loopPlayCheckboxText);
                        loopAudioCon.appendChild(loopAudioLabel);
                        loopAndLocalPlayCon.appendChild(loopAudioCon);

                        var PlayLocallyCon = document.createElement('DIV');
                        PlayLocallyCon.className = 'Streams_webrtc_popup-options-params-playlocally-con';
                        var playLocallyLabel = document.createElement('LABEL');
                        playLocallyLabel.className = 'Streams_webrtc_popup-options-params-playlocally-label';
                        var playLocallyCheckbox = document.createElement('INPUT');
                        playLocallyCheckbox.type = 'checkbox';
                        playLocallyCheckbox.name = 'loopAudio';
                        playLocallyCheckbox.checked = source.params.localOutput;
                        var playLocCheckboxText = document.createTextNode('Local output');
                        playLocallyLabel.appendChild(playLocallyCheckbox);
                        playLocallyLabel.appendChild(playLocCheckboxText);
                        PlayLocallyCon.appendChild(playLocallyLabel);
                        loopAndLocalPlayCon.appendChild(PlayLocallyCon);

                        dialogControlsBody.appendChild(audioControlsCon);
                        dialogControlsBody.appendChild(loopAndLocalPlayCon);

                        seektimeCon.addEventListener('mouseenter', function(){
                            if(!seektimeProgress.classList.contains("Streams_webrtc_popup-options-seekbar-hover")) {
                                seektimeProgress.classList.add("Streams_webrtc_popup-options-seekbar-hover");
                            }
                        })
                        seektimeCon.addEventListener('mouseleave', function(){
                            if(seektimeProgress.classList.contains("Streams_webrtc_popup-options-seekbar-hover")) {
                                seektimeProgress.classList.remove("Streams_webrtc_popup-options-seekbar-hover");
                            }
                        })

                        function getOffsetLeft(elem) {
                            var offsetLeft = 0;
                            do {
                                if ( !isNaN( elem.offsetLeft ) )
                                {
                                    offsetLeft += elem.offsetLeft;
                                }
                            } while( elem = elem.offsetParent );
                            return offsetLeft;
                        }

                        mediaElement.addEventListener('timeupdate', function () {
                            var percentage = ( mediaElement.currentTime / mediaElement.duration ) * 100;
                            seektimeProgress.style.width = percentage+'%';
                            updateSeekTime();
                        })
                        function updateSeekTime(){
                            var nt = mediaElement.currentTime * (100 / mediaElement.duration);
                            var curmins = Math.floor(mediaElement.currentTime / 60);
                            var cursecs = Math.floor(mediaElement.currentTime - curmins * 60);
                            var durmins = Math.floor(mediaElement.duration / 60);
                            var dursecs = Math.floor(mediaElement.duration - durmins * 60);
                            if(cursecs < 10){ cursecs = "0"+cursecs; }
                            if(dursecs < 10){ dursecs = "0"+dursecs; }
                            //if(curmins < 10){ curmins = "0"+curmins; }
                            //if(durmins < 10){ durmins = "0"+durmins; }
                            audioTimeCurrent.innerHTML = curmins+":"+cursecs;
                            audioTimeDuration.innerHTML = durmins+":"+dursecs;
                        }

                        function dragTimeSlider(e) {
                            var offsetLeft = getOffsetLeft(seektimeEl)
                            var left = (e.pageX - offsetLeft);

                            var totalWidth = seektimeEl.offsetWidth;
                            var percentage = ( left / totalWidth );
                            var timeToSet = mediaElement.duration * percentage;
                            mediaElement.currentTime = timeToSet;
                        }
                        seektimeEl.addEventListener("mousedown", function(){
                            console.log('mousedown')

                            window.addEventListener('mousemove', dragTimeSlider)

                            function removeListener() {
                                window.removeEventListener('mousemove', dragTimeSlider)
                                window.removeEventListener('mouseup', removeListener)
                            }
                            window.addEventListener('mouseup', removeListener)
                        });


                        seektimeEl.addEventListener("mouseup", function(e){
                            var offsetLeft = getOffsetLeft(seektimeEl)
                            var left = (e.pageX - offsetLeft);
                            var totalWidth = seektimeEl.offsetWidth;
                            var percentage = ( left / totalWidth );
                            var timeToSet = mediaElement.duration * percentage;
                            mediaElement.currentTime = timeToSet;
                        });

                        playPauseBtn.addEventListener("click", function(e){
                            console.log('mediaElement', mediaElement)
                            if(mediaElement.paused){
                                mediaElement.play();
                                playPauseBtn.innerHTML = _streamingIcons.pauseIcon;
                            } else {
                                mediaElement.pause();
                                playPauseBtn.innerHTML = _streamingIcons.playIcon;
                            }
                        });

                        if(mediaElement.muted) {
                            volumeSlider.style.width = '0%';
                        }

                        mediaElement.addEventListener('volumechange', function () {
                            var percentage = ( mediaElement.volume / 1 ) * 100;
                            volumeSlider.style.width = percentage+'%';
                        })

                        mediaElement.addEventListener('pause', function (e) {
                            console.log('mediaElement pause', mediaElement)
                        })

                        mediaElement.addEventListener('play', function (e) {
                            console.log('mediaElement play', mediaElement)
                        })

                        function dragVolumeSlider(e) {
                            var offsetLeft = getOffsetLeft(volume)
                            var left = (e.pageX - offsetLeft);
                            if(Math.sign(left) == -1) {
                                left = 0;
                            }
                            var totalWidth = volume.offsetWidth;

                            if(left > totalWidth) {
                                left = totalWidth;
                            }
                            var volumeToSet = ( left / totalWidth );
                            var prevVolume = mediaElement.volume;
                            mediaElement.volume = volumeToSet;
                            if(volumeToSet != 0 && mediaElement.muted) mediaElement.muted = false;

                            updateVolumeIcons(volumeToSet, prevVolume);
                        }

                        function updateVolumeIcons(volumeToSet, prevVolume) {
                            var waves = volumeIcon.querySelector('#StreamsWebrtcWaves');
                            var disabledWaves = volumeIcon.querySelectorAll('.StreamsWebrtcDisabledparts.StreamsWebrtcWaves1 .StreamsWebrtcDisabledparts.StreamsWebrtcWaves2');
                            var secondWaveParts = volumeIcon.querySelectorAll('.StreamsWebrtcWaves2');
                            var disabledPartOfSpeaker = volumeIcon.querySelector('polygon.StreamsWebrtcDisabledparts');
                            var crossline = volumeIcon.querySelector('#StreamsWebrtcCrossline');

                            function toggleSecondWave(value) {
                                for (let i = 0; i < secondWaveParts.length; ++i) {
                                    secondWaveParts[i].style.opacity = value;
                                }
                            }
                            function toggleDisabledIcon(value) {
                                for (let i = 0; i < disabledWaves.length; ++i) {
                                    disabledWaves[i].style.opacity = (value === 1 ? 0 : 1);
                                }
                                disabledPartOfSpeaker.style.opacity = (value === 1 ? 0 : 1);
                                crossline.style.opacity = (value === 1 ? 1 : 0);
                            }

                            if(volumeToSet <= 0.5 && volumeToSet > 0 && !mediaElement.muted) {
                                toggleDisabledIcon(0);
                                toggleSecondWave(0);
                            } else if (volumeToSet > 0.5 && !mediaElement.muted) {
                                toggleDisabledIcon(0);
                                toggleSecondWave(1);
                            } else {
                                toggleSecondWave(1);
                                toggleDisabledIcon(1);
                            }
                        }
                        updateVolumeIcons(mediaElement.volume)

                        volumeIcon.addEventListener("click", function () {
                            console.log('speaker',mediaElement.volume,  mediaElement.muted)
                            if(mediaElement.volume == 0 || mediaElement.muted) {
                                console.log('speaker 1',source.params.lastVolumeValue)

                                mediaElement.volume = source.params.lastVolumeValue != null ? source.params.lastVolumeValue : 1;
                                if(mediaElement.muted) mediaElement.muted = false;
                            } else {
                                source.params.lastVolumeValue = mediaElement.volume;
                                mediaElement.volume = 0;
                            }
                            updateVolumeIcons(mediaElement.volume)
                        });


                        volume.addEventListener("mousedown", function(){
                            window.addEventListener('mousemove', dragVolumeSlider)

                            function removeListener() {
                                window.removeEventListener('mousemove', dragVolumeSlider)
                                window.removeEventListener('mouseup', removeListener)
                            }
                            window.addEventListener('mouseup', removeListener)
                        });


                        volume.addEventListener("click", dragVolumeSlider);

                        loopPlayCheckbox.addEventListener("click", function (e) {
                            if(this.checked) {
                                (source.sourceInstance.audioInstance || source.sourceInstance.videoInstance).loop = true;
                            } else {
                                (source.sourceInstance.audioInstance || source.sourceInstance.videoInstance).loop = false;
                            }
                        });

                        playLocallyCheckbox.addEventListener("click", function (e) {
                            if(this.checked) {
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.audioComposer.unmuteSourceLocally(source.sourceInstance);
                            } else {
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.audioComposer.muteSourceLocally(source.sourceInstance);
                            }
                        });


                        source.params.loop = loopPlayCheckbox;
                        source.params.localOutput = playLocallyCheckbox;

                        return dialogControlsBody;
                    }

                    var canvasLayoutOptions = (function () {
                        var _dialogueEl = null;
                        var _layoutTabs = null;
                        var _dialogueBody = null;
                        var _layoutList = [];
                        var _selectedLayout = null;
                        var _layoutListEl = null;
                        var _layoutParamsEl = null;

                        function LayoutListItem(name) {
                            var listInstance = this;
                            this.active = true;
                            this.title = name != null ? name : null;
                            this.itemEl = null;
                            this.handler = function () {

                            }
                            this.isActive = function() {

                            };
                            this.turnOn = function() {

                            };
                            this.turnOff = function() {

                            };

                            var itemEl = document.createElement('DIV');
                            itemEl.className = 'Streams_webrtc_canvas-popup-list-item';
                            var itemElText = document.createElement('DIV');
                            itemElText.innerHTML = name ? name : '';
                            itemElText.className = 'Streams_webrtc_canvas-popup-list-text';
                            itemEl.appendChild(itemElText);
                            this.itemEl = itemEl;
                            this.itemEl.addEventListener('click', function () {
                                selectLayout(listInstance)
                            })
                        }

                        function selectLayout(layoutItem) {
                            console.log('selectLayout', layoutItem)
                            if(layoutItem.itemEl && !layoutItem.itemEl.classList.contains('Streams_webrtc_canvas-popup-list-item-active')) {
                                (layoutItem.itemEl).classList.add('Streams_webrtc_canvas-popup-list-item-active');
                            }

                            _selectedLayout = layoutItem;
                            for(let i in _layoutList) {
                                console.log('selectLayout for', _layoutList[i], _selectedLayout)
                                if(_layoutList[i] == _selectedLayout) continue;
                                console.log('selectLayout for --', layoutItem.itemEl, (layoutItem.itemEl).classList.contains('Streams_webrtc_canvas-popup-list-item-active'))

                                if((_layoutList[i].itemEl).classList.contains('Streams_webrtc_canvas-popup-list-item-active')) {
                                    console.log('selectLayout remove');
                                    (_layoutList[i].itemEl).classList.remove('Streams_webrtc_canvas-popup-list-item-active');
                                }
                            }

                            controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.updateWebRTCCanvasLayout(layoutItem.key);
                        }

                        function createLayoutList() {
                            if(_layoutListEl != null) return _layoutListEl;
                            var dialogBodyInner = document.createElement('DIV');
                            dialogBodyInner.className = 'Streams_webrtc_popup-options-body-inner Streams_webrtc_popup-options-layouts-body';

                            var tiledLayout = new LayoutListItem('Tiled');
                            tiledLayout.key = 'tiledStreamingLayout';
                            _layoutList.push(tiledLayout);
                            dialogBodyInner.appendChild(tiledLayout.itemEl);

                            var fullScreenLayout = new LayoutListItem('Screen sharing');
                            fullScreenLayout.key = 'screenSharing';
                            _layoutList.push(fullScreenLayout);
                            dialogBodyInner.appendChild(fullScreenLayout.itemEl);

                            var sideScreensharing = new LayoutListItem('Side screen sharing');
                            sideScreensharing.key = 'sideScreenSharing';
                            _layoutList.push(sideScreensharing);
                            dialogBodyInner.appendChild(sideScreensharing.itemEl);

                            var audioOnlyLayout = new LayoutListItem('Audio only');
                            audioOnlyLayout.key = 'audioOnly';
                            _layoutList.push(audioOnlyLayout);
                            dialogBodyInner.appendChild(audioOnlyLayout.itemEl);

                            var audioScreenLayout = new LayoutListItem('Audio only + screen sharing');
                            audioScreenLayout.key = 'audioScreenSharing';
                            _layoutList.push(audioScreenLayout);
                            dialogBodyInner.appendChild(audioScreenLayout.itemEl);

                            _layoutListEl = dialogBodyInner;

                            return dialogBodyInner;
                        }

                        function createParamsList() {
                            if(_layoutParamsEl != null) return _layoutParamsEl;
                            var dialogBodyInner = document.createElement('DIV');
                            dialogBodyInner.className = 'Streams_webrtc_popup-options-body-inner Streams_webrtc_popup-options-params-body';

                            var showNameCon = document.createElement('DIV');
                            var showName = document.createElement('INPUT');
                            showName.type = 'checkbox';
                            showName.id = 'showNames';
                            showName.name = 'showNames';
                            showName.checked = controlsTool.WebRTCLib.getOptions().liveStreaming.showLabelWithNames;
                            var showNameLabel = document.createElement('Label');
                            showNameLabel.appendChild(showName);
                            showNameLabel.appendChild(document.createTextNode("Show participants' name"));
                            showNameCon.appendChild(showNameLabel);

                            var showBordersCon = document.createElement('DIV');
                            var showBorders = document.createElement('INPUT');
                            showBorders.type = 'checkbox';
                            showBorders.id = 'showBorders';
                            showBorders.name = 'showBorders';
                            showBorders.checked = controlsTool.WebRTCLib.getOptions().liveStreaming.showLayoutBorders;
                            var showBordersLabel = document.createElement('Label');
                            showBordersLabel.appendChild(showBorders);
                            showBordersLabel.appendChild(document.createTextNode("Show layout borders"));
                            showBordersCon.appendChild(showBordersLabel);

                            var marginsCon = document.createElement('DIV');
                            marginsCon.className = 'Streams_webrtc_popup-options-params-margins';
                            var marginsInput = document.createElement('INPUT');
                            marginsInput.type = 'number';
                            marginsInput.id = 'layoutMargins';
                            marginsInput.name = 'layoutMargins';
                            marginsInput.value = controlsTool.WebRTCLib.getOptions().liveStreaming.tiledLayoutMargins;
                            var marginsInputLabel = document.createElement('Label');
                            marginsInputLabel.appendChild(document.createTextNode("Layout margins:"));
                            marginsCon.appendChild(marginsInputLabel);
                            marginsCon.appendChild(marginsInput);

                            /*var audioOnlyCon = document.createElement('DIV');
                                var audioOnly = document.createElement('INPUT');
                                audioOnly.type = 'checkbox';
                                audioOnly.id = 'audioOnly';
                                audioOnly.name = 'audioOnly';
                                audioOnly.checked = controlsTool.WebRTCLib.getOptions().liveStreaming.audioOnlyLayout;
                                var audioOnlyLabel = document.createElement('Label');
                                audioOnlyLabel.appendChild(audioOnly);
                                audioOnlyLabel.appendChild(document.createTextNode("Audio-only layout"));
                                audioOnlyCon.appendChild(audioOnlyLabel);*/

                            var webrtcLayoutRect = controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.getWebrtcLayoutRect();

                            //size
                            var sizeAndPositionCon = document.createElement('DIV');
                            sizeAndPositionCon.className = 'Streams_webrtc_popup-options-params-size-pos';

                            var sizeCon = document.createElement('DIV');
                            sizeCon.className = 'Streams_webrtc_popup-options-params-size';
                            sizeAndPositionCon.appendChild(sizeCon);

                            var sizeWidthCon = document.createElement('DIV');
                            sizeWidthCon.className = 'Streams_webrtc_popup-options-params-size-width';
                            sizeCon.appendChild(sizeWidthCon);
                            var widthText = document.createElement('SPAN');
                            widthText.innerHTML = 'Width: ';
                            sizeWidthCon.appendChild(widthText);
                            var width = document.createElement('INPUT');
                            width.type = 'text';
                            width.value = webrtcLayoutRect.width;
                            sizeWidthCon.appendChild(width);

                            var sizeHeightCon = document.createElement('DIV');
                            sizeHeightCon.className = 'Streams_webrtc_popup-options-params-size-height';
                            sizeCon.appendChild(sizeHeightCon);
                            var heightText = document.createElement('SPAN');
                            heightText.innerHTML = 'Height: ';
                            sizeHeightCon.appendChild(heightText);
                            var height = document.createElement('INPUT');
                            height.type = 'text';
                            height.value = webrtcLayoutRect.height;
                            sizeHeightCon.appendChild(height);


                            //position
                            var positionCon = document.createElement('DIV');
                            positionCon.className = 'Streams_webrtc_popup-options-params-position';
                            sizeAndPositionCon.appendChild(positionCon);

                            var topPositionCon = document.createElement('DIV');
                            topPositionCon.className = 'Streams_webrtc_popup-options-params-position-top';
                            positionCon.appendChild(topPositionCon);
                            var topText = document.createElement('SPAN');
                            topText.innerHTML = 'Top: ';
                            topPositionCon.appendChild(topText);
                            var topPos = document.createElement('INPUT');
                            topPos.type = 'text';
                            topPos.value = webrtcLayoutRect.y;
                            topPositionCon.appendChild(topPos);

                            var leftPositionCon = document.createElement('DIV');
                            leftPositionCon.className = 'Streams_webrtc_popup-options-params-position-left';
                            positionCon.appendChild(leftPositionCon);
                            var leftText = document.createElement('SPAN');
                            leftText.innerHTML = 'Left: ';
                            leftPositionCon.appendChild(leftText);
                            var leftPos = document.createElement('INPUT');
                            leftPos.type = 'text';
                            leftPos.value = webrtcLayoutRect.x;
                            leftPositionCon.appendChild(leftPos);

                            var audioBgCon = document.createElement('DIV');
                            audioBgCon.className = 'Streams_webrtc_popup-options-params-position-audio-bg'
                            var audioBg = document.createElement('INPUT');
                            audioBg.type = 'color';
                            audioBg.id = 'audioBgColor';
                            audioBg.name = 'audioBgColor';
                            audioBg.value = controlsTool.WebRTCLib.getOptions().liveStreaming.audioLayoutBgColor;
                            var removeBg = document.createElement('DIV');
                            removeBg.className = 'Streams_webrtc_popup-options-params-position-audio-res'
                            removeBg.innerHTML = '&#10060;'
                            audioBgCon.appendChild(document.createTextNode("Layout background color: "));
                            audioBgCon.appendChild(audioBg);
                            audioBgCon.appendChild(removeBg);

                            //dialogBodyInner.appendChild(showNameCon);
                            //dialogBodyInner.appendChild(showBordersCon);
                            dialogBodyInner.appendChild(marginsCon);
                            //dialogBodyInner.appendChild(audioOnlyCon);
                            dialogBodyInner.appendChild(sizeAndPositionCon);
                            dialogBodyInner.appendChild(audioBgCon);

                            _layoutParamsEl = dialogBodyInner;

                            showNameLabel.addEventListener('click', function (e) {
                                controlsTool.WebRTCLib.getOptions().liveStreaming.showLabelWithNames = showName.checked;
                            })

                            showBorders.addEventListener('change', function () {
                                controlsTool.WebRTCLib.getOptions().liveStreaming.showLayoutBorders = showBorders.checked;
                            })

                            marginsInput.addEventListener('change', function () {
                                controlsTool.WebRTCLib.getOptions().liveStreaming.tiledLayoutMargins = marginsInput.value;
                            })

                            /*audioOnly.addEventListener('change', function () {
                                    controlsTool.WebRTCLib.getOptions().liveStreaming.audioOnlyLayout = audioOnly.checked;
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.updateWebRTCCanvasLayout();
                                })*/

                            audioBg.addEventListener('change', function () {
                                controlsTool.WebRTCLib.getOptions().liveStreaming.audioLayoutBgColor = audioBg.value;
                            })

                            removeBg.addEventListener('click', function () {
                                controlsTool.WebRTCLib.getOptions().liveStreaming.audioLayoutBgColor = 'rgba(0, 0, 0, 0)';
                            })

                            function updateWebrtcRect (e) {
                                let layoutWidth = width.value;
                                let layoutHeight = height.value;
                                let x = leftPos.value;
                                let y = topPos.value;
                                controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.setWebrtcLayoutRect(layoutWidth, layoutHeight, x, y);
                            }
                            marginsInput.addEventListener('blur', updateWebrtcRect)
                            width.addEventListener('blur', updateWebrtcRect)
                            height.addEventListener('blur', updateWebrtcRect)
                            topPos.addEventListener('blur', updateWebrtcRect)
                            leftPos.addEventListener('blur', updateWebrtcRect)

                            return dialogBodyInner;
                        }

                        function showLayoutList() {
                            _dialogueBody.innerHTML = '';
                            _dialogueBody.appendChild(createLayoutList());
                        }

                        function showLayoutParams() {
                            _dialogueBody.innerHTML = '';
                            _dialogueBody.appendChild(createParamsList());
                        }

                        function showDialog() {
                            console.log('showDialog', this, _activeView)
                            hideActiveView();
                            _optionsEl.appendChild(_dialogueEl);
                            _activeView = this;
                        }

                        function hideDialog() {
                            console.log('hideDialog', _dialogueEl)

                            if(_dialogueEl && _dialogueEl.parentNode != null) {
                                _dialogueEl.parentNode.removeChild(_dialogueEl);
                            }
                        }

                        function tabHandler(e) {
                            var tabEl = e.currentTarget;
                            console.log('tabHandler tabEl', tabEl)

                            var tabName = tabEl.dataset.tab;
                            if(!tabName) return;
                            if(tabName == 'layouts') {
                                showLayoutList();
                            } else if(tabName == 'params') {
                                showLayoutParams();
                            }

                            for(let e in _layoutTabs.children) {
                                if(typeof _layoutTabs.children[e] != 'object') continue;
                                console.log('tabHandler', _layoutTabs.children[e])
                                if(_layoutTabs.children[e] == tabEl) {
                                    if(!_layoutTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                        _layoutTabs.children[e].classList.add('Streams_webrtc_popup-options-title-tab-active');
                                    }
                                    continue;
                                }
                                if(_layoutTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                    _layoutTabs.children[e].classList.remove('Streams_webrtc_popup-options-title-tab-active');
                                }
                            }
                        }

                        console.log('addImagePopup')
                        _dialogueEl = document.createElement('DIV');
                        _dialogueEl.className = 'Streams_webrtc_popup-options-dialog';
                        var dialogTitle = document.createElement('DIV');
                        dialogTitle.className = 'Streams_webrtc_popup-options-title';
                        var dialogTitleInner = _layoutTabs = document.createElement('DIV');
                        dialogTitleInner.className = 'Streams_webrtc_popup-options-title-inner';

                        var layoutsTab = document.createElement('DIV');
                        layoutsTab.className = 'Streams_webrtc_popup-options-title-tab Streams_webrtc_popup-options-title-tab-active';
                        layoutsTab.dataset.tab = 'layouts';
                        var layoutsTabInner = document.createElement('DIV');
                        layoutsTabInner.className = 'Streams_webrtc_popup-options-title-tab-inner';
                        layoutsTabInner.innerHTML = 'Layouts';
                        layoutsTab.appendChild(layoutsTabInner);
                        dialogTitleInner.appendChild(layoutsTab);
                        var paramsTab = document.createElement('DIV');
                        paramsTab.className = 'Streams_webrtc_popup-options-title-tab';
                        paramsTab.dataset.tab = 'params';
                        var paramsTabInner = document.createElement('DIV');
                        paramsTabInner.className = 'Streams_webrtc_popup-options-title-tab-inner';
                        paramsTabInner.innerHTML = 'Params';
                        paramsTab.appendChild(paramsTabInner);
                        dialogTitleInner.appendChild(paramsTab);
                        dialogTitle.appendChild(dialogTitleInner);
                        _dialogueEl.appendChild(dialogTitle);
                        var dialogBody = _dialogueBody = document.createElement('DIV');
                        dialogBody.className = 'Streams_webrtc_popup-options-body';

                        dialogBody.appendChild(createLayoutList());
                        _dialogueEl.appendChild(dialogBody);

                        layoutsTab.addEventListener('click', tabHandler);
                        paramsTab.addEventListener('click', tabHandler);

                        return {
                            hide: hideDialog,
                            show: showDialog,
                            showLayoutList: showLayoutList,
                            showLayoutParams: showLayoutParams,
                        }
                    }())

                    var webrtcParticipantOptions = (function (source) {
                        var _dialogueEl = null;
                        var _optionsTabs = null;
                        var _dialogueBody = null;
                        var _layoutParamsEl = null;
                        var _selectedSource = null;
                        var _generatedDialogs = [];

                        function createParamsList() {

                            console.log('createParamsList', _selectedSource.sourceInstance)
                            for(let d in _generatedDialogs) {
                                if(_generatedDialogs[d].source == _selectedSource) {
                                    return _generatedDialogs[d].dialogue;
                                }
                            }

                            var dialogBodyInner = document.createElement('DIV');
                            dialogBodyInner.className = 'Streams_webrtc_popup-options-body-inner Streams_webrtc_popup-options-params-body';

                            //size
                            var descriptionCon = document.createElement('DIV');
                            descriptionCon.className = 'Streams_webrtc_popup-options-params-webrtc-desc';

                            var descriptionInner = document.createElement('DIV');
                            descriptionInner.className = 'Streams_webrtc_popup-options-params-webrtc-desc-inner';
                            descriptionCon.appendChild(descriptionInner);

                            var showNameCon = document.createElement('DIV');
                            var showName = document.createElement('INPUT');
                            showName.type = 'checkbox';
                            showName.id = 'showNames';
                            showName.name = 'showNames';
                            showName.checked = false;
                            var showNameLabel = document.createElement('Label');
                            showNameLabel.appendChild(showName);
                            showNameLabel.appendChild(document.createTextNode("Show participants' name"));
                            showNameCon.appendChild(showNameLabel);

                            var showBorderCon = document.createElement('DIV');
                            var showBorder = document.createElement('INPUT');
                            showBorder.type = 'checkbox';
                            showBorder.id = 'showBorder';
                            showBorder.name = 'showBorder';
                            showBorder.checked = false;
                            var ShowBorderLabel = document.createElement('Label');
                            ShowBorderLabel.appendChild(showBorder);
                            ShowBorderLabel.appendChild(document.createTextNode("Show borders"));
                            showBorderCon.appendChild(ShowBorderLabel);

                            var descNameCon = document.createElement('DIV');
                            descNameCon.className = 'Streams_webrtc_popup-options-params-webrtc-desc-name';
                            descriptionInner.appendChild(descNameCon);
                            var nameText = document.createElement('SPAN');
                            nameText.innerHTML = 'Name: ';
                            descNameCon.appendChild(nameText);
                            var nameInput = document.createElement('INPUT');
                            nameInput.type = 'text';
                            nameInput.value = _selectedSource.sourceInstance.participant.username;
                            descNameCon.appendChild(nameInput);

                            var descCaptionCon = document.createElement('DIV');
                            descCaptionCon.className = 'Streams_webrtc_popup-options-params-webrtc-desc-caption';
                            descriptionInner.appendChild(descCaptionCon);
                            var captionText = document.createElement('SPAN');
                            captionText.innerHTML = 'Caption: ';
                            descCaptionCon.appendChild(captionText);
                            var captionInput = document.createElement('INPUT');
                            captionInput.type = 'text';
                            captionInput.value = _selectedSource.sourceInstance.caption;
                            descCaptionCon.appendChild(captionInput);

                            var bgColorCon = document.createElement('DIV');
                            bgColorCon.className = 'Streams_webrtc_popup-options-params-captionbg'
                            var bgColorInput = document.createElement('INPUT');
                            bgColorInput.type = 'color';
                            bgColorInput.id = 'captionBgColor';
                            bgColorInput.name = 'captionBgColor';
                            bgColorInput.value = _selectedSource.sourceInstance.params.captionBgColor;
                            var removeBg = document.createElement('DIV');
                            removeBg.className = 'Streams_webrtc_popup-options-params-captionbg-rem'
                            removeBg.innerHTML = '&#10060;'
                            bgColorCon.appendChild(document.createTextNode("Caption background color: "));
                            bgColorCon.appendChild(bgColorInput);
                            bgColorCon.appendChild(removeBg);

                            var fontColorCon = document.createElement('DIV');
                            fontColorCon.className = 'Streams_webrtc_popup-options-params-font-color'
                            var fontColorInput = document.createElement('INPUT');
                            fontColorInput.type = 'color';
                            fontColorInput.id = 'captionFontColor';
                            fontColorInput.name = 'captionFontColor';
                            fontColorInput.value = _selectedSource.sourceInstance.params.captionFontColor;
                            var removeColor = document.createElement('DIV');
                            removeColor.className = 'Streams_webrtc_popup-options-params-font-color-rem'
                            removeColor.innerHTML = '&#10060;'
                            fontColorCon.appendChild(document.createTextNode("Caption font color: "));
                            fontColorCon.appendChild(fontColorInput);
                            fontColorCon.appendChild(removeColor);

                            dialogBodyInner.appendChild(showNameCon);
                            dialogBodyInner.appendChild(showBorderCon);
                            dialogBodyInner.appendChild(descriptionCon);
                            dialogBodyInner.appendChild(bgColorCon);
                            dialogBodyInner.appendChild(fontColorCon);

                            _layoutParamsEl = dialogBodyInner;


                            showName.addEventListener('change', function () {
                                if( showName.checked) {
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.displayName(_selectedSource.sourceInstance.participant);
                                } else {
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.hideName(_selectedSource.sourceInstance.participant);

                                }
                            })
                            showBorder.addEventListener('change', function () {
                                if( showBorder.checked) {
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.displayBorder(_selectedSource.sourceInstance.participant);
                                } else {
                                    controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.hideBorder(_selectedSource.sourceInstance.participant);

                                }
                            })
                            nameInput.addEventListener('blur', function () {
                                _selectedSource.sourceInstance.participant.username = nameInput.value;
                            })
                            captionInput.addEventListener('blur', function () {
                                _selectedSource.sourceInstance.caption = captionInput.value;

                            })
                            bgColorInput.addEventListener('change', function () {
                                _selectedSource.sourceInstance.params.captionBgColor = bgColorInput.value;
                            })
                            removeBg.addEventListener('click', function () {
                                _selectedSource.sourceInstance.params.captionBgColor = bgColorInput.value = 'rgba(0, 0, 0, 0)';
                            })
                            fontColorInput.addEventListener('change', function () {
                                _selectedSource.sourceInstance.params.captionFontColor = fontColorInput.value;
                            })

                            removeColor.addEventListener('click', function () {
                                _selectedSource.sourceInstance.params.captionFontColor = fontColorInput.value = 'rgba(0, 0, 0, 0)';
                            })

                            /*_selectedSource.sourceInstance.on('rectChanged', function () {
                        width.value = _selectedSource.sourceInstance.rect._width;
                        height.value = _selectedSource.sourceInstance.rect._height;
                        leftPos.value = _selectedSource.sourceInstance.rect._x;
                        topPos.value = _selectedSource.sourceInstance.rect._y;
                    });*/

                            _generatedDialogs.push({
                                source: _selectedSource,
                                dialogue:  dialogBodyInner
                            })
                            return dialogBodyInner;
                        }

                        function showParams() {
                            _dialogueBody.innerHTML = '';
                            _dialogueBody.appendChild(createParamsList());
                        }

                        function showDialog(source) {
                            _selectedSource = source;
                            console.log('showDialog', this, _activeView)
                            hideActiveView();
                            showParams();
                            _optionsEl.appendChild(_dialogueEl);
                            _activeView = this;
                        }

                        function hideDialog() {
                            console.log('hideDialog', _dialogueEl)

                            if(_dialogueEl && _dialogueEl.parentNode != null) {
                                _dialogueEl.parentNode.removeChild(_dialogueEl);
                            }
                        }

                        function tabHandler(e) {
                            var tabEl = e.currentTarget;
                            console.log('tabHandler tabEl', tabEl)

                            var tabName = tabEl.dataset.tab;
                            if(!tabName) return;
                            if(tabName == 'params') {
                                showParams();
                            }

                            for(let e in _optionsTabs.children) {
                                if(typeof _optionsTabs.children[e] != 'object') continue;
                                console.log('tabHandler', _optionsTabs.children[e])
                                if(_optionsTabs.children[e] == tabEl) {
                                    if(!_optionsTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                        _optionsTabs.children[e].classList.add('Streams_webrtc_popup-options-title-tab-active');
                                    }
                                    continue;
                                }
                                if(_optionsTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                    _optionsTabs.children[e].classList.remove('Streams_webrtc_popup-options-title-tab-active');
                                }
                            }
                        }

                        console.log('addImagePopup')
                        _dialogueEl = document.createElement('DIV');
                        _dialogueEl.className = 'Streams_webrtc_popup-options-dialog';
                        var dialogTitle = document.createElement('DIV');
                        dialogTitle.className = 'Streams_webrtc_popup-options-title';
                        var dialogTitleInner = _optionsTabs = document.createElement('DIV');
                        dialogTitleInner.className = 'Streams_webrtc_popup-options-title-inner';

                        var paramsTab = document.createElement('DIV');
                        paramsTab.className = 'Streams_webrtc_popup-options-title-tab Streams_webrtc_popup-options-title-tab-active';
                        paramsTab.dataset.tab = 'params';
                        var paramsTabInner = document.createElement('DIV');
                        paramsTabInner.className = 'Streams_webrtc_popup-options-title-tab-inner';
                        paramsTabInner.innerHTML = 'Params';
                        paramsTab.appendChild(paramsTabInner);
                        dialogTitleInner.appendChild(paramsTab);
                        dialogTitle.appendChild(dialogTitleInner);
                        _dialogueEl.appendChild(dialogTitle);
                        var dialogBody = _dialogueBody = document.createElement('DIV');
                        dialogBody.className = 'Streams_webrtc_popup-options-body';

                        //dialogBody.appendChild(createParamsList());
                        _dialogueEl.appendChild(dialogBody);

                        paramsTab.addEventListener('click', tabHandler);

                        return {
                            hide: hideDialog,
                            show: showDialog,
                            showParams: showParams
                        }
                    }())

                    var imageSourceOptions = (function (source) {
                        var _dialogueEl = null;
                        var _optionsTabs = null;
                        var _dialogueBody = null;
                        var _layoutParamsEl = null;
                        var _selectedSource = null;
                        var _generatedDialogs = [];

                        function createParamsList() {

                            for(let d in _generatedDialogs) {
                                if(_generatedDialogs[d].source == _selectedSource) {
                                    return _generatedDialogs[d].dialogue;
                                }
                            }

                            var dialogBodyInner = document.createElement('DIV');
                            dialogBodyInner.className = 'Streams_webrtc_popup-options-body-inner Streams_webrtc_popup-options-params-body';

                            var keepRatioCon = document.createElement('DIV');
                            var keepRatio = document.createElement('INPUT');
                            keepRatio.type = 'checkbox';
                            keepRatio.id = 'Streams_webrtc_popup-options-keep-ratio';
                            keepRatio.name = 'keepRatio';
                            keepRatio.checked = true;
                            var keepRatioLabel = document.createElement('Label');
                            keepRatioLabel.appendChild(keepRatio);
                            keepRatioLabel.appendChild(document.createTextNode("Keep ratio"));
                            keepRatioCon.appendChild(keepRatioLabel);

                            //size
                            var sizeAndPositionCon = document.createElement('DIV');
                            sizeAndPositionCon.className = 'Streams_webrtc_popup-options-params-size-pos';

                            var sizeCon = document.createElement('DIV');
                            sizeCon.className = 'Streams_webrtc_popup-options-params-size';
                            sizeAndPositionCon.appendChild(sizeCon);

                            var sizeWidthCon = document.createElement('DIV');
                            sizeWidthCon.className = 'Streams_webrtc_popup-options-params-size-width';
                            sizeCon.appendChild(sizeWidthCon);
                            var widthText = document.createElement('SPAN');
                            widthText.innerHTML = 'Width: ';
                            sizeWidthCon.appendChild(widthText);
                            var width = document.createElement('INPUT');
                            width.type = 'text';
                            width.value = _selectedSource.sourceInstance.rect._width;
                            sizeWidthCon.appendChild(width);

                            var sizeHeightCon = document.createElement('DIV');
                            sizeHeightCon.className = 'Streams_webrtc_popup-options-params-size-height';
                            sizeCon.appendChild(sizeHeightCon);
                            var heightText = document.createElement('SPAN');
                            heightText.innerHTML = 'Height: ';
                            sizeHeightCon.appendChild(heightText);
                            var height = document.createElement('INPUT');
                            height.type = 'text';
                            height.value = _selectedSource.sourceInstance.rect._height;
                            sizeHeightCon.appendChild(height);


                            //position
                            var positionCon = document.createElement('DIV');
                            positionCon.className = 'Streams_webrtc_popup-options-params-position';
                            sizeAndPositionCon.appendChild(positionCon);

                            var topPositionCon = document.createElement('DIV');
                            topPositionCon.className = 'Streams_webrtc_popup-options-params-position-top';
                            positionCon.appendChild(topPositionCon);
                            var topText = document.createElement('SPAN');
                            topText.innerHTML = 'Top: ';
                            topPositionCon.appendChild(topText);
                            var topPos = document.createElement('INPUT');
                            topPos.type = 'text';
                            topPos.value = _selectedSource.sourceInstance.rect._y;
                            topPositionCon.appendChild(topPos);

                            var leftPositionCon = document.createElement('DIV');
                            leftPositionCon.className = 'Streams_webrtc_popup-options-params-position-left';
                            positionCon.appendChild(leftPositionCon);
                            var leftText = document.createElement('SPAN');
                            leftText.innerHTML = 'Left: ';
                            leftPositionCon.appendChild(leftText);
                            var leftPos = document.createElement('INPUT');
                            leftPos.type = 'text';
                            leftPos.value = _selectedSource.sourceInstance.rect._x;
                            leftPositionCon.appendChild(leftPos);


                            dialogBodyInner.appendChild(keepRatioCon);
                            dialogBodyInner.appendChild(sizeAndPositionCon);

                            _layoutParamsEl = dialogBodyInner;

                            function updateSourceRect () {
                                var canvasSize = controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.getCanvasSize();
                                var keepAspectRatio = keepRatio.checked;
                                var currentWidth = _selectedSource.sourceInstance.rect._width;
                                var currentHeight = _selectedSource.sourceInstance.rect._height;
                                var w = parseFloat(width.value);
                                var h = parseFloat(height.value);
                                var x = parseFloat(leftPos.value);
                                var y = parseFloat(topPos.value);

                                var ratio = currentWidth / currentHeight;

                                console.log('updateSourceRect width', w, currentWidth)
                                console.log('updateSourceRect height', h, currentHeight)
                                console.log('updateSourceRect ratio', ratio)

                                var resWidth, resHeight;
                                if(keepAspectRatio) {
                                    if (w != currentWidth) {
                                        resWidth = w;
                                        resHeight = parseInt(resWidth / ratio);
                                        height.value = resHeight;
                                        console.log('updateSourceRect 1 resHeight', resHeight)
                                    } else if (h != currentHeight) {

                                        resHeight = h;
                                        resWidth = parseInt(resHeight * ratio);
                                        width.value = resWidth;
                                        console.log('updateSourceRect 2 resWidth', resWidth)

                                    } else {
                                        console.log('updateSourceRect 3')
                                        resWidth = currentWidth;
                                        resHeight = currentHeight;
                                    }
                                } else {
                                    if (w != currentWidth) {
                                        resWidth = w;
                                        resHeight = h;
                                    } else if (h != currentHeight) {
                                        resHeight = h;
                                        resWidth = w;
                                    } else {
                                        resWidth = currentWidth;
                                        resHeight = currentHeight;
                                    }
                                }

                                _selectedSource.sourceInstance.updateRect(resWidth, resHeight, x, y)
                            }
                            width.addEventListener('blur', updateSourceRect)
                            height.addEventListener('blur', updateSourceRect)
                            topPos.addEventListener('blur', updateSourceRect)
                            leftPos.addEventListener('blur', updateSourceRect)
                            _selectedSource.sourceInstance.on('rectChanged', function () {
                                width.value = _selectedSource.sourceInstance.rect._width;
                                height.value = _selectedSource.sourceInstance.rect._height;
                                leftPos.value = _selectedSource.sourceInstance.rect._x;
                                topPos.value = _selectedSource.sourceInstance.rect._y;
                            });

                            _generatedDialogs.push({
                                source: _selectedSource,
                                dialogue:  dialogBodyInner
                            })
                            return dialogBodyInner;
                        }

                        function showParams() {
                            _dialogueBody.innerHTML = '';
                            _dialogueBody.appendChild(createParamsList());
                        }

                        function showDialog(source) {
                            _selectedSource = source;
                            console.log('showDialog', this, _activeView)
                            hideActiveView();
                            showParams();
                            _optionsEl.appendChild(_dialogueEl);
                            _activeView = this;
                        }

                        function hideDialog() {
                            console.log('hideDialog', _dialogueEl)

                            if(_dialogueEl && _dialogueEl.parentNode != null) {
                                _dialogueEl.parentNode.removeChild(_dialogueEl);
                            }
                        }

                        function tabHandler(e) {
                            var tabEl = e.currentTarget;
                            console.log('tabHandler tabEl', tabEl)

                            var tabName = tabEl.dataset.tab;
                            if(!tabName) return;
                            if(tabName == 'params') {
                                showParams();
                            }

                            for(let e in _optionsTabs.children) {
                                if(typeof _optionsTabs.children[e] != 'object') continue;
                                console.log('tabHandler', _optionsTabs.children[e])
                                if(_optionsTabs.children[e] == tabEl) {
                                    if(!_optionsTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                        _optionsTabs.children[e].classList.add('Streams_webrtc_popup-options-title-tab-active');
                                    }
                                    continue;
                                }
                                if(_optionsTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                    _optionsTabs.children[e].classList.remove('Streams_webrtc_popup-options-title-tab-active');
                                }
                            }
                        }

                        console.log('addImagePopup')
                        _dialogueEl = document.createElement('DIV');
                        _dialogueEl.className = 'Streams_webrtc_popup-options-dialog';
                        var dialogTitle = document.createElement('DIV');
                        dialogTitle.className = 'Streams_webrtc_popup-options-title';
                        var dialogTitleInner = _optionsTabs = document.createElement('DIV');
                        dialogTitleInner.className = 'Streams_webrtc_popup-options-title-inner';

                        var paramsTab = document.createElement('DIV');
                        paramsTab.className = 'Streams_webrtc_popup-options-title-tab Streams_webrtc_popup-options-title-tab-active';
                        paramsTab.dataset.tab = 'params';
                        var paramsTabInner = document.createElement('DIV');
                        paramsTabInner.className = 'Streams_webrtc_popup-options-title-tab-inner';
                        paramsTabInner.innerHTML = 'Params';
                        paramsTab.appendChild(paramsTabInner);
                        dialogTitleInner.appendChild(paramsTab);
                        dialogTitle.appendChild(dialogTitleInner);
                        _dialogueEl.appendChild(dialogTitle);
                        var dialogBody = _dialogueBody = document.createElement('DIV');
                        dialogBody.className = 'Streams_webrtc_popup-options-body';

                        //dialogBody.appendChild(createParamsList());
                        _dialogueEl.appendChild(dialogBody);

                        paramsTab.addEventListener('click', tabHandler);

                        return {
                            hide: hideDialog,
                            show: showDialog,
                            showParams: showParams
                        }
                    }())


                    var videoSourceOptions = (function (source) {
                        var _dialogueEl = null;
                        var _optionsTabs = null;
                        var _dialogueBody = null;
                        var _layoutParamsEl = null;
                        var _selectedSource = null;
                        var _generatedDialogs = [];

                        function createParamsList() {

                            for(let d in _generatedDialogs) {
                                if(_generatedDialogs[d].source == _selectedSource) {
                                    return _generatedDialogs[d].dialogue;
                                }
                            }

                            var dialogBodyInner = document.createElement('DIV');
                            dialogBodyInner.className = 'Streams_webrtc_popup-options-body-inner Streams_webrtc_popup-options-params-body';

                            var mediaControlsEl = createMediaControls(_selectedSource);

                            var keepRatioCon = document.createElement('DIV');
                            var keepRatio = document.createElement('INPUT');
                            keepRatio.type = 'checkbox';
                            keepRatio.id = 'Streams_webrtc_popup-options-keep-ratio';
                            keepRatio.name = 'keepRatio';
                            keepRatio.checked = true;
                            var keepRatioLabel = document.createElement('Label');
                            keepRatioLabel.appendChild(keepRatio);
                            keepRatioLabel.appendChild(document.createTextNode("Keep ratio"));
                            keepRatioCon.appendChild(keepRatioLabel);

                            //size
                            var sizeAndPositionCon = document.createElement('DIV');
                            sizeAndPositionCon.className = 'Streams_webrtc_popup-options-params-size-pos';

                            var sizeCon = document.createElement('DIV');
                            sizeCon.className = 'Streams_webrtc_popup-options-params-size';
                            sizeAndPositionCon.appendChild(sizeCon);

                            var sizeWidthCon = document.createElement('DIV');
                            sizeWidthCon.className = 'Streams_webrtc_popup-options-params-size-width';
                            sizeCon.appendChild(sizeWidthCon);
                            var widthText = document.createElement('SPAN');
                            widthText.innerHTML = 'Width: ';
                            sizeWidthCon.appendChild(widthText);
                            var width = document.createElement('INPUT');
                            width.type = 'text';
                            width.value = _selectedSource.sourceInstance.rect._width;
                            sizeWidthCon.appendChild(width);

                            var sizeHeightCon = document.createElement('DIV');
                            sizeHeightCon.className = 'Streams_webrtc_popup-options-params-size-height';
                            sizeCon.appendChild(sizeHeightCon);
                            var heightText = document.createElement('SPAN');
                            heightText.innerHTML = 'Height: ';
                            sizeHeightCon.appendChild(heightText);
                            var height = document.createElement('INPUT');
                            height.type = 'text';
                            height.value = _selectedSource.sourceInstance.rect._height;
                            sizeHeightCon.appendChild(height);


                            //position
                            var positionCon = document.createElement('DIV');
                            positionCon.className = 'Streams_webrtc_popup-options-params-position';
                            sizeAndPositionCon.appendChild(positionCon);

                            var topPositionCon = document.createElement('DIV');
                            topPositionCon.className = 'Streams_webrtc_popup-options-params-position-top';
                            positionCon.appendChild(topPositionCon);
                            var topText = document.createElement('SPAN');
                            topText.innerHTML = 'Top: ';
                            topPositionCon.appendChild(topText);
                            var topPos = document.createElement('INPUT');
                            topPos.type = 'text';
                            topPos.value = _selectedSource.sourceInstance.rect._y;
                            topPositionCon.appendChild(topPos);

                            var leftPositionCon = document.createElement('DIV');
                            leftPositionCon.className = 'Streams_webrtc_popup-options-params-position-left';
                            positionCon.appendChild(leftPositionCon);
                            var leftText = document.createElement('SPAN');
                            leftText.innerHTML = 'Left: ';
                            leftPositionCon.appendChild(leftText);
                            var leftPos = document.createElement('INPUT');
                            leftPos.type = 'text';
                            leftPos.value = _selectedSource.sourceInstance.rect._x;
                            leftPositionCon.appendChild(leftPos);


                            dialogBodyInner.appendChild(mediaControlsEl);
                            dialogBodyInner.appendChild(keepRatioCon);
                            dialogBodyInner.appendChild(sizeAndPositionCon);

                            _layoutParamsEl = dialogBodyInner;

                            function updateSourceRect () {
                                var canvasSize = controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.getCanvasSize();
                                var keepAspectRatio = keepRatio.checked;
                                var currentWidth = _selectedSource.sourceInstance.rect._width;
                                var currentHeight = _selectedSource.sourceInstance.rect._height;
                                var w = parseFloat(width.value);
                                var h = parseFloat(height.value);
                                var x = parseFloat(leftPos.value);
                                var y = parseFloat(topPos.value);

                                var ratio = currentWidth / currentHeight;

                                console.log('updateSourceRect width', w, currentWidth)
                                console.log('updateSourceRect height', h, currentHeight)
                                console.log('updateSourceRect ratio', ratio)

                                var resWidth, resHeight;
                                if(keepAspectRatio) {
                                    if (w != currentWidth) {
                                        resWidth = w;
                                        resHeight = parseInt(resWidth / ratio);
                                        height.value = resHeight;
                                        console.log('updateSourceRect 1 resHeight', resHeight)
                                    } else if (h != currentHeight) {

                                        resHeight = h;
                                        resWidth = parseInt(resHeight * ratio);
                                        width.value = resWidth;
                                        console.log('updateSourceRect 2 resWidth', resWidth)

                                    } else {
                                        console.log('updateSourceRect 3')
                                        resWidth = currentWidth;
                                        resHeight = currentHeight;
                                    }
                                } else {
                                    if (w != currentWidth) {
                                        resWidth = w;
                                        resHeight = h;
                                    } else if (h != currentHeight) {
                                        resHeight = h;
                                        resWidth = w;
                                    } else {
                                        resWidth = currentWidth;
                                        resHeight = currentHeight;
                                    }
                                }

                                _selectedSource.sourceInstance.updateRect(resWidth, resHeight, x, y)
                            }
                            width.addEventListener('blur', updateSourceRect)
                            height.addEventListener('blur', updateSourceRect)
                            topPos.addEventListener('blur', updateSourceRect)
                            leftPos.addEventListener('blur', updateSourceRect)
                            _selectedSource.sourceInstance.on('rectChanged', function () {
                                width.value = _selectedSource.sourceInstance.rect._width;
                                height.value = _selectedSource.sourceInstance.rect._height;
                                leftPos.value = _selectedSource.sourceInstance.rect._x;
                                topPos.value = _selectedSource.sourceInstance.rect._y;
                            });

                            _generatedDialogs.push({
                                source: _selectedSource,
                                dialogue:  dialogBodyInner
                            })
                            return dialogBodyInner;
                        }

                        function showParams() {
                            _dialogueBody.innerHTML = '';
                            _dialogueBody.appendChild(createParamsList());
                        }

                        function showDialog(source) {
                            _selectedSource = source;
                            console.log('showDialog', this, _activeView)
                            hideActiveView();
                            showParams();
                            _optionsEl.appendChild(_dialogueEl);
                            _activeView = this;
                        }

                        function hideDialog() {
                            console.log('hideDialog', _dialogueEl)

                            if(_dialogueEl && _dialogueEl.parentNode != null) {
                                _dialogueEl.parentNode.removeChild(_dialogueEl);
                            }
                        }

                        function tabHandler(e) {
                            var tabEl = e.currentTarget;
                            console.log('tabHandler tabEl', tabEl)

                            var tabName = tabEl.dataset.tab;
                            if(!tabName) return;
                            if(tabName == 'params') {
                                showParams();
                            }

                            for(let e in _optionsTabs.children) {
                                if(typeof _optionsTabs.children[e] != 'object') continue;
                                console.log('tabHandler', _optionsTabs.children[e])
                                if(_optionsTabs.children[e] == tabEl) {
                                    if(!_optionsTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                        _optionsTabs.children[e].classList.add('Streams_webrtc_popup-options-title-tab-active');
                                    }
                                    continue;
                                }
                                if(_optionsTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                    _optionsTabs.children[e].classList.remove('Streams_webrtc_popup-options-title-tab-active');
                                }
                            }
                        }

                        console.log('addImagePopup')
                        _dialogueEl = document.createElement('DIV');
                        _dialogueEl.className = 'Streams_webrtc_popup-options-dialog';
                        var dialogTitle = document.createElement('DIV');
                        dialogTitle.className = 'Streams_webrtc_popup-options-title';
                        var dialogTitleInner = _optionsTabs = document.createElement('DIV');
                        dialogTitleInner.className = 'Streams_webrtc_popup-options-title-inner';

                        var paramsTab = document.createElement('DIV');
                        paramsTab.className = 'Streams_webrtc_popup-options-title-tab Streams_webrtc_popup-options-title-tab-active';
                        paramsTab.dataset.tab = 'params';
                        var paramsTabInner = document.createElement('DIV');
                        paramsTabInner.className = 'Streams_webrtc_popup-options-title-tab-inner';
                        paramsTabInner.innerHTML = 'Params';
                        paramsTab.appendChild(paramsTabInner);
                        dialogTitleInner.appendChild(paramsTab);
                        dialogTitle.appendChild(dialogTitleInner);
                        _dialogueEl.appendChild(dialogTitle);
                        var dialogBody = _dialogueBody = document.createElement('DIV');
                        dialogBody.className = 'Streams_webrtc_popup-options-body';

                        //dialogBody.appendChild(createParamsList());
                        _dialogueEl.appendChild(dialogBody);

                        paramsTab.addEventListener('click', tabHandler);

                        return {
                            hide: hideDialog,
                            show: showDialog,
                            showParams: showParams
                        }
                    }())


                    var audioSourceOptions = (function (source) {
                        var _dialogueEl = null;
                        var _optionsTabs = null;
                        var _dialogueBody = null;
                        var _layoutParamsEl = null;
                        var _selectedSource = null;
                        var _generatedDialogs = [];

                        function createParamsList() {
                            console.log('createParamsList',  _selectedSource.params);
                            for(let d in _generatedDialogs) {
                                if(_generatedDialogs[d].source == _selectedSource) {
                                    return _generatedDialogs[d].dialogue;
                                }
                            }

                            var paramsBody = document.createElement('DIV')
                            paramsBody.className = 'Streams_webrtc_popup-options-body-inner Streams_webrtc_popup-options-params-body';

                            var mediaControlsEl = createMediaControls(_selectedSource);
                            paramsBody.appendChild(mediaControlsEl);

                            _generatedDialogs.push({
                                source: _selectedSource,
                                dialogue:  paramsBody,
                            })
                            return paramsBody;
                        }

                        function showParams() {
                            console.log('showParams', this, _activeView)

                            _dialogueBody.innerHTML = '';
                            _dialogueBody.appendChild(createParamsList());
                        }

                        function showDialog(source) {
                            _selectedSource = source;
                            console.log('showDialog', this, _activeView)
                            hideActiveView();
                            showParams();
                            _optionsEl.appendChild(_dialogueEl);
                            _activeView = this;
                        }

                        function hideDialog() {
                            console.log('hideDialog', _dialogueEl)

                            if(_dialogueEl && _dialogueEl.parentNode != null) {
                                _dialogueEl.parentNode.removeChild(_dialogueEl);
                            }
                        }

                        function tabHandler(e) {
                            var tabEl = e.currentTarget;
                            console.log('tabHandler tabEl', tabEl)

                            var tabName = tabEl.dataset.tab;
                            if(!tabName) return;
                            if(tabName == 'params') {
                                showParams();
                            }

                            for(let e in _optionsTabs.children) {
                                if(typeof _optionsTabs.children[e] != 'object') continue;
                                console.log('tabHandler', _optionsTabs.children[e])
                                if(_optionsTabs.children[e] == tabEl) {
                                    if(!_optionsTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                        _optionsTabs.children[e].classList.add('Streams_webrtc_popup-options-title-tab-active');
                                    }
                                    continue;
                                }
                                if(_optionsTabs.children[e].classList.contains('Streams_webrtc_popup-options-title-tab-active')) {
                                    _optionsTabs.children[e].classList.remove('Streams_webrtc_popup-options-title-tab-active');
                                }
                            }
                        }

                        console.log('addImagePopup')
                        _dialogueEl = document.createElement('DIV');
                        _dialogueEl.className = 'Streams_webrtc_popup-options-dialog';
                        var dialogTitle = document.createElement('DIV');
                        dialogTitle.className = 'Streams_webrtc_popup-options-title';
                        var dialogTitleInner = _optionsTabs = document.createElement('DIV');
                        dialogTitleInner.className = 'Streams_webrtc_popup-options-title-inner';

                        var paramsTab = document.createElement('DIV');
                        paramsTab.className = 'Streams_webrtc_popup-options-title-tab Streams_webrtc_popup-options-title-tab-active';
                        paramsTab.dataset.tab = 'params';
                        var paramsTabInner = document.createElement('DIV');
                        paramsTabInner.className = 'Streams_webrtc_popup-options-title-tab-inner';
                        paramsTabInner.innerHTML = 'Params';
                        paramsTab.appendChild(paramsTabInner);
                        dialogTitleInner.appendChild(paramsTab);
                        dialogTitle.appendChild(dialogTitleInner);
                        _dialogueEl.appendChild(dialogTitle);
                        var dialogBody = _dialogueBody = document.createElement('DIV');
                        dialogBody.className = 'Streams_webrtc_popup-options-body';

                        //dialogBody.appendChild(createParamsList());
                        _dialogueEl.appendChild(dialogBody);

                        paramsTab.addEventListener('click', tabHandler);

                        return {
                            hide: hideDialog,
                            show: showDialog,
                            showParams: showParams
                        }
                    }())

                    function update() {
                        var selectedSource = sourcesInterface.getSelectedSource();
                        if(selectedSource && selectedSource.listType != 'audio' && selectedSource.sourceInstance.sourceType == 'group' && selectedSource.sourceInstance.groupType == 'webrtc') {
                            optionsColumn.canvasLayoutOptions.show();
                        } else if(selectedSource && selectedSource.listType != 'audio' && selectedSource.sourceInstance.sourceType == 'webrtc') {
                            optionsColumn.webrtcParticipantOptions.show(selectedSource);
                        } else if(selectedSource && selectedSource.sourceInstance.sourceType == 'image') {
                            optionsColumn.imageSourceOptions.show(selectedSource);
                        } else if(selectedSource && selectedSource.sourceInstance.sourceType == 'video') {
                            optionsColumn.videoSourceOptions.show(selectedSource);
                        } else if(selectedSource && selectedSource.sourceInstance.sourceType == 'audio') {
                            optionsColumn.audioSourceOptions.show(selectedSource);
                        } else {
                            optionsColumn.hideActiveView();
                        }
                    }

                    return {
                        canvasLayoutOptions: canvasLayoutOptions,
                        webrtcParticipantOptions: webrtcParticipantOptions,
                        imageSourceOptions: imageSourceOptions,
                        videoSourceOptions: videoSourceOptions,
                        audioSourceOptions: audioSourceOptions,
                        hideActiveView: hideActiveView,
                        update: update
                    }
                }())

                function createPopup() {
                    console.log('createPopup 00', scenesInterface)
                    var dialogue=document.createElement('DIV');
                    dialogue.className = 'Streams_webrtc_dialog-box advanced-streaming Streams_webrtc_hidden';
                    _dialogueEl = dialogue;
                    var dialogTitle=document.createElement('H3');
                    dialogTitle.innerHTML = Q.getObject("webrtc.streamingSettings.title", controlsTool.textes);
                    dialogTitle.className = 'Streams_webrtc_dialog-header Q_dialog_title';

                    var dialogInner=document.createElement('DIV');
                    dialogInner.className = 'Streams_webrtc_dialog-inner';
                    var boxContent=document.createElement('DIV');
                    boxContent.className = 'Streams_webrtc_popup-streaming-box  Streams_webrtc_popup-box';

                    var previewBox = document.createElement('DIV');
                    previewBox.className = 'Streams_webrtc_popup-preview';
                    var previewBoxBody = document.createElement('DIV');
                    previewBoxBody.className = 'Streams_webrtc_popup-preview-body';
                    var previewBoxBodyInner = document.createElement('DIV');
                    previewBoxBodyInner.className = 'Streams_webrtc_popup-preview-body-inner';
                    var sourceResizingEl = _resizingElement = document.createElement('DIV');
                    sourceResizingEl.className = 'Streams_webrtc_popup-preview-resizing';

                    var previewButtons = document.createElement('DIV');
                    previewButtons.className = 'Streams_webrtc_popup-preview-buttons';
                    var startRecordingBtn = document.createElement('BUTTON');
                    startRecordingBtn.type = 'button';
                    startRecordingBtn.className = 'Q_button';
                    startRecordingBtn.innerHTML = Q.getObject("webrtc.settingsPopup.start", controlsTool.textes);

                    //previewButtons.appendChild(startRecordingBtn);
                    previewBoxBodyInner.appendChild(sourceResizingEl);
                    previewBoxBody.appendChild(previewButtons);
                    previewBoxBody.appendChild(previewBoxBodyInner);
                    previewBox.appendChild(previewBoxBody);
                    boxContent.appendChild(previewBox);


                    var streamingControls=document.createElement('DIV');
                    streamingControls.className = 'Streams_webrtc_popup-streaming-controls';

                    var scenesColumn = scenesInterface.createScenesCol();

                    var sourcesColumn = sourcesInterface.createSourcesCol();

                    var optionsColumn = document.createElement('DIV');
                    optionsColumn.className = 'Streams_webrtc_popup-options';
                    _optionsEl = optionsColumn;

                    streamingControls.appendChild(scenesColumn);
                    streamingControls.appendChild(sourcesColumn);
                    streamingControls.appendChild(optionsColumn);

                    var close=document.createElement('div');
                    close.className = 'Streams_webrtc_close-dialog-sign';
                    close.style.backgroundImage = 'url("' + Q.url("{{Q}}/img/close.png") + '"';
                    close.style.backgroundRepeat = 'no-repeat';
                    close.style.backgroundSize = 'cover';
                    close.style.animation = 'none';


                    boxContent.appendChild(streamingControls);
                    dialogInner.appendChild(dialogTitle);
                    dialogInner.appendChild(boxContent);

                    dialogue.appendChild(close);
                    dialogue.appendChild(dialogInner);

                    Q.activate(
                        Q.Tool.setUpElement(
                            _resizingElement,
                            "Q/resize",
                            {
                                move: true,
                                resize: true,
                                active: true,
                                //elementPosition: 'fixed',
                                moveWithinArea: 'parent',
                                negativeMoving: true,
                                onMoving: function () {

                                }
                            }
                        ),
                        {},
                        function () {
                            _resizingElementTool = this;
                        }
                    );

                    controlsTool.WebRTCClass.roomsMediaContainer().appendChild(dialogue);
                    Q.activate(
                        Q.Tool.setUpElement(
                            dialogue,
                            "Q/resize",
                            {
                                move: true,
                                elementPosition: 'fixed',
                                activateOnElement: dialogTitle,
                                keepInitialSize: true,
                                resize: false,
                                active: true,
                                moveWithinArea: 'window',
                            }
                        ),
                        {},
                        function () {

                        }
                    );

                    Q.activate(
                        Q.Tool.setUpElement(
                            _dialogueEl,
                            "Streams/fileManager",
                            {

                            }
                        ),
                        {},
                        function (toolEl) {
                            _fileManagerTool = Q.Tool.from(_dialogueEl, "Streams/fileManager");
                        }
                    )

                    var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                    var dialogWidth = 996;
                    dialogue.style.width = dialogWidth + 'px';
                    console.log('dialogWidth', dialogWidth);
                    if(Q.info.isMobile) {
                        //dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                        //dialogue.style.bottom = (controlsRect.height + 10) + 'px';
                    } else {
                        //dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                        //dialogue.style.top = '100px';
                    }


                    close.addEventListener('click', function () {
                        hide()
                    });

                    tool.advancedStreamingDialogue = boxContent;

                    return {
                        dialogueEl: dialogue,
                        previewBoxEl: previewBoxBodyInner
                    }
                }

                function createPopupHorizontalMobile() {
                    console.log('createPopupHorizontalMobile 00', scenesInterface)
                    var dialogue=document.createElement('DIV');
                    dialogue.className = 'Streams_webrtc_dialog-box advanced-streaming Streams_webrtc_hidden Q_orientHorizontally';
                    _dialogueEl = dialogue;
                    var dialogTitle=document.createElement('H3');
                    dialogTitle.innerHTML = 'Streaming settings';
                    dialogTitle.className = 'Streams_webrtc_dialog-header Q_dialog_title';

                    var dialogInner=document.createElement('DIV');
                    dialogInner.className = 'Streams_webrtc_dialog-inner';
                    var boxContent=document.createElement('DIV');
                    boxContent.className = 'Streams_webrtc_popup-streaming-box  Streams_webrtc_popup-box';

                    var previewBox = document.createElement('DIV');
                    previewBox.className = 'Streams_webrtc_popup-preview';
                    var previewBoxBody = document.createElement('DIV');
                    previewBoxBody.className = 'Streams_webrtc_popup-preview-body';
                    var previewBoxBodyInner = document.createElement('DIV');
                    previewBoxBodyInner.className = 'Streams_webrtc_popup-preview-body-inner';
                    var sourceResizingEl = _resizingElement = document.createElement('DIV');
                    sourceResizingEl.className = 'Streams_webrtc_popup-preview-resizing';


                    var previewButtons = document.createElement('DIV');
                    previewButtons.className = 'Streams_webrtc_popup-preview-buttons';
                    var startRecordingBtn = document.createElement('BUTTON');
                    startRecordingBtn.type = 'button';
                    startRecordingBtn.className = 'Q_button';
                    startRecordingBtn.innerHTML = Q.getObject("webrtc.settingsPopup.start", controlsTool.textes);

                    previewButtons.appendChild(startRecordingBtn);

                    previewBoxBodyInner.appendChild(sourceResizingEl);
                    previewBoxBody.appendChild(previewBoxBodyInner);
                    //previewBoxBody.appendChild(previewButtons);
                    previewBox.appendChild(previewBoxBody);
                    boxContent.appendChild(previewBox);


                    var streamingControls=document.createElement('DIV');
                    streamingControls.className = 'Streams_webrtc_popup-streaming-controls';

                    var scenesColumn = scenesInterface.createScenesCol();

                    var sourcesColumn = sourcesInterface.createSourcesCol();

                    var scrollerBtn = document.createElement('DIV')
                    scrollerBtn.className = 'Streams_webrtc_popup-streaming-controls-scroller';
                    sourcesColumn.appendChild(scrollerBtn);

                    var optionsColumn = document.createElement('DIV');
                    optionsColumn.className = 'Streams_webrtc_popup-options';
                    _optionsEl = optionsColumn;

                    //streamingControls.appendChild(scenesColumn);
                    streamingControls.appendChild(sourcesColumn);
                    streamingControls.appendChild(optionsColumn);

                    var close=document.createElement('div');
                    close.className = 'Streams_webrtc_close-dialog-sign';
                    close.innerHTML = '';
                    /* close.style.backgroundImage = 'url("' + Q.url("{{Q}}/img/close.png") + '"';
                        close.style.backgroundRepeat = 'no-repeat';
                        close.style.backgroundSize = 'cover';*/
                    close.style.animation = 'none';


                    boxContent.appendChild(streamingControls);
                    dialogInner.appendChild(dialogTitle);
                    dialogInner.appendChild(boxContent);

                    dialogue.appendChild(close);
                    dialogue.appendChild(dialogInner);


                    startRecordingBtn.addEventListener('click', function () {
                        if(!recordingCon.classList.contains('Q_working')) recordingCon.classList.add('Q_working');

                        controlsTool.WebRTCLib.mediaManager.localRecorder.startRecording(function (liveInfo) {
                            if(recordingCon.classList.contains('Q_working')) recordingCon.classList.remove('Q_working');
                            recordingTextLabel.innerHTML = Q.getObject("webrtc.settingsPopup.recordingInProgress", controlsTool.textes);
                            recordingSettings.style.display = 'none';
                            activeRecordingSection.style.display = 'block';
                        });
                    })
                    /*stopRecordingBtn.addEventListener('click', function () {
                            if(!recordingCon.classList.contains('Q_working')) recordingCon.classList.add('Q_working');

                            controlsTool.WebRTCLib.mediaManager.localRecorder.stopRecording(function () {
                                if(recordingCon.classList.contains('Q_working')) recordingCon.classList.remove('Q_working');
                                recordingTextLabel.innerHTML = Q.getObject("webrtc.settingsPopup.startRecording", controlsTool.textes);
                                activeRecordingSection.style.display = 'none';
                                recordingSettings.style.display = 'block';
                            });
                        })*/

                    scrollerBtn.addEventListener('click', function () {
                        let leftPos = optionsColumn.offsetLeft;
                        if(streamingControls.scrollLeft >= leftPos / 2) {
                            streamingControls.scrollLeft = 0;
                        } else {
                            streamingControls.scrollLeft = leftPos;
                        }
                    })

                    streamingControls.addEventListener('scroll', function () {
                        if(streamingControls.scrollLeft >= optionsColumn.offsetLeft / 2) {
                            if(!scrollerBtn.classList.contains('Streams_webrtc_popup-streaming-scroller-back')) {
                                scrollerBtn.classList.add('Streams_webrtc_popup-streaming-scroller-back')
                            }
                        } else {
                            scrollerBtn.classList.remove('Streams_webrtc_popup-streaming-scroller-back')
                        }
                    });

                    Q.activate(
                        Q.Tool.setUpElement(
                            _resizingElement,
                            "Q/resize",
                            {
                                move: true,
                                resize: true,
                                active: true,
                                //elementPosition: 'fixed',
                                moveWithinArea: 'parent',
                                negativeMoving: true,
                                onMoving: function () {

                                }
                            }
                        ),
                        {},
                        function () {
                            _resizingElementTool = this;
                        }
                    );

                    controlsTool.WebRTCClass.roomsMediaContainer().appendChild(dialogue);
                    setTimeout(function () {
                        Q.activate(
                            Q.Tool.setUpElement(
                                dialogue,
                                "Q/resize",
                                {
                                    move: true,
                                    elementPosition: 'fixed',
                                    activateOnElement: dialogTitle,
                                    resize: false,
                                    active: true,
                                    moveWithinArea: 'window',
                                }
                            ),
                            {},
                            function () {

                            }
                        );
                    }, 3000)

                    var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                    var dialogWidth = 996;
                    dialogue.style.width = dialogWidth + 'px';
                    console.log('dialogWidth', dialogWidth);
                    if(Q.info.isMobile) {
                        //dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                        //dialogue.style.bottom = (controlsRect.height + 10) + 'px';
                    } else {
                        dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                        dialogue.style.top = '100px';
                    }



                    close.addEventListener('click', function () {
                        hide()
                    });

                    tool.advancedStreamingDialogue = boxContent;

                    return {
                        dialogueEl: dialogue,
                        previewBoxEl: previewBoxBodyInner
                    }
                }

                scenesInterface.syncList();

                function hide() {
                    if(activeDialogue == null) return;
                    if(!activeDialogue.dialogueEl.classList.contains('Streams_webrtc_hidden')){
                        activeDialogue.dialogueEl.classList.add('Streams_webrtc_hidden');
                        isHidden = true;
                        var streamingCanvas = document.querySelector('.Streams_webrtc_video-stream-canvas');
                        if(streamingCanvas != null) {
                            streamingCanvas.style.position = 'absolute';
                            streamingCanvas.style.top = '-999999999px';
                            streamingCanvas.style.left = '0';
                            document.body.appendChild(streamingCanvas);
                        }

                        if(!controlsTool.WebRTCLib.mediaManager.fbLive.isStreaming()) {
                            controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.stop();
                        }
                    }
                    if(Q.info.isMobile) controlsTool.show();
                }

                function showHorizontalRequired() {
                    var horizontalRequiredCon = document.createElement('DIV')
                    horizontalRequiredCon.className = 'Q_webrtc_orientHorizontally Q_orientHorizontally Q_floatAboveDocument';
                    horizontalRequiredCon.style.zIndex = '9999999999999999999999999999999999999999';
                    document.body.appendChild(horizontalRequiredCon);
                }

                function hideHorizontalRequired() {
                    var horizontalRequiredCon = document.querySelector('.Q_webrtc_orientHorizontally');
                    if(horizontalRequiredCon && horizontalRequiredCon.parentNode != null) horizontalRequiredCon.parentNode.removeChild(horizontalRequiredCon) ;
                }

                function show() {
                    var dialogue, previewBox;
                    if(Q.info.isMobile){
                        if(window.innerWidth > window.innerHeight) {
                            console.log('show horizontal')
                            if(mobileHorizontaldialogueEl == null) {
                                mobileHorizontaldialogueEl = createPopupHorizontalMobile();
                            }

                            dialogue = mobileHorizontaldialogueEl.dialogueEl;
                            previewBox = mobileHorizontaldialogueEl.previewBoxEl;
                            activeDialogue = mobileHorizontaldialogueEl;
                            function resizeHandler() {
                                setTimeout(function () {
                                    if(!dialogue.classList.contains('Streams_webrtc_hidden') && window.innerWidth < window.innerHeight) {
                                        hide();
                                        show();
                                    }
                                }, 1600)
                                window.removeEventListener('resize', resizeHandler);

                            }
                            window.addEventListener('resize', resizeHandler);


                        } else {
                            console.log('show vertical')

                            showHorizontalRequired();

                            function resizeHandler() {
                                setTimeout(show, 1600)
                                hideHorizontalRequired();
                                window.removeEventListener('resize', resizeHandler);
                            }
                            window.addEventListener('resize', resizeHandler);
                            if(typeof screen != 'undefined' && screen.orientation != null) {
                                screen.orientation.addEventListener("change", resizeHandler);
                            }
                        }

                        if(mobileHorizontaldialogueEl == null) return;
                    } else {
                        if(desktopDialogueEl == null) {
                            desktopDialogueEl = createPopup();
                        }

                        dialogue = desktopDialogueEl.dialogueEl;
                        previewBox = desktopDialogueEl.previewBoxEl;
                        activeDialogue = desktopDialogueEl;
                        if(desktopDialogueEl == null) return;
                    }



                    if(dialogue && dialogue.classList.contains('Streams_webrtc_hidden')) {
                        controlsTool.WebRTCLib.mediaManager.canvasComposer.videoComposer.compositeVideosAndDraw();

                        dialogue.classList.remove('Streams_webrtc_hidden');
                        isHidden = false;

                        var controlsRect = controlsTool.controlBar.getBoundingClientRect();
                        if(Q.info.isMobile) {

                            dialogue.style.position = 'fixed';
                            dialogue.style.width = '100%';
                            dialogue.style.height = '100%';
                            dialogue.style.maxWidth = 'none';
                            dialogue.style.top = '0';
                            dialogue.style.left = '0';
                            //dialogue.style.left = (window.innerWidth / 2) - (dialogWidth / 2) + 'px';
                            //dialogue.style.bottom = (controlsRect.height + 10) + 'px';
                        } else {
                            var winWidth = window.innerWidth;
                            if(winWidth > dialogWidth) {
                                dialogue.style.left = (winWidth / 2) - (dialogWidth / 2) + 'px';
                            } else {
                                let left = (winWidth / 100 * 2) / 2;
                                dialogue.style.left = left + 'px';
                            }
                            //dialogue.style.bottom = (controlsRect.height + 10) + 'px';

                        }

                        var streamingCanvas = _streamingCanvas = document.querySelector('.Streams_webrtc_video-stream-canvas');
                        if(streamingCanvas != null) {
                            streamingCanvas.style.position = '';
                            streamingCanvas.style.top = '';
                            streamingCanvas.style.left = '';
                            previewBox.appendChild(streamingCanvas);
                        }

                        scenesInterface.syncList();
                        if(Q.info.isMobile) controlsTool.hide();
                    }
                }

                return {
                    hide: hide,
                    show: show,
                    toggle: function () {
                        if(isHidden) {
                            this.show();
                        } else this.hide();
                    },

                    scenesInterface: scenesInterface,
                    sourcesInterface: sourcesInterface
                }
            },
            get: function () {
                if(this.advancedLiveStreamingBox != null) {
                    return this.advancedLiveStreamingBox;
                } else {
                    this.advancedLiveStreamingBox = this.create();
                    return this.advancedLiveStreamingBox;
                }
            },
            refresh: function() {


            }
        }

    );

})(window.jQuery, window);
(function ($, window, undefined) {
    var icons = {
        camera: '<svg class="camera-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 99.499 99.498" enable-background="new -0.165 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M77.156,60.693l-15.521-8.961v8.51H25.223v-23.42   h36.412v8.795l15.521-8.961V60.693z"/>  </svg>',
        disabledCamera: '<svg  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 99.499 99.498" enable-background="new -0.165 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M49.584,95.203   c-25.198,0-45.698-20.501-45.698-45.699s20.5-45.699,45.698-45.699c25.199,0,45.699,20.5,45.699,45.699S74.783,95.203,49.584,95.203   z"/>  <polygon fill="#FFFFFF" points="61.635,39.34 43.63,60.242 61.635,60.242 61.635,51.732 77.156,60.693 77.156,36.656 61.635,45.617    "/>  <polygon fill="#FFFFFF" points="25.223,36.822 25.223,60.242 34.391,60.242 54.564,36.822 "/>  <rect x="47.585" y="11.385" transform="matrix(0.7578 0.6525 -0.6525 0.7578 43.3117 -20.7363)" fill="#C12337" width="4" height="73.163"/>  </svg>',
        microphone:'<svg class="microphone-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"    y="0px" viewBox="-0.165 -0.245 99.499 99.498"    enable-background="new -0.165 -0.245 99.499 99.498" xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M41.061,32.316c0-4.655,3.775-8.43,8.431-8.43   c4.657,0,8.43,3.774,8.43,8.43v19.861c0,4.655-3.773,8.431-8.43,8.431c-4.656,0-8.431-3.775-8.431-8.431V32.316z M63.928,52.576   c0,7.32-5.482,13.482-12.754,14.336v5.408h6.748v3.363h-16.86V72.32h6.749v-5.408c-7.271-0.854-12.753-7.016-12.754-14.336v-10.33   h3.362v10.125c0,6.115,4.958,11.073,11.073,11.073c6.116,0,11.073-4.958,11.073-11.073V42.246h3.363V52.576z"/>  </svg>',
        disabledMicrophone:'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0.049 -0.245 99.499 99.498" enable-background="new 0.049 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.797,99.253c-27.431,0-49.749-22.317-49.749-49.749c0-27.431,22.317-49.749,49.749-49.749   c27.432,0,49.75,22.317,49.75,49.749C99.548,76.936,77.229,99.253,49.797,99.253z M49.797,3.805   c-25.198,0-45.698,20.5-45.698,45.699s20.5,45.699,45.698,45.699c25.2,0,45.7-20.501,45.7-45.699S74.997,3.805,49.797,3.805z"/>  <path fill="#FFFFFF" d="M49.798,60.607c4.657,0,8.43-3.775,8.43-8.431v-8.634L44.893,59.024   C46.276,60.017,47.966,60.607,49.798,60.607z"/>  <path fill="#FFFFFF" d="M58.229,32.316c0-4.656-3.773-8.43-8.43-8.43c-4.656,0-8.43,3.775-8.431,8.43v19.861   c0,0.068,0.009,0.135,0.01,0.202l16.851-19.563V32.316z"/>  <path fill="#FFFFFF" d="M48.117,66.912v5.408h-6.749v3.363h16.86V72.32h-6.748v-5.408c7.271-0.854,12.754-7.016,12.754-14.336   v-10.33H60.87v10.125c0,6.115-4.957,11.073-11.072,11.073c-2.537,0-4.867-0.862-6.733-2.297l-2.305,2.675   C42.813,65.475,45.331,66.585,48.117,66.912z"/>  <path fill="#FFFFFF" d="M38.725,52.371V42.246h-3.362v10.33c0,1.945,0.397,3.803,1.102,5.507l2.603-3.022   C38.852,54.198,38.725,53.301,38.725,52.371z"/>  <rect x="47.798" y="11.385" transform="matrix(0.7578 0.6525 -0.6525 0.7578 43.3634 -20.8757)" fill="#C12337" width="4" height="73.163"/>  </svg>',
        endCall: '<svg version="1.1"    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"    x="0px" y="0px" viewBox="-0.291 -0.433 230 230" enable-background="new -0.291 -0.433 230 230"    xml:space="preserve">  <defs>  </defs>  <path fill="#C12236" d="M114.422,228.845C51.33,228.845,0,177.514,0,114.422C0,51.33,51.33,0,114.422,0   s114.423,51.33,114.423,114.422C228.845,177.514,177.515,228.845,114.422,228.845z M114.422,9.315   C56.466,9.315,9.315,56.466,9.315,114.422s47.151,105.107,105.107,105.107c57.957,0,105.107-47.151,105.107-105.107   S172.379,9.315,114.422,9.315z"/>  <path fill-rule="evenodd" clip-rule="evenodd" fill="#C12337" d="M48.375,111.046c-0.664,1.316-1.611,2.92-2.065,4.541   c-1.356,4.839-2.112,14.78,2.549,17.842c2.607,1.713,5.979,1.069,8.826,1.111c3.344,0.049,5.93,0.229,8.771,0.217   c4.818-0.021,13.588,1.619,16.644-2.956c3.33-4.986-0.959-9.42,2.013-14.331c2.396-3.958,9.311-5.427,13.066-6.184   c10.175-2.051,18.202-2.478,29.615-0.585c4.551,0.755,12.535,2.3,15.838,6.334c3.666,4.476-1.481,12.21,3.761,16.249   c2.694,2.077,6.099,1.577,9.13,1.575c3.183-0.003,5.826-0.139,8.682-0.122c5.307,0.032,13.455,2.128,16.858-2.832   c2.741-3.994,0.906-11.205,0.905-14.399c-0.158-1.169-0.457-2.3-0.898-3.393c-2.855-11.688-20.192-19.097-33.174-22.435   c-22.619-5.815-46.142-4.622-64.881-0.965c-1.395,0.218-2.752,0.578-4.071,1.079c-0.491-0.026-0.944,0.094-1.357,0.359   c-1.281,0.188-2.526,0.517-3.732,0.989c-8.698,3.484-17.809,5.413-24.858,15.118C49.383,108.49,48.274,110.399,48.375,111.046z"/> </svg>',
        dots: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">  <circle fill="#FFFFFF" cx="50.804" cy="16.167" r="10"/>  <circle fill="#FFFFFF" cx="50.804" cy="51.166" r="10"/>  <circle fill="#FFFFFF" cx="50.804" cy="86.166" r="10"/>  </svg>',
        screen: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0.074 0.053 99.499 99.498" enable-background="new 0.074 0.053 99.499 99.498"    xml:space="preserve">  <rect x="27.102" y="34.876" fill="#FFFFFF" width="45.375" height="24.868"/>  <path fill="#FFFFFF" d="M49.822,0.053c-27.432,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.433,0,49.75-22.317,49.75-49.749C99.572,22.371,77.255,0.053,49.822,0.053z M76.494,63.377H53.436v5.196h5.43v3.75H40.782v-3.75   h5.43v-5.196h-23.06V31.281h53.343V63.377z"/>  </svg>',
        user: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0.251 0.251 99.498 99.498" enable-background="new 0.251 0.251 99.498 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.999,0.251C22.568,0.251,0.251,22.568,0.251,50c0,27.432,22.317,49.749,49.748,49.749   c27.433,0,49.75-22.317,49.75-49.749C99.749,22.568,77.432,0.251,49.999,0.251z M50.085,27.266c6.663,0,12.062,5.83,12.062,13.021   c0,7.19-5.4,13.02-12.062,13.02c-6.66,0-12.061-5.83-12.061-13.02C38.024,33.096,43.425,27.266,50.085,27.266z M25.789,70.721   c0.593-9.297,11.208-16.71,24.207-16.71c13.001,0,23.619,7.412,24.215,16.71H25.789z"/>  </svg>',
        backArrow: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    width="35.317px" height="35.445px" viewBox="0 0 35.317 35.445" enable-background="new 0 0 35.317 35.445" xml:space="preserve">  <polyline fill="none" stroke="#000000" stroke-width="4" stroke-miterlimit="10" points="19.135,34.031 2.828,17.722 19.135,1.414    "/>  <line fill="none" stroke="#000000" stroke-width="4" stroke-miterlimit="10" x1="2.645" y1="17.722" x2="35.317" y2="17.722"/>  </svg>',
        enabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0 0 99.999 99.999" enable-background="new 0 0 99.999 99.999" xml:space="preserve">  <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.571,22.429,50,50,50c27.569,0,50-22.429,50-50   C99.999,22.431,77.568,0,50,0z M45.261,67.689c0,0.148-0.188,0.191-0.261,0.326c-0.026,0.049-0.149,0.098-0.187,0.141   c-0.076,0.084-0.217,0.146-0.324,0.188c-0.053,0.018-0.131,0.029-0.188,0.033c-0.056,0.008-0.125,0.006-0.18-0.004   c-0.15-0.021-0.186-0.292-0.316-0.364l-10.094-7.804h-8.544c-0.06,0-0.121,0.224-0.179,0.21c-0.058-0.016-0.114,0.077-0.166,0.05   c-0.105-0.061-0.192-0.089-0.252-0.193c-0.03-0.053-0.162-0.079-0.178-0.137c-0.015-0.059-0.132-0.089-0.132-0.15V40.02   c0-0.06,0.117-0.121,0.132-0.178c0.016-0.058,0.094-0.114,0.123-0.166c0.03-0.052,0.095-0.1,0.137-0.143   c0.086-0.086,0.206-0.209,0.322-0.242c0.058-0.016,0.133-0.086,0.193-0.086h8.545l10.089-7.51c0.049-0.028,0.095-0.03,0.146-0.052   c0.141-0.059,0.184-0.031,0.333-0.035c0.055,0.012,0.11,0.032,0.165,0.045c0.05,0.025,0.104,0.048,0.151,0.079   c0.046,0.031,0.09,0.07,0.127,0.112c0.077,0.084,0.31,0.187,0.337,0.296c0.013,0.055,0.2,0.113,0.2,0.169V67.689z M53.839,60.984   c-0.25,0-0.502-0.095-0.695-0.283c-0.396-0.386-0.406-1.019-0.021-1.412c9.075-9.354,0.391-18.188,0.018-18.56   c-0.396-0.389-0.396-1.022-0.01-1.415c0.393-0.392,1.024-0.393,1.415-0.005c0.105,0.105,10.449,10.615,0.016,21.372   C54.361,60.883,54.102,60.984,53.839,60.984z M60.025,66.293c-0.25,0-0.502-0.094-0.693-0.281c-0.396-0.385-0.406-1.02-0.021-1.414   c14.265-14.703,0.603-28.596,0.015-29.181c-0.394-0.389-0.396-1.022-0.007-1.414c0.392-0.392,1.023-0.393,1.414-0.005   c0.158,0.157,15.638,15.888,0.015,31.991C60.548,66.189,60.289,66.293,60.025,66.293z M66.607,70.43   c-0.197,0.203-0.459,0.301-0.719,0.301c-0.252,0-0.502-0.094-0.697-0.279c-0.396-0.387-0.404-1.02-0.021-1.414   c18.603-19.174,0.781-37.296,0.015-38.06c-0.394-0.389-0.396-1.022-0.006-1.414c0.389-0.392,1.022-0.394,1.413-0.005   C66.794,29.759,86.568,49.853,66.607,70.43z"/>  </svg>  ',
        disabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0 0 99.999 99.999" enable-background="new 0 0 99.999 99.999" xml:space="preserve">  <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.571,22.429,50,50,50c27.568,0,49.999-22.429,49.999-50   C99.999,22.431,77.568,0,50,0z M50,95.929C24.675,95.929,4.071,75.325,4.071,50C4.071,24.675,24.675,4.07,50,4.07   C75.324,4.07,95.927,24.674,95.927,50C95.927,75.326,75.324,95.929,50,95.929z"/>  <g>   <path fill="#FFFFFF" d="M43.8,68.242c0.13,0.072,0.16,0.109,0.31,0.131c0.055,0.01,0.113,0.012,0.169,0.004    c0.056-0.004,0.112-0.016,0.165-0.033c0.107-0.041,0.203-0.104,0.279-0.188c0.038-0.043,0.277-0.092,0.303-0.141    c0.072-0.135,0.287-0.178,0.287-0.326v-6.393l-4.271,4.722L43.8,68.242z"/>   <path fill="#FFFFFF" d="M45.314,32.309c0-0.056-0.213-0.113-0.227-0.168c-0.027-0.109-0.185-0.211-0.261-0.295    c-0.037-0.042-0.132-0.079-0.178-0.11c-0.047-0.031-0.126-0.05-0.177-0.075c-0.055-0.013-0.123-0.025-0.178-0.037    c-0.149,0.004-0.199-0.008-0.339,0.051c-0.051,0.022-0.1,0.291-0.149,0.319l-10.092,7.808h-8.545c-0.06,0-0.121-0.228-0.179-0.212    c-0.117,0.032-0.223-0.024-0.309,0.062c-0.042,0.043-0.079,0.032-0.109,0.084c-0.03,0.052-0.135,0.078-0.151,0.136    c-0.016,0.057-0.105,0.088-0.105,0.148v19.964c0,0.062,0.09,0.121,0.105,0.18c0.016,0.058,0.08,0.113,0.11,0.166    c0.06,0.104,0.167,0.191,0.273,0.252c0.052,0.027,0.118,0.116,0.176,0.132c0.058,0.014,0.129,0.088,0.189,0.088h8.544l1.704,1.059    l9.898-11.321V32.309z"/>   <path fill="#FFFFFF" d="M53.123,59.289c-0.385,0.394-0.375,1.026,0.021,1.412c0.193,0.188,0.445,0.283,0.695,0.283    c0.263,0,0.522-0.102,0.722-0.303c5.376-5.542,5.232-11.014,3.819-15.036l-1.497,1.738C57.72,50.709,57.34,54.942,53.123,59.289z"    />   <path fill="#FFFFFF" d="M54.545,39.31c-0.391-0.388-1.021-0.387-1.415,0.005c-0.387,0.393-0.387,1.026,0.01,1.415    c0.018,0.018,0.059,0.06,0.111,0.114l1.308-1.52C54.556,39.321,54.546,39.311,54.545,39.31z"/>   <path fill="#FFFFFF" d="M59.311,64.598c-0.385,0.395-0.375,1.029,0.021,1.414c0.191,0.188,0.443,0.281,0.693,0.281    c0.264,0,0.522-0.104,0.722-0.305c10.414-10.733,7.009-21.294,3.533-27.195l-1.324,1.538    C66.038,45.763,68.617,55.007,59.311,64.598z"/>   <path fill="#FFFFFF" d="M65.171,69.037c-0.384,0.395-0.375,1.027,0.021,1.414c0.195,0.186,0.445,0.279,0.697,0.279    c0.26,0,0.521-0.098,0.719-0.301c15.134-15.601,7.428-30.921,2.728-37.507l-1.299,1.509C72.5,40.69,79.215,54.562,65.171,69.037z"    />  </g>  <rect x="47.989" y="13.233" transform="matrix(0.7577 0.6526 -0.6526 0.7577 44.7397 -20.5144)" fill="#C12337" width="4.02" height="73.532"/>  </svg>',
        switchCameras: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">  <g>   <path fill="#FFFFFF" d="M50.037,43.904c-3.939,0-7.151,3.212-7.151,7.168c0,3.947,3.212,7.167,7.151,7.167    c3.947,0,7.152-3.22,7.152-7.167C57.189,47.116,53.984,43.904,50.037,43.904z M50.037,56.49c-2.988,0-5.402-2.431-5.402-5.417    c0-2.997,2.414-5.418,5.402-5.418c2.98,0,5.402,2.422,5.402,5.418C55.439,54.069,53.017,56.49,50.037,56.49z"/>   <path fill="#FFFFFF" d="M63.047,43.286c-0.596,0-1.084,0.487-1.084,1.091c0,0.604,0.488,1.091,1.084,1.091    c0.597,0,1.083-0.487,1.083-1.091C64.13,43.773,63.644,43.286,63.047,43.286z"/>   <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.571,22.429,50,50,50c27.569,0,50-22.429,50-50C100,22.431,77.569,0,50,0z     M25.111,51.626c0.934-0.933,2.432-0.933,3.366,0c0.934,0.936,0.926,2.446-0.007,3.382l-6.642,6.634    c-0.448,0.451-1.058,0.703-1.692,0.703c-0.633,0-1.242-0.252-1.689-0.703l-6.639-6.634c-0.933-0.936-0.933-2.446,0-3.382    c0.934-0.933,2.365-0.931,3.299,0l2.477,2.563V50c0-17.784,14.551-32.255,32.336-32.255c1.321,0,2.427,1.071,2.427,2.389    c0,1.32-1.017,2.39-2.337,2.39C34.86,22.524,22.583,34.85,22.583,50v4.189L25.111,51.626z M33.583,59.54V43.897    c0-1.44,1.517-3.086,2.956-3.086h5.341l2.703-2.58v-0.008c1-0.518,1.5-1.412,2.258-1.412h6.502c0.711,0,1.338,0.578,1.804,1.043    l0.015,0.158c0.007,0,0.022-0.172,0.022-0.172l3.128,2.971h5.224c1.433,0,3.048,1.646,3.048,3.086V59.54    c0,1.439-1.615,3.271-3.048,3.271H36.538C35.099,62.811,33.583,60.979,33.583,59.54z M86.506,49.071    c-0.614,0-1.063-0.235-1.529-0.698l-2.395-2.56V50c0,17.787-14.631,32.255-32.419,32.255c-1.32,0-2.47-1.067-2.47-2.39    c0-1.32,1.08-2.388,2.399-2.388c15.151,0,27.489-12.329,27.489-27.478v-4.187l-2.611,2.56c-0.934,0.931-2.473,0.931-3.403,0    c-0.938-0.934-0.951-2.447-0.014-3.381l6.63-6.636c0.935-0.935,2.442-0.935,3.375,0l6.635,6.636    c0.936,0.934,0.935,2.447-0.001,3.381C87.728,48.836,87.116,49.071,86.506,49.071z"/>  </g>  </svg>',
    }

    /**
     * Streams/webrtc/control tool.
     * Users can chat with each other via WebRTC using Twilio or raw streams
     * @module Streams
     * @class Streams webrtc
     * @constructor
     * @param {Object} options
     *  Hash of possible options
     */
    Q.Tool.define("Streams/webrtc/control", function(options) {

            if (!window.WebRTCconference) {
                throw "Video room should be created";
            }
            console.log('%c window.WebRTCconference', 'background:green;', window.WebRTCconference.localParticipant());

            this.refresh();

        },

        {
            editable: false,
            onCreate: new Q.Event(),
            onUpdate: new Q.Event(),
            onRefresh: new Q.Event()
        },

        {
            refresh: function() {
                var tool = this;

                console.log('%c window.WebRTCconference', 'background:yellow;', window.WebRTCconference.localParticipant());
                var controlBar = tool.createControlBar();
                console.log('%c window.WebRTCconference', 'background:purple;', controlBar);

                window.WebRTCcontrolBar = controlBar;
                tool.updateControlBar();

                tool.createSettingsPopup();
                tool.participantsPopup().createList();

                if(!Q.info.isMobile) tool.element.appendChild(controlBar);
                tool.bindRTCEvents();

            },
            bindRTCEvents: function() {
                var tool = this;
                WebRTCconference.event.on('participantConnected', function (participant) {
                    console.log('%c CONTROL BAR: ANOTHER USER JOINED', 'background:blue;color:white;', participant)

                    tool.participantsPopup().addItem(participant);
                });
                WebRTCconference.event.on('participantDisconnected', function (participant) {
                    console.log('%c CONTROL BAR: ANOTHER USER DISCONNECTED', 'background:blue;color:white;', participant)

                    tool.participantsPopup().removeItem(participant);
                });
            },
            createControlBar: function() {
                var tool = this;
                var controlBar = document.createElement('DIV');
                controlBar.className = 'webrtc_tool_conference-control';
                var controlBarCon = document.createElement('DIV');
                controlBarCon.className = 'webrtc_tool_conference-control-inner';
                var cameraBtnCon = document.createElement('DIV');
                cameraBtnCon.className = 'webrtc_tool_camera-control';
                var cameraBtn = document.createElement('DIV');
                cameraBtn.className = 'webrtc_tool_camera-control-btn';
                var cameraBtnIcon = document.createElement('DIV');
                cameraBtnIcon.className = 'webrtc_tool_camera-control-icon';
                cameraBtnIcon.innerHTML = icons.disabledCamera;
                var cameraSwitcherBtnCon = document.createElement('DIV');
                cameraSwitcherBtnCon.className = 'webrtc_tool_camera-switcher';
                var cameraSwitcherBtn = document.createElement('DIV');
                cameraSwitcherBtn.className = 'webrtc_tool_camera-switcher-btn';
                cameraSwitcherBtn.innerHTML = icons.switchCameras;
                var speakerBtnCon = document.createElement('DIV');
                speakerBtnCon.className = 'webrtc_tool_speaker-control';
                var speakerBtn = document.createElement('DIV');
                speakerBtn.className = 'webrtc_tool_speaker-control-btn';
                speakerBtn.innerHTML = icons.enabledSpeaker;
                var microphoneBtnCon = document.createElement('DIV');
                microphoneBtnCon.className = 'webrtc_tool_microphone-control';
                var microphoneBtn = document.createElement('DIV');
                microphoneBtn.className = 'webrtc_tool_microphone-control-btn';
                microphoneBtn.innerHTML = icons.microphone;
                var usersBtnCon = document.createElement('DIV');
                usersBtnCon.className = 'webrtc_tool_manage-users-btn';
                var usersBtn = document.createElement('DIV');
                usersBtn.className = 'webrtc_tool_manage-users-btn-btn';
                var usersBtnIcon = document.createElement('DIV');
                usersBtnIcon.className = 'webrtc_tool_manage-users-btn-icon';
                usersBtnIcon.innerHTML = icons.user;

                if(!Q.info.isMobile) {
                    var screenSharingBtn = document.createElement('DIV');
                    screenSharingBtn.className = 'webrtc_tool_screen-sharing-btn';
                    screenSharingBtn.innerHTML = icons.screen;
                }

                cameraBtnCon.appendChild(cameraBtn);
                cameraBtnCon.appendChild(cameraBtnIcon);
                controlBarCon.appendChild(cameraBtnCon);
                if(WebRTCconference.conferenceControl.videoInputDevices.length > 1) { controlBarCon.appendChild(cameraSwitcherBtn);}
                if(Q.info.isMobile) controlBarCon.appendChild(speakerBtn);
                controlBarCon.appendChild(microphoneBtn);
                usersBtnCon.appendChild(usersBtn);
                usersBtnCon.appendChild(usersBtnIcon);
                controlBarCon.appendChild(usersBtnCon);
                //if(!Q.info.isMobile) {controlBarCon.appendChild(screenSharingBtn);}
                controlBar.appendChild(controlBarCon);

                tool.controlBar = controlBar;
                tool.cameraBtn = cameraBtn;
                tool.cameraBtnIcon = cameraBtnIcon;
                tool.speakerBtn = speakerBtn;
                tool.microphoneBtn = microphoneBtn;
                tool.usersBtn = usersBtn;
                tool.usersBtnIcon = usersBtnIcon;



                cameraBtn.addEventListener('mouseup', function () {
                    if(!Q.info.isMobile) return;
                    Q.Dialogs.push({
                        title: "Participants",
                        className: 'webrtc_tool_participants-list',
                        content: tool.settingsPopupEl
                    });
                    //tool.toggleVideo()
                })

                cameraSwitcherBtn.addEventListener('mouseup', function () {
                    tool.toggleCameras()
                })
                speakerBtn.addEventListener('mouseup', function () {
                    console.log('mouseupmouseupmouseup')
                    tool.toggleAudioOfAll()
                })
                microphoneBtn.addEventListener('mouseup', function () {
                    console.log('bbbb')

                    tool.toggleAudio()
                })

                /*  if(!Q.info.isMobile) {
                      screenSharingBtn.addEventListener('click', function () {
                          WebRTCconference.screenSharing.startShareScreen()
                      })
                  }*/

                return controlBar;
            },
            toggleVideo: function () {
                var tool = this;
                var videoInputDevices = WebRTCconference.conferenceControl.videoInputDevices();

                console.log('toggleVideo', WebRTCconference.conferenceControl.cameraIsEnabled(), WebRTCconference.conferenceControl.currentCameraDevice(), videoInputDevices[videoInputDevices.length-1])

                if(WebRTCconference.conferenceControl.cameraIsEnabled() && WebRTCconference.conferenceControl.currentCameraDevice() == videoInputDevices[videoInputDevices.length-1]) {
                    WebRTCconference.conferenceControl.disableVideo();
                } else {
                    if(!WebRTCconference.conferenceControl.cameraIsEnabled()){
                        WebRTCconference.conferenceControl.enableVideo();
                    }
                    WebRTCconference.conferenceControl.toggleCameras();

                }


                tool.participantsPopup().toggleLocalVideo();

                tool.updateControlBar();
            },
            toggleAudio: function () {
                var tool = this;
                if(WebRTCconference.conferenceControl.micIsEnabled()){
                    WebRTCconference.conferenceControl.disableAudio();
                } else {
                    WebRTCconference.conferenceControl.enableAudio();
                }

                tool.updateControlBar();
            },
            toggleAudioOfAll: function () {
                var tool = this;
                if(WebRTCconference.conferenceControl.speakerIsEnabled()){
                    WebRTCconference.conferenceControl.disableAudioOfAll();
                } else {
                    WebRTCconference.conferenceControl.enableAudioOfAll();
                }

                tool.updateControlBar();
            },
            toggleCameras: function () {
                WebRTCconference.conferenceControl.toggleCameras();
            },
            updateControlBar: function () {
                var tool = this;
                if(tool.controlBar == null) return;
                var conferenceControl = WebRTCconference.conferenceControl;

                if(WebRTCconference.conferenceControl.currentCameraDevice() == null) {
                    tool.cameraBtnIcon.innerHTML = icons.disabledCamera;
                } else if(!conferenceControl.cameraIsEnabled()) {
                    tool.cameraBtnIcon.innerHTML = icons.disabledCamera;
                } else if(conferenceControl.cameraIsEnabled()) {
                    tool.cameraBtnIcon.innerHTML = icons.camera;
                }

                if (!conferenceControl.cameraIsEnabled()) {
                    console.log('conferenceControl.speakerIsEnabled()', conferenceControl.speakerIsEnabled())
                    tool.speakerBtn.classList.remove('webrtc_tool_hidden');
                    tool.speakerBtn.innerHTML = conferenceControl.speakerIsEnabled() ? icons.enabledSpeaker : icons.disabledSpeaker;
                } else {
                    tool.speakerBtn.classList.add('webrtc_tool_hidden');
                }

                if(WebRTCconference.conferenceControl.currentAudioDevice() == null) {
                    tool.microphoneBtn.innerHTML = icons.disabledMicrophone;
                } else if(!conferenceControl.micIsEnabled()) {
                    tool.microphoneBtn.innerHTML = icons.disabledMicrophone;
                } else if(conferenceControl.micIsEnabled()) {
                    tool.microphoneBtn.innerHTML = icons.microphone;
                }
            },
            createSettingsPopup: function () {
                var tool = this;
                var settingsPopup=document.createElement('DIV');
                settingsPopup.className = 'webrtc_tool_popup-settings webrtc_tool_popup-box';

                var chooseCameraList = document.createElement('DIV');
                chooseCameraList.className = 'webrtc_tool_choose-device'
                var title = document.createElement('H4');
                title.innerHTML = 'Select available camera';
                chooseCameraList.appendChild(title);
                var count = 1;
                WebRTCconference.conferenceControl.videoInputDevices().forEach(function(mediaDevice){
                    console.log('mediaDevice', mediaDevice)
                    var radioBtnItem = document.createElement('LABEL');
                    var radioBtn= document.createElement('INPUT');
                    radioBtn.name = 'cameras';
                    radioBtn.type = 'radio';
                    radioBtn.value = mediaDevice.deviceId;
                    if(WebRTCconference.conferenceControl.currentCameraDevice().deviceId == mediaDevice.deviceId) {
                        radioBtn.disabled = true;
                        radioBtn.checked = true;
                        radioBtnItem.classList.add('webrtc_tool_disabled-radio');

                    }
                    var textLabel = document.createTextNode(mediaDevice.label || `Camera ${count  }`);
                    radioBtnItem.appendChild(radioBtn);
                    radioBtnItem.appendChild(textLabel);
                    chooseCameraList.appendChild(radioBtnItem);

                    radioBtnItem.addEventListener('click', function (e) {
                       //if(!WebRTCconference.conferenceControl.cameraIsEnabled()) WebRTCconference.conferenceControl.enableVideo();

                        var checked = e.target.querySelector('input[name="cameras"]');
                        if(checked) {
                            var allItems = tool.settingsPopupEl.querySelectorAll('input[name="cameras"]');
                            allItems.forEach( function(item) {
                                console.log('allItems[i]', item)
                                item.disabled = false;
                                item.parentNode.classList.remove('webrtc_tool_disabled-radio');
                            })
                            checked.parentNode.classList.add('webrtc_tool_disabled-radio');
                            checked.checked = true;
                            checked.disabled = true;
                            var cameraId = checked.value;
                            if (cameraId != null) WebRTCconference.conferenceControl.toggleCameras(cameraId)
                        }
                    })

                });

                var screenSharingRadioItem = document.createElement('LABEL');
                var radioBtn= document.createElement('INPUT');
                radioBtn.name = 'cameras';
                radioBtn.type = 'radio';
                radioBtn.value = 'screen';
                var textLabel = document.createTextNode('Screen sharing');
                screenSharingRadioItem.appendChild(radioBtn);
                screenSharingRadioItem.appendChild(textLabel);
                if(!Q.info.isMobile) chooseCameraList.appendChild(screenSharingRadioItem);

                var turnOffradioBtnItem = document.createElement('LABEL');
                var radioBtn= document.createElement('INPUT');
                radioBtn.name = 'cameras';
                radioBtn.type = 'radio';
                radioBtn.value = 'off';
                var textLabel = document.createTextNode('Turn off all cameras');
                turnOffradioBtnItem.appendChild(radioBtn);
                turnOffradioBtnItem.appendChild(textLabel);
                chooseCameraList.appendChild(turnOffradioBtnItem);

                screenSharingRadioItem.addEventListener('mouseup', function (e) {
                    WebRTCconference.screenSharing.startShareScreen(function () {
                        var currentSelectedItem = tool.settingsPopupEl.querySelector('.webrtc_tool_disabled-radio');
                        if(currentSelectedItem != null) {
                            currentSelectedItem.firstChild.disabled = false;
                            currentSelectedItem.classList.remove('webrtc_tool_disabled-radio');
                        }
                        e.target.classList.add('webrtc_tool_disabled-radio');
                    }, function () {
                        var currentCameraId = WebRTCconference.conferenceControl.currentCameraDevice().deviceId;
                        var currentDevice = tool.settingsPopupEl.querySelector('input[value="' + currentCameraId + '"]');
                        console.log('currentDevice', currentDevice)
                        if(currentDevice != null) {
                            currentDevice.checked = true;
                            currentDevice.disabled = true;
                            currentDevice.parentNode.classList.add('webrtc_tool_disabled-radio');
                        }
                    })
                })

                turnOffradioBtnItem.addEventListener('mouseup', function (e) {
                    var checked = e.target.querySelector('input[name="cameras"]');
                    if(checked) {
                        var allItems = tool.settingsPopupEl.querySelectorAll('input[name="cameras"]');
                        allItems.forEach( function(item) {
                            console.log('allItems[i]', item)
                            item.disabled = false;
                            item.parentNode.classList.remove('webrtc_tool_disabled-radio');
                        })
                        checked.parentNode.classList.add('webrtc_tool_disabled-radio');
                        checked.disabled = true;
                        checked.checked = true;
                        var cameraId = checked.value;
                        WebRTCconference.conferenceControl.disableVideo()
                    }
                })

                settingsPopup.appendChild(chooseCameraList);

                tool.settingsPopupEl = settingsPopup;
                tool.cameraBtn.parentNode.appendChild(settingsPopup);

                tool.hoverTimeout = {setttingsPopup: null, participantsPopup: null};
                tool.cameraBtn.addEventListener('mouseenter', function (e) {
                    if(tool.hoverTimeout.setttingsPopup != null) {
                        clearTimeout(tool.hoverTimeout.setttingsPopup);
                        tool.hoverTimeout.setttingsPopup = null;
                    }
                    tool.cameraBtn.parentNode.classList.add('webrtc_tool_hover');
                });
                tool.cameraBtn.addEventListener('mouseleave', function (e) {
                    if(e.target == e.currentTarget || e.currentTarget.contains(e.eventTarget)) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    tool.hoverTimeout.setttingsPopup = setTimeout(function () {
                        tool.cameraBtn.parentNode.classList.remove('webrtc_tool_hover');
                    }, 300)
                });

                settingsPopup.addEventListener('mouseenter', function (e) {
                    console.log('usersBtn CANCEL', e.target)

                    if(tool.hoverTimeout.setttingsPopup != null) {
                        clearTimeout(tool.hoverTimeout.setttingsPopup);
                        tool.hoverTimeout.setttingsPopup = null;
                    }
                })
                settingsPopup.addEventListener('mouseleave', function (e) {
                    setTimeout(function () {
                        tool.cameraBtn.parentNode.classList.remove('webrtc_tool_hover');
                    }, 300)

                });
            },

            participantsPopup:function() {
                var tool = this;

                var localParticipant = WebRTCconference.localParticipant();
                var roomParticipants = WebRTCconference.roomParticipants();
                var participantListEl;
                var ListItem = function () {
                    this.listElement = null;
                    this.audioBtnEl = null;
                    this.videoBtnEl = null;
                    this.participant = null;
                    this.isAudioMuted = null;
                    this.isVideoMuted = null;
                    this.toggleAudio = function () {
                        if(this.isAudioMuted == false || this.isAudioMuted == null)
                            this.muteAudio();
                        else this.unmuteAudio();
                    };
                    this.toggleVideo = function () {
                        if(this.participant == localParticipant) {
                            this.toggleLocalVideo();
                            return;
                        }
                        if(this.isVideoMuted == false || this.isVideoMuted == null)
                            this.muteVideo();
                        else this.unmuteVideo();
                    };
                    this.toggleLocalVideo = function() {
                        var i, listItem;
                        for (i = 0; listItem = tool.participantsList[i]; i++){
                            if(listItem.participant == localParticipant) {
                                if(WebRTCconference.conferenceControl.cameraIsEnabled()){
                                    listItem.videoBtnEl.innerHTML = listIcons.disabledScreen;
                                    WebRTCconference.conferenceControl.disableVideo();
                                } else {
                                    listItem.videoBtnEl.innerHTML = listIcons.screen;
                                    WebRTCconference.conferenceControl.enableVideo();
                                }
                                tool.updateControlBar();
                                break;
                            }
                        }
                    };
                    this.muteVideo = function () {
                        var participant = this.participant;

                        for(var i in participant.tracks) {
                            var track = participant.tracks[i];
                            if(track.kind != 'video') continue;
                            track.trackEl.pause();
                            track.trackEl.srcObject = null;
                        }
                        this.videoBtnEl.innerHTML = listIcons.disabledScreen;
                        this.isVideoMuted = true;
                    };
                    this.unmuteVideo = function () {
                        var participant = this.participant;
                        for(var i in participant.tracks) {
                            var track = participant.tracks[i];
                            if(track.kind != 'video') continue;
                            var stream = new MediaStream()
                            stream.addTrack(track.mediaStreamTrack)
                            track.trackEl.srcObject = stream;
                        }
                        this.videoBtnEl.innerHTML = listIcons.screen;
                        this.isVideoMuted = false;
                    };
                    this.muteAudio = function () {
                        var participant = this.participant;

                        for(var i in participant.tracks) {
                            var track = participant.tracks[i];
                            if(track.kind == 'audio') track.trackEl.muted = true;
                        }
                        this.audioBtnEl.innerHTML = listIcons.disabledSpeaker;
                        this.isAudioMuted = true;
                    };
                    this.unmuteAudio = function () {
                        var participant = this.participant;
                        for(var i in participant.tracks) {
                            var track = participant.tracks[i];
                            if(track.kind == 'audio') track.trackEl.muted = false;
                        }
                        this.audioBtnEl.innerHTML = listIcons.loudSpeaker;
                        this.isAudioMuted = false;
                    };
                    this.remove = function () {
                        if(this.listElement.parentNode != null) this.listElement.parentNode.removeChild(this.listElement);
                        for(var i in tool.participantsList) {
                            if(tool.participantsList[i].participant.sid == this.participant.sid) {
                                tool.participantsList[i] = null;
                                break;
                            }removeItem
                        }

                        tool.participantsList = tool.participantsList.filter(function (listItem) {
                            return listItem != null;
                        })

                    };
                }

                var listIcons = {
                    loudSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0 0 99.5 99.5" enable-background="new 0 0 99.5 99.5" xml:space="preserve">  <path fill="#C12337" d="M49.749,99.5C22.317,99.5,0,77.18,0,49.749C0,22.317,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.18,77.182,99.5,49.749,99.5z"/>  <g>   <g id="Layer_2">    <path fill="#FFFFFF" d="M36.463,39.359l10.089-7.573c0.049-0.028,0.095-0.062,0.146-0.084c0.141-0.059,0.184-0.047,0.333-0.051     c0.055,0.012,0.11,0.024,0.165,0.037c0.05,0.025,0.104,0.044,0.151,0.075c0.046,0.031,0.09,0.068,0.127,0.11     c0.077,0.084,0.131,0.186,0.159,0.295c0.013,0.055,0.013,0.112,0.021,0.168v35.382c-0.019,0.148-0.01,0.191-0.082,0.326     c-0.026,0.049-0.06,0.097-0.098,0.14c-0.076,0.084-0.172,0.146-0.279,0.187c-0.053,0.018-0.109,0.029-0.165,0.034     c-0.056,0.007-0.114,0.005-0.169-0.004c-0.15-0.021-0.18-0.058-0.31-0.131l-10.089-7.571h-8.544     c-0.06-0.009-0.121-0.009-0.179-0.023c-0.058-0.016-0.114-0.039-0.166-0.067c-0.105-0.06-0.192-0.147-0.252-0.251     c-0.03-0.053-0.053-0.109-0.069-0.167c-0.015-0.058-0.016-0.118-0.023-0.179V40.047c0.007-0.06,0.008-0.121,0.023-0.178     c0.016-0.058,0.039-0.114,0.069-0.166c0.03-0.052,0.067-0.1,0.109-0.143c0.086-0.086,0.192-0.147,0.309-0.179     c0.058-0.016,0.119-0.016,0.179-0.023L36.463,39.359L36.463,39.359z"/>   </g>   <g>    <path fill="#FFFFFF" d="M56.589,61.012c-0.25,0-0.502-0.095-0.695-0.283c-0.396-0.386-0.406-1.019-0.021-1.413     c9.074-9.354,0.39-18.188,0.017-18.559c-0.396-0.389-0.396-1.022-0.009-1.415c0.392-0.392,1.024-0.393,1.414-0.005     c0.106,0.105,10.449,10.615,0.016,21.372C57.111,60.91,56.851,61.012,56.589,61.012z"/>   </g>   <g>    <path fill="#FFFFFF" d="M62.776,66.321c-0.251,0-0.502-0.094-0.694-0.282c-0.396-0.385-0.406-1.019-0.021-1.414     c14.264-14.703,0.602-28.596,0.014-29.181c-0.393-0.389-0.395-1.022-0.006-1.414c0.391-0.392,1.023-0.393,1.414-0.005     c0.158,0.157,15.637,15.888,0.014,31.991C63.298,66.218,63.039,66.321,62.776,66.321z"/>   </g>   <g>    <path fill="#FFFFFF" d="M68.638,70.759c-0.251,0-0.502-0.094-0.696-0.28c-0.396-0.386-0.405-1.019-0.021-1.414     c18.602-19.175,0.781-37.297,0.014-38.06c-0.393-0.389-0.395-1.022-0.006-1.414c0.39-0.392,1.023-0.394,1.414-0.005     c0.201,0.2,19.975,20.294,0.014,40.871C69.16,70.66,68.898,70.759,68.638,70.759z"/>   </g>  </g>  </svg>',
                    disabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.5 99.5" enable-background="new 0 0 99.5 99.5" xml:space="preserve">  <path fill="#8C8C8C" d="M49.749,99.5C22.317,99.5,0,77.18,0,49.749C0,22.317,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.18,77.182,99.5,49.749,99.5z"/>  <g>   <path fill="#FFFFFF" d="M47.654,32.336c-0.008-0.056-0.008-0.113-0.021-0.168c-0.028-0.109-0.082-0.211-0.159-0.295    c-0.037-0.042-0.081-0.079-0.127-0.11c-0.047-0.031-0.101-0.05-0.151-0.075c-0.055-0.013-0.11-0.025-0.165-0.037    c-0.149,0.004-0.192-0.008-0.333,0.051c-0.051,0.022-0.097,0.056-0.146,0.084l-10.089,7.573l-8.545-0.001    c-0.06,0.007-0.121,0.007-0.179,0.023c-0.117,0.032-0.223,0.093-0.309,0.179c-0.042,0.043-0.079,0.091-0.109,0.143    c-0.03,0.052-0.053,0.108-0.069,0.166c-0.015,0.057-0.016,0.118-0.023,0.178v19.964c0.007,0.061,0.008,0.121,0.023,0.179    c0.016,0.058,0.039,0.114,0.069,0.167c0.06,0.104,0.147,0.191,0.252,0.251c0.052,0.028,0.108,0.052,0.166,0.067    c0.058,0.015,0.119,0.015,0.179,0.023h7.885l11.851-11.852V32.336z"/>   <path fill="#FFFFFF" d="M46.551,68.27c0.13,0.073,0.16,0.11,0.31,0.131c0.055,0.009,0.113,0.011,0.169,0.004    c0.056-0.005,0.112-0.017,0.165-0.034c0.107-0.041,0.203-0.103,0.279-0.187c0.038-0.043,0.072-0.091,0.098-0.14    c0.072-0.135,0.063-0.178,0.082-0.326V57.356l-6.708,6.708L46.551,68.27z"/>   <path fill="#FFFFFF" d="M55.873,59.316c-0.385,0.395-0.375,1.027,0.021,1.413c0.193,0.188,0.445,0.283,0.695,0.283    c0.262,0,0.521-0.103,0.721-0.304c5.972-6.156,5.136-12.229,3.31-16.319l-1.479,1.48C60.492,49.367,60.773,54.264,55.873,59.316z"    />   <path fill="#FFFFFF" d="M55.88,39.342c-0.361,0.367-0.371,0.937-0.05,1.329l1.386-1.385C56.824,38.964,56.249,38.974,55.88,39.342z    "/>   <path fill="#FFFFFF" d="M62.068,34.03c-0.189,0.191-0.283,0.44-0.286,0.689l0.981-0.982C62.511,33.741,62.26,33.837,62.068,34.03z"    />   <path fill="#FFFFFF" d="M62.06,64.625c-0.385,0.396-0.375,1.029,0.021,1.414c0.192,0.188,0.443,0.282,0.694,0.282    c0.263,0,0.522-0.103,0.72-0.305c10.728-11.057,6.791-21.938,3.22-27.723l-1.401,1.401C68.548,45.015,71.756,54.63,62.06,64.625z"    />   <path fill="#FFFFFF" d="M67.921,69.065c-0.385,0.396-0.375,1.028,0.021,1.414c0.194,0.187,0.445,0.28,0.696,0.28    c0.26,0,0.521-0.1,0.719-0.303c15.146-15.612,7.416-30.945,2.718-37.522l-1.388,1.388C75.15,40.513,82.071,54.48,67.921,69.065z"/>   <path fill="#FFFFFF" d="M80.402,18.845c-0.385,0-0.771,0.147-1.066,0.441L18.422,80.201c-0.589,0.59-0.589,1.543,0,2.133    c0.294,0.293,0.68,0.441,1.066,0.441c0.386,0,0.772-0.148,1.066-0.441l60.913-60.915c0.59-0.588,0.59-1.544,0-2.132    C81.175,18.992,80.789,18.845,80.402,18.845z"/>  </g>  </svg>',
                    screen: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.5 99.498" enable-background="new 0 0 99.5 99.498" xml:space="preserve">  <path fill="#C12337" d="M49.749,99.498C22.317,99.498,0,77.181,0,49.749C0,22.318,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.181,77.182,99.498,49.749,99.498z"/>  <g>   <path fill="#FFFFFF" d="M22.158,28.781c-1.204,0-2.172,0.969-2.172,2.173v35.339c0,1.204,0.969,2.173,2.172,2.173h20.857v6.674    h-2.366c-0.438,0-0.79,0.353-0.79,0.789c0,0.438,0.353,0.79,0.79,0.79h18.203c0.438,0,0.789-0.352,0.789-0.79    c0-0.438-0.353-0.789-0.789-0.789h-2.366v-6.674h20.855c1.203,0,2.173-0.969,2.173-2.173V30.954c0-1.204-0.97-2.173-2.173-2.173    H22.158z M22.751,31.47h53.997v34.081H22.751V31.47z"/>   <polygon fill="#F6F4EC" points="42.159,38.611 42.159,59.573 59.137,49.771  "/>  </g>  </svg>',
                    disabledScreen: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.499 99.498" enable-background="new 0 0 99.499 99.498" xml:space="preserve">  <path fill="#8C8C8C" d="M49.749,99.498C22.317,99.498,0,77.18,0,49.749S22.317,0,49.749,0s49.75,22.317,49.75,49.749   S77.182,99.498,49.749,99.498z"/>  <g>   <path fill="#FFFFFF" d="M77,31v35H38.234l-1.984,2H43v7h-2.352c-0.438,0-0.79,0.563-0.79,1s0.353,1,0.79,1h18.203    c0.438,0,0.789-0.563,0.789-1s-0.352-1-0.789-1H56v-7h21.341C78.545,68,80,67.497,80,66.293V30.954C80,29.75,78.545,29,77.341,29    h-2.337l-2.02,2H77z"/>   <path fill="#FFFFFF" d="M23,66V31h42.244l2.146-2H22.158C20.954,29,20,29.75,20,30.954v35.339C20,67.497,20.954,68,22.158,68h6.091    l2.11-2H23z"/>   <polygon fill="#FFFFFF" points="42,54.557 51.621,44.936 42,38.611  "/>   <polygon fill="#FFFFFF" points="56.046,47.74 47.016,56.769 59.137,49.771  "/>   <path fill="#FFFFFF" d="M81.061,21.311c0.586-0.585,0.586-1.536,0-2.121C80.768,18.896,80.384,18.75,80,18.75    s-0.768,0.146-1.061,0.439L18.33,79.799c-0.586,0.586-0.586,1.535,0,2.121c0.293,0.293,0.677,0.439,1.061,0.439    s0.768-0.146,1.061-0.439L81.061,21.311z"/>  </g>  </svg>',
                    locDisabledCamera: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 100 99.999" enable-background="new -0.165 -0.245 100 99.999"    xml:space="preserve">  <path fill="#8C8C8C" d="M49.834-0.245c-27.569,0-50,22.43-50,50c0,27.57,22.429,49.999,50,49.999c27.57,0,50-22.429,50-49.999   C99.835,22.186,77.404-0.245,49.834-0.245z M25.516,37.254h29.489L34.73,60.791h-9.214V37.254z M24.492,75.004l47.98-55.722   l3.046,2.623L27.538,77.627L24.492,75.004z M77.71,61.244l-15.599-9.006v8.553H44.016l18.096-21.006v6.309l15.599-9.006V61.244z"/>  </svg>',
                    locDisabledMic: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 100 99.999" enable-background="new -0.165 -0.245 100 99.999"    xml:space="preserve">  <path fill="#8C8C8C" d="M49.834-0.245c-27.569,0-50,22.43-50,50c0,27.57,22.429,49.999,50,49.999c27.57,0,50-22.429,50-49.999   C99.835,22.186,77.404-0.245,49.834-0.245z M41.411,32.236c0.001-4.678,3.794-8.473,8.473-8.473c4.681,0,8.472,3.793,8.472,8.473   v0.502L41.421,52.4c-0.001-0.068-0.01-0.135-0.01-0.203V32.236z M35.376,42.216h3.379v10.177c0,0.934,0.127,1.836,0.345,2.703   l-2.616,3.037c-0.708-1.713-1.107-3.58-1.107-5.535V42.216z M64.392,52.598c0,7.357-5.51,13.551-12.818,14.408v5.436h6.783v3.381   H41.411v-3.381h6.783v-5.436c-2.8-0.328-5.331-1.443-7.394-3.105l2.317-2.688c1.875,1.441,4.217,2.309,6.767,2.309   c6.146,0,11.127-4.984,11.127-11.129V42.216h3.381V52.598z M44.954,59.078l13.403-15.56v8.677c0,4.68-3.793,8.475-8.473,8.475   C48.042,60.67,46.344,60.076,44.954,59.078z M27.421,77.139l-3.046-2.623l47.979-55.723l3.046,2.623L27.421,77.139z"/>  </svg>',
                }

                function addItem(roomParticipant) {
                    console.log('roomParticipant.identity', roomParticipant.identity)
                    try {
                        var err = (new Error);
                        console.log(err.stack);
                    } catch (e) {

                    }
                    var isLocal = roomParticipant == localParticipant;
                    var participantItem = document.createElement('LI');
                    var tracksControlBtns = document.createElement('DIV');
                    tracksControlBtns.className = 'webrtc_tool_tracks-control';
                    var muteVideoBtn = document.createElement('DIV');
                    muteVideoBtn.className = 'webrtc_tool_mute-video-btn' + (isLocal ? ' webrtc_tool_isLocal' : '');
                    muteVideoBtn.innerHTML = listIcons.screen;

                    var muteAudioBtn = document.createElement('DIV');
                    muteAudioBtn.className = 'webrtc_tool_mute-audio-btn' + (isLocal ? ' webrtc_tool_isLocal' : '');
                    muteAudioBtn.innerHTML = isLocal ? '' : listIcons.loudSpeaker;
                    var participantIdentity = document.createElement('DIV');
                    participantIdentity.className = 'webrtc_tool_participants-identity';
                    var participantIdentityText = document.createElement('SPAN')
                    participantIdentityText.innerHTML = isLocal ? roomParticipant.identity + ' <span style="font-weight: normal;font-style: italic;">(me)</span>' : roomParticipant.identity;

                    participantItem.appendChild(tracksControlBtns);
                    tracksControlBtns.appendChild(muteVideoBtn);
                    tracksControlBtns.appendChild(muteAudioBtn);
                    participantItem.appendChild(tracksControlBtns);
                    participantIdentity.appendChild(participantIdentityText)
                    participantItem.appendChild(participantIdentity)

                    tool.participantListEl.appendChild(participantItem);

                    var listItem = new ListItem();
                    listItem.participant = roomParticipant;
                    listItem.listElement = participantItem;
                    listItem.videoBtnEl = muteVideoBtn;
                    listItem.audioBtnEl = muteAudioBtn;
                    tool.participantsList.push(listItem);

                    muteAudioBtn.addEventListener('click', function (e) {
                        listItem.toggleAudio();
                    });
                    muteVideoBtn.addEventListener('click', function (e) {
                        listItem.toggleVideo();
                    });

                }

                function toggleLocalVideo() {
                    if(tool.participantsList == null) return;

                    console.log('toggleLocalVideo',tool.participantsList);
                    var i, listItem;
                    for (i = 0; listItem = tool.participantsList[i]; i++){
                        if(listItem.participant == localParticipant) {
                            if(WebRTCconference.conferenceControl.cameraIsEnabled()){
                                listItem.videoBtnEl.innerHTML = listIcons.screen;
                                listItem.isVideoMuted = false;
                            } else {
                                listItem.videoBtnEl.innerHTML = listIcons.disabledScreen;
                                listItem.isVideoMuted = true;
                            }
                            break;
                        }
                    }
                }

                function removeItem(participant) {
                    var item = tool.participantsList.filter(function (listItem) {
                        return listItem.participant.sid == participant.sid;
                    })[0];
                    item.remove();
                }

                function createList() {
                    //var tool = this;
                    // if(!_isMobile) return;
                    if(tool.participantsList == null) tool.participantsList = [];
                    var participantsListCon = document.createElement('DIV');
                    participantsListCon.className = 'webrtc_tool_popup-participants-list webrtc_tool_popup-box';

                    tool.participantListEl = document.createElement('UL');
                    tool.participantListEl.className = 'webrtc_tool_participants-list';
                    addItem(localParticipant);
                    roomParticipants = WebRTCconference.roomParticipants();
                    for(var i in roomParticipants) {
                        if(roomParticipants[i] == localParticipant) continue;
                        addItem(roomParticipants[i]);
                    }
                    participantsListCon.appendChild(tool.participantListEl)

                    if(!Q.info.isMobile) {
                        tool.usersBtn.parentNode.appendChild(participantsListCon);
                    } else {
                        /*var container = tool.usersBtn.parentNode
                        container.insertBefore(participantsListCon, tool.usersBtn);*/
                    }
                    //tool.participantsList = tool.participantsList;


                    if(Q.info.isMobile) {

                        tool.usersBtn.addEventListener('touchend', function (e) {
                            //tool.usersBtn.parentNode.classList.toggle('webrtc_tool_hover');
                            Q.Dialogs.push({
                                title: "Participants",
                                className: 'webrtc_tool_participants-list',
                                content: tool.participantListEl
                            });
                        });

                    } else {
                        tool.usersBtn.addEventListener('mouseenter', function (e) {
                            if (tool.hoverTimeout.participantsPopup != null) {
                                clearTimeout(tool.hoverTimeout.participantsPopup);
                                tool.hoverTimeout.participantsPopup = null;
                            }
                            tool.usersBtn.parentNode.classList.add('webrtc_tool_hover');
                        });
                        tool.usersBtn.parentNode.addEventListener('mouseleave', function (e) {
                            console.log('usersBtn mouseleave', e.target)
                            tool.hoverTimeout.participantsPopup = setTimeout(function () {
                                tool.usersBtn.parentNode.classList.remove('webrtc_tool_hover');
                            }, 300)
                        });

                        participantsListCon.addEventListener('mouseenter', function (e) {
                            console.log('usersBtn CANCEL', e.target)

                            if (tool.hoverTimeout.participantsPopup != null) {
                                clearTimeout(tool.hoverTimeout.participantsPopup);
                                tool.hoverTimeout.participantsPopup = null;
                            }
                        })
                        participantsListCon.addEventListener('mouseleave', function (e) {
                            setTimeout(function () {
                                tool.usersBtn.parentNode.classList.remove('webrtc_tool_hover');
                            }, 300)

                        });
                    }
                }

                return {
                    createList:createList,
                    toggleLocalVideo:toggleLocalVideo,
                    addItem:addItem,
                    removeItem:removeItem,
                }
            },
        }

    );

})(window.jQuery, window);
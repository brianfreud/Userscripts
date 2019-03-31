// ==UserScript==
/* globals         ß, $ */
/* jshint          expr: true */
// @name           MusicBrainz: Script identifier
// @description    Identify the script of tracklist characters.  Guess/set the script on any import which uses murdos' importer code.
// @version        2019.3.31.1
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/MB_ScriptIdentifier.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/MB_ScriptIdentifier.user.js
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @include        *
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_scripts.js
// ==/UserScript==

ß.getTextImporter = () => {
    'use strict';
    let rawtext = [];
    $('.musicbrainz_import > input[name^="mediums."]').filter('[name$=".name"]').each(function() {
        rawtext.push(this.value);
    });
    return rawtext.join('');
};

ß.getTextViewRelease = () => {
    'use strict';
    var text = [];
    $('.even, .odd').each(function() {
        text.push($(this).find('td:eq(1)').text().trim());
    });
    return text.join('');
};

ß.getTextEditRelease = () => {
    'use strict';
    var text = [];
    $('.track-name').each(function() {
        text.push($(this).val().trim());
    });
    return text.join('');
};

ß.matchScripts = (text) => {
    'use strict';
    let list = [];
    for (let script of ß.scripts) {
        let matches = text.match(new RegExp(`\\p{Script=${script.code}}`, 'ug'));
        !matches || list.push([script.code, matches]);
    }
    return list;
};

ß.startNonMB = () => {
    'use strict';
    $('body').on('submit', function() {
        const list = ß.matchScripts(ß.getTextImporter());
        const script = list.sort((a, b) => b[1].length - a[1].length)[0][0];
        $('.musicbrainz_import > input[name="script"]').remove();
        $('.musicbrainz_import').append(`<input type="hidden" value="${script}" name="script">`);
    });
};

ß.startMB = () => {
    'use strict';
    let template = `
<aside id="script-id-info">
    <table>
        <caption style="white-space:nowrap;"><h2>Script(s) in track titles:</h2></caption>
        <thead>
            <tr>
                <th style="text-align:center;">Chars</th>
                <th style="text-align: left;">Script</th>
            </tr>
        </thead>
        <tbody id="script-id-info-list">
        </tbody>
    </table>
</aside>`;

    if (document.URL.split('/')[3] === 'release') {
        const generateScriptList = (list) => {
            list = ß.matchScripts(list);
            let scriptList = list.sort((a, b) => b[1].length - a[1].length)
                .map(a => `<tr><td style="text-align:center;">${a[1].length}</td><td>${ß.scripts.filter(x => x.code == a[0])[0].name}</td></tr>`);
            $('#script-id-info-list').empty().append(scriptList);
        };

        if (document.URL.match(/(.+\/edit)|(\/add)/)) { // release editor page
            $('.half-width:first').prepend($(template).css({
                border: '2px dashed mediumslateblue',
                padding: '0 1em 2em 1em',
                borderRadius: '5px',
                margin: '5px -6px',
                right: 0,
                position: 'absolute'
            }));

            $('.advanced-disc').on('change', '.track-name', () => {
                generateScriptList(ß.getTextEditRelease());
            });

            if (document.URL.match(/(.+\/edit)/)) {
                let runCount = () => {
                        if ($('.track-name').length > 0) {
                            generateScriptList(ß.getTextEditRelease());
                            clearInterval(checker);
                        }
                    },
                    checker = setInterval(runCount, 100);
            }
        } else if (document.URL.split('/').length === 5) { // main release page
            $('.properties:eq(1)').after(template);
            generateScriptList(ß.getTextViewRelease());
        }
    }
};

document.URL.split('/')[2] === 'musicbrainz.org' ? ß.startMB() : ß.startNonMB();

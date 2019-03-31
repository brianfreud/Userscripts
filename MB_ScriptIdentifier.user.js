// ==UserScript==
/* globals         ß, $ */
/* jshint          expr: true */
// @name           MusicBrainz: Script identifier
// @description    Identify the script of tracklist characters.  Guess/set the script on any import which uses murdos' importer code.
// @version        2019.3.31.0
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
<div id="script-id-info" style="border: 2px dashed mediumslateblue;padding: 6px;border-radius: 5px;margin: 5px -6px;">
    <table style="width:90%;font-size:110%;">
        <caption style="text-align:left;padding-left:1em;white-space:nowrap;"><h2>Script(s) in use on release:</h2></caption>
        <thead>
            <tr>
                <th style="text-align:center;">Chars</th>
                <th style="text-align: left;">Script</th>
            </tr>
        </thead>
        <tbody id="script-id-info-list">
        </tbody>
    </table>
</div>`;

    if (document.URL.split('/')[3] === 'release') {
        if (document.URL.match(/(.+\/edit)|(\/add)/)) { // release editor page
            $('.half-width:first').prepend($(template).css({ right: 0, position: 'absolute' }));
        } else if (document.URL.split('/').length === 5) { // main release page
            $('.properties:eq(1)').after(template);
            const list = ß.matchScripts(ß.getTextViewRelease());
            let scriptList = list.sort((a, b) => b[1].length - a[1].length)
                .map(a => `<tr><td style="text-align:center;">>${a[1].length}</td><td>${a[0]}</td></tr>`);
            $('#script-id-info-list').append(scriptList);
        }
    }
};

{
    (document.URL.split('/')[2] === 'musicbrainz.org') ? ß.startMB: ß.startNonMB;
}

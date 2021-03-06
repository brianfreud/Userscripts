// ==UserScript==
/* globals         MBImport, $, ß */
// @name           Import SakuraNotes release listings to MusicBrainz
// @description    Add a button to import SakuraNotes release listings to MusicBrainz
// @version        2019.3.21.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/SakuraNotes_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/SakuraNotes_importer.user.js
// @include        http*://www.sakuranotes.jp/Disc*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        http://creativecouple.github.io/jquery-timing/jquery-timing.js?v=20141012-210756
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.buildImportTools('ctl00_body_');

Object.assign(ß.data, {
    artistList: new Set(),
    catNum: ß.getIDText("DiscNoLabel"),
    label: ß.getIDText("LabelLink"),
    releaseArtist: ["various_artists"],
    releaseName: ß.toTitleCase(ß.getIDText("DiscNameLabel")),
    lookupsAllRequested: false,
    remaining: 0,
    tracks: [],
    url: document.location.href
});

$('#btn-promotion').after($('<div class="btn" id="importWorking">Working...<span id="importCounter"">all</span> remaining</div>'));

var $rows = $('.table').find('tr:gt(0)');
$rows.each($).wait(100, function() { // Process track rows, try to avoid flooding the server with requests
    if ($rows.length !== parseInt($('.table').find('tr:last').find('td:eq(1)').text().match(/\d+/)[0], 10)) {
        $('#importWorking').text('Likely not a complete release listing.');
    } else {
        const $nodes = ß.$getTDs(this),
            trackNum = ß.getTDText($nodes, 1).match(/^\d+/)[0],
            getData = (data) => {
                let artistArr = [];
                $(data).find('.table')
                    .find('tr:first td>a')
                    .map(function() {
                        artistArr.push($(this).text());
                    });
                artistArr = artistArr.map(name => ß.unSortname(name.toLowerCase()));
                ß.data.artistList.add(artistArr.map(a => ß.toTitleCase(a)).join('&'));
                ß.data.tracks[trackNum][3] = artistArr;

                $('#importCounter').text(--ß.data.remaining);
                if (ß.data.tracks.length === $rows.length + 1) {
                    ß.data.lookupsAllRequested = true;
                }

                if (ß.data.lookupsAllRequested && ß.data.remaining === 0) { // Check if all async actions have been requested and completed
                    if (ß.data.artistList.size === 1) { // If only one artist for release's tracks,
                        ß.data.releaseArtist = artistArr.map(a => ß.toTitleCase(a)); // set them as release artist.
                    }

                    const releaseObj = ß.buildReleaseObject('Digital Media');
                    const edit_note = MBImport.makeEditNote(ß.data.url, 'SakuraNotes', '', 'https://github.com/brianfreud/Userscripts/');

                    var parameters = MBImport.buildFormParameters(releaseObj, edit_note);
                    $('#btn-promotion').after($(MBImport.buildFormHTML(parameters)).addClass('btn'));
                    $('#importWorking').remove();
                }
            };

        ß.data.tracks[trackNum] = [
            'https://www.sakuranotes.jp' + $nodes.eq(2).find('a').attr('href').substr(1),
            trackNum,
            ß.toTitleCase(ß.getTDText($nodes, 2)), // Track title
            "unknown", // Default track artist
            ß.getTDText($nodes, 1).match(/\((\d\d\:\d\d)\)/)[1] // Track duration
        ];

        $('#importCounter').text(++ß.data.remaining);
        const doIt = function() {
            $.ajax({
                url: ß.data.tracks[trackNum][0],
                error: doIt,
                success: getData
            });
        };
        doIt();
    }
});

// ==UserScript==
/* globals         MBImport, $, buildReleaseObject */
// @name           Import SakuraNotes release listings to MusicBrainz
// @description    Add a button to import SakuraNotes release listings to MusicBrainz
// @version        2019.3.18.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/SakuraNotes_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/SakuraNotes_importer.user.js
// @include        http*://www.sakuranotes.jp/Disc*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.buildImportTools('ctl00_body_');

ß.buildImportTools('MainContent_');

Object.assign(ß.data, {
    artistList: new Set(),
    catNum: ß.getIDText("DiscNoLabel"),
    label: ß.getIDText("LabelLink"),
    releaseArtist: "various_artists",
    releaseName: ß.toTitleCase(ß.getIDText("DiscNameLabel")),
    remaining: 0,
    tracks: [],
    url: document.location.href
});

$('.table')
.find('tr:gt(0)')
.each(function() { // Process track rows
    const $nodes = ß.$getTDs(this);

    ß.data.tracks[ß.getTDText($nodes, 1)] = [
        'https://www.sakuranotes.jp/' + $nodes.eq(2).find('a').attr('href'),
        ß.getTDText($nodes, 1).match(/^\d+/)[0], // Track number
        ß.toTitleCase(ß.getTDText($nodes, 2)), // Track title
        "unknown", // Default track artist
        ß.getTDText($nodes, 1).match(/\((\d\d\:\d\d)\)/)[1] // Track duration
    ];
    ß.data.remaining++;

    $.get(ß.data.tracks[ß.getTDText($nodes, 1)][0], function(data) {
        const artist = $(data).find("#MainContent_lblComposer").text();

        ß.data.tracks[ß.getTDText($nodes, 1)][3] = artist;
        ß.data.artistList.add(artist);
        ß.data.remaining--;
        if (ß.data.remaining === 0) { // Check if all async actions have completed
            if (ß.data.artistList.size === 1) { // If only one artist for release's tracks,
                ß.data.releaseArtist = [...ß.data.artistList][0]; // set them as release artist.
            }
            const releaseObj = ß.buildReleaseObject();
            const edit_note = MBImport.makeEditNote(ß.data.url, 'Arcadia', '', 'https://github.com/brianfreud/Userscripts/');
console.dir(releaseObj);
            var parameters = MBImport.buildFormParameters(releaseObj, edit_note);
            $('.fancybox').after('<br><br>' + MBImport.buildFormHTML(parameters));
        }
    });
});

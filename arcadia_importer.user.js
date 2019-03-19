// ==UserScript==
/* globals         MBImport, $, ß */
// @name           Import Arcadia releases to MusicBrainz
// @description    Add a button to import Arcadia releases to MusicBrainz
// @version        2019.3.18.2
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/arcadia_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/arcadia_importer.user.js
// @include        http*://usa.arcadiamusic.com/music/album/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.buildImportTools('MainContent_');

Object.assign(ß.data, {
    artistList: new Set(),
    catNum: ß.getIDText("lblCdNo"),
    label: ß.getIDText("lbLibrary"),
    releaseArtist: "various_artists",
    releaseName: ß.getIDText("lblAlbumTitle"),
    remaining: 0,
    tracks: [],
    url: document.location.href
});

ß.$getID("gvTracks")
.find('tr:gt(0)')
.each(function() { // Process track rows
    const $nodes = ß.$getTDs(this);

    ß.data.tracks[ß.getTDText($nodes, 1)] = [
        'http://usa.arcadiamusic.com' + $nodes.eq(0).find('a').attr('href'),
        ß.getTDText($nodes, 1), // Track number
        ß.getTDText($nodes, 2), // Track title
        "unknown", // Default track artist
        ß.getTDText($nodes, 3) // Track duration
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
            var parameters = MBImport.buildFormParameters(releaseObj, edit_note);
            $('.fancybox').after('<br><br>' + MBImport.buildFormHTML(parameters));
        }
    });
});

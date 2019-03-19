// ==UserScript==
/* globals         MBImport, $, buildReleaseObject */
// @name           Import Arcadia releases to MusicBrainz
// @description    Add a button to import Arcadia releases to MusicBrainz
// @version        2019.3.18.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/arcadia_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/arcadia_importer.user.js
// @include        http*://usa.arcadiamusic.com/music/album/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

const $getID = (str) => $("#MainContent_" + str),
    getIDText = (str) => $getID(str).text(),
    $getTDs = (node) => $(node).find('td'),
    getTDText = ($nodes, i) => $.trim($nodes.eq(i).text());

const rI = {
    releaseName: getIDText("lblAlbumTitle"),
    catNum: getIDText("lblCdNo"),
    label: getIDText("lbLibrary"),
    tracks: [],
    url: document.location.href,
    releaseArtist: "various_artists",
    remainingLookups: 0,
    releaseArtistList: new Set()
};

$getID("gvTracks").find('tr:gt(0)').each(function() { // Process track rows
    const $nodes = $getTDs(this);

    rI.tracks[getTDText($nodes, 1)] = [
        'http://usa.arcadiamusic.com' + $nodes.eq(0).find('a').attr('href'),
        getTDText($nodes, 1), // Track number
        getTDText($nodes, 2), // Track title
        "unknown", // Default track artist
        getTDText($nodes, 3) // Track duration
    ];
    rI.remainingLookups++;

    $.get(rI.tracks[getTDText($nodes, 1)][0], function(data) {
        const artist = $(data).find("#MainContent_lblComposer").text();

        rI.tracks[getTDText($nodes, 1)][3] = artist;
        rI.releaseArtistList.add(artist);
        rI.remainingLookups--;
        if (rI.remainingLookups === 0) { // Check if all async actions have completed
            if (rI.releaseArtistList.size === 1) { // If only one artist for release's tracks,
                rI.releaseArtist = [...rI.releaseArtistList][0]; // set them as release artist.
            }
            const releaseObj = buildReleaseObject(rI);
            const edit_note = MBImport.makeEditNote(rI.url, 'Arcadia', '', 'https://github.com/brianfreud/Userscripts/');
            var parameters = MBImport.buildFormParameters(releaseObj, edit_note);
            $('.fancybox').after('<br><br>' + MBImport.buildFormHTML(parameters));
        }
    });
});

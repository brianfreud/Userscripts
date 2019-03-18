// ==UserScript==
/* globals artistDB, labelDB */
// @name           Import Arcadia releases to MusicBrainz
// @description    Add a button to import Arcadia releases to MusicBrainz
// @version        2019.3.17.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/arcadia_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/arcadia_importer.user.js
// @include        http*://*.arcadiamusic.com/music/album/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/brianfreud/musicbrainz-userscripts/friendlier-makeEditNote/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

const $getID = (str) => $("#MainContent_" + str),
    getIDText = (str) => $getID(str).text(),
    $getTDs = (node) => $(node).find('td'),
    getTDText = ($nodes, i) => $.trim($nodes.eq(i).text());

const rI = {
    albumName: getIDText("lblAlbumTitle"),
    catNum: getIDText("lblCdNo"),
    label: getIDText("lbLibrary"),
    tracks: [],
    url: document.location.href,
    releaseArtist: "various_artists",
    remainingLookups: 0,
    releaseArtistList: new Set()
};

const makeArtistCredit = function(artistName) {
    // TODO: Find a release with multiple artists on a track / handle multiple artist credits

    const makeCredit = function(name) {
        return {
            credited_name: name,
            artist_name: name,
            artist_mbid: name in artistDB ? artistDB[name] : '',
            joinphrase: ''
        };
    };

    return [makeCredit(artistName)];
};

const makeLabelCredit = function() {
    const label = getIDText("lbLibrary");
    return [{
        catno: getIDText("lblCdNo"),
        mbid: label in labelDB ? labelDB[label] : '',
        name: label
    }];
};

const buildTracklistArray = function() {
    let trackArray = [];

    rI.tracks = [...new Set(rI.tracks)];

    for (let track of rI.tracks) {
        if (track !== undefined) {
            trackArray.push({
                number: track[1],
                title: track[2],
                duration: track[4],
                artist_credit: makeArtistCredit(track[3])
            });
        }
    }
    return trackArray;
};

const buildReleaseObject = function() {
    return {
        title: rI.albumName,
        artist_credit: makeArtistCredit(rI.releaseArtist),
        type: 'album',
        status: 'official',
        language: 'eng',
        script: 'Latn',
        labels: makeLabelCredit(rI.label),
        urls: [{
            url: rI.url,
            link_type: 288
        }],
        discs: [{
            tracks: buildTracklistArray()
        }, ]
    };
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
            console.log("ready");
            if (rI.releaseArtistList.size === 1) { // If only one artist for release's tracks,
                rI.releaseArtist = [...rI.releaseArtistList][0]; // set them as release artist.
            }
            const releaseObj = buildReleaseObject();
            
            console.log(MBImport.makeEditNote(rI.url, 'Arcadia','','https://github.com/brianfreud/Userscripts/')); //test
            console.log(MBImport.buildFormHTML(releaseObj)); //test
        }
    });
});

// ==UserScript==
/* global          MBImport, ß, $, showAlbum:true */
/* eslint-env      jquery */
// @name           Import HarvestMedia release listings to MusicBrainz
// @description    Add a button to import HarvestMedia release listings to MusicBrainz
// @version        2019.3.31.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/HarvestMedia_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/HarvestMedia_importer.user.js
// @include        http://live.harvestmedia.net/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.scrapeRelease = (args) => {
    'use strict';
    let $album = $(`.ListTextAlbum[onclick="showAlbum('${args}');"]`),
        heading = $album.text(),
        catNum = heading.match(/[A-Z\d]+/),
        albumKey = $album.attr('onclick').match(/'(.+)'/)[1];

    Object.assign(ß.data, {
        artistList: new Set(),
        catNum,
        label: $album.parents('tr[id^="tr_LibraryAlbums_"]').prev().text().match(/^([\w\s\-]+)/)[1].trim(),
        releaseArtist: ["various_artists"],
        lookupsAllRequested: false,
        remaining: 0,
        tracks: [],
        url: `http://live.harvestmedia.net/content/album.aspx?acctid=b611c9e6c44bc5db&macctid=b7d93eaebad5d9ec&collectionid=${albumKey}`,
        totalTracks: 0
    });
};

ß.finishAddProcess = () => {
    'use strict';
    const releaseObj = ß.buildReleaseObject('Digital Media'),
        edit_note = MBImport.makeEditNote(ß.data.url, 'HarvestMedia', '', 'https://github.com/brianfreud/Userscripts/') + ' via http://live.harvestmedia.net/player.aspx?acctid=b611c9e6c44bc5db',
        parameters = MBImport.buildFormParameters(releaseObj, edit_note);
    document.getElementsByClassName('SearchMainLabel')[0].innerHTML = MBImport.buildFormHTML(parameters);
};

ß.processTracks = (data) => {
    'use strict';
    let i = 0,
        $composers = $(data).find('input[name^="album_composer_"]'),
        cleanAndSplitArtists = (artistList) => {
            return artistList.replace(/\d+%/g, '')
                .replace(/\([A-Z]+\)/g, '')
                .replace(/\//g, ', ')
                .replace(/\[\d+\]/,'')
                .trim()
                .split(',')
                .map(artist => artist.trim());
        },
        setTrack = (idx, trackData) => {
            let $title = $(trackData).find('.TrackList_TrackTitle').text().replace(/^\s?\-\s?/,''),
                trackNum = $title.match(/^[\d\.]+/)[0];

            ß.data.tracks[trackNum] = [ // Set track info
                '', // Unused
                trackNum, // Track number
                $title.match(/\s(.+)/)[0], // Track title
                cleanAndSplitArtists($composers[i++].value), // track artist
                $(trackData).find('.TrackList_Duration').text() // Track duration
            ];
            ß.data.artistList.add(ß.data.tracks[trackNum][3]);
        };

    $(data).find('.TrackList_Row, .TrackList_AlternativeRow').each(setTrack);
    ß.data.releaseName = $(data).find('.TrackList_AlbumTitle:first').text().match(/\s(.+)/)[1];

    if (ß.data.artistList.size === 1) { // If only one artist for release's tracks,
        ß.data.releaseArtist = ß.data.artistList[0]; // set them as release artist.
    }

    ß.finishAddProcess();
};

var oldSA = showAlbum;
showAlbum = (args) => { // eslint-disable-line no-global-assign
    'use strict';
    ß.data = {};
    ß.scrapeRelease(args);
    $.get(ß.data.url, ß.processTracks);
    return oldSA.apply(this, [args]);
};

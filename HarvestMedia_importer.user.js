// ==UserScript==
/* globals         MBImport, $, ß */
// @name           Import HarvestMedia release listings to MusicBrainz
// @description    Add a button to import HarvestMedia release listings to MusicBrainz
// @version        2019.3.29.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/HarvestMedia_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/HarvestMedia_importer.user.js
// @include        http://live.harvestmedia.net/player.aspx*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.scrapeRelease = (data) => {
    let heading = $('.AlbumInfo_Heading:last').text(),
        catNum = heading.match(/[A-Z\d]+/),
        $album = $(`.ListTextAlbum:contains("${catNum}")`),
        albumKey = $album.attr('onclick').match(/'(.+)'/)[1];

    Object.assign(ß.data, {
        artistList: new Set(),
        catNum,
        label: $album.parents('tr[id^="tr_LibraryAlbums_"]').prev().text().match(/^([\w\s\-]+)/)[1].trim(),
        releaseArtist: ["various_artists"],
        releaseName: heading.split(/\s(?:\-\s)?(.+)/)[1],
        lookupsAllRequested: false,
        remaining: 0,
        tracks: [],
        url: `http://live.harvestmedia.net/content/album.aspx?acctid=b611c9e6c44bc5db&macctid=b7d93eaebad5d9ec&collectionid=${albumKey}`,
        totalTracks: 0
    });
};

ß.finishAddProcess = () => {
    const releaseObj = ß.buildReleaseObject('Digital Media'),
        edit_note = MBImport.makeEditNote(ß.data.url, 'FlipperMusic', '', 'https://github.com/brianfreud/Userscripts/'),
        parameters = MBImport.buildFormParameters(releaseObj, edit_note);

    $('#importWorking').empty().append($(MBImport.buildFormHTML(parameters)).addClass('btn'));
};

ß.processTracks = (data) => {
    let i = 0,
        $composers = $('input[name^="album_composer_"]'),
        setTrack = (trackData) => {
            let $title = $(trackData).find('.TrackList_TrackTitle').text(),
                trackNum = $title.match(/^[\d\.]+/)[0];

            ß.data.tracks[trackNum] = [ // Set track info
                '', // Unused
                trackNum, // Track number
                $title.match(/\s(.+)/)[0], // Track title
                $composers[i++].value.replace(/\d+%/g, '').replace(/\([A-Z]+\)/g, '').replace(/\//g, ', '), // track artist
                $(this).find('.TrackList_Duration').text() // Track duration
            ];
        };

    $('.TrackList_Row, .TrackList_AlternativeRow').each(setTrack);
    ß.finishAddProcess();
};

ß.scrapeRelease();
$.get(ß.data.url, ß.processTracks);

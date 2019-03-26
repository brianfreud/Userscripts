// ==UserScript==
/* globals         MBImport, $, ß */
// @name           Import ExtremeMusic release listings to MusicBrainz
// @description    Add a button to import ExtremeMusic release listings to MusicBrainz
// @version        2019.3.24.3
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/ExtremeMusic_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/ExtremeMusic_importer.user.js
// @include        https://www.extrememusic.com/albums/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

$.get(document.location.href, function(data) {
    let i = 0;
    const info = JSON.parse(data.match(/{\\"album\\".+</)[0].slice(0, -2).replace(/\\"/g, '"')),
        date = info.album.created.match(/(\d{4})\-(\d\d)\-(\d\d)/);

    Object.assign(ß.data, {
        artistList: new Set(),
        catNum: info.album.album_no,
        label: info.album.series_title,
        releaseArtist: ["various_artists"],
        releaseName: ß.toTitleCase(info.album.title),
        year: date[1],
        month: date[2],
        day: date[3],
        tracks: [],
        url: document.location.href,
        totalTracks: 0
    });

    info.tracks.forEach(track => {
        track.track_sound_ids.forEach(id => {
            let sound = info.track_sounds.filter(sound => sound.id === id)[0],
                noAltVer = !(track.track_sound_ids.length - 1),
                trackTitle = noAltVer ? track.title : `${sound.title} (${sound.version_type})`;
            ß.data.tracks[++i] = [
                track.track_sound_ids,
                sound.track_sound_no.split('_').slice(1).join('.'), // Track number
                ß.toTitleCase(trackTitle), // Track title
                track.composers.map(composer => composer.name), // Track artists
                ß.formatSeconds(sound.duration)
            ];
        });
        ß.data.artistList.add(ß.data.tracks[i][3].join('&'));
    });

    if (ß.data.artistList.size === 1) { // If only one artist for release's tracks:
        ß.data.releaseArtist = ß.data.tracks[1][3];
    }

    const releaseObj = ß.buildReleaseObject('Digital Media'),
        edit_note = MBImport.makeEditNote(ß.data.url, 'ExtremeMusic', '', 'https://github.com/brianfreud/Userscripts/'),
        parameters = MBImport.buildFormParameters(releaseObj, edit_note),
        mbButton = `<div style="background:lightgrey;border-radius:4px;cursor:pointer;margin-top:1em;padding:4px;width:8em;">${MBImport.buildFormHTML(parameters)}</div>`;
    $('.tracklist-header__info:first').append($(mbButton));
});

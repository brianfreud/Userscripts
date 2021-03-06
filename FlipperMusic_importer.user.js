// ==UserScript==
/* globals         MBImport, $, ß */
// @name           Import FlipperMusic release listings to MusicBrainz
// @description    Add a button to import FlipperMusic release listings to MusicBrainz
// @version        2019.4.11.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/FlipperMusic_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/FlipperMusic_importer.user.js
// @include        https://www.flippermusic.it/album/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.data.fM_ID = document.URL.match(/\d+/)[0];

ß.processRelease = (data) => {
    let rel = data.descCD;
    const labelLookup = rel.cd_cod.match(/^[A-Z\-]+/);
    let label = ß.labelDB.filter(p => p.prefix == labelLookup[0]);
    // If the prefix is in the label db, use that label.  Otherwise use the listed label's name.
    label = !label.length ? rel.ca_descrizione : label[0].name;

    Object.assign(ß.data, {
        artistList: new Set(),
        catNum: rel.cd_cod,
        label,
        releaseArtist: ["various_artists"],
        releaseName: rel.cd_titolo,
        lookupsAllRequested: false,
        remaining: 0,
        tracks: [],
        url: document.location.href,
        totalTracks: 0
    });

    const getTrack = (id) => { // Get artist info and info for the related alternate tracks
            $.ajax({
                dataType: "json",
                url: `https://www.flippermusic.it/wp-content/themes/Divi-child/query.php?op=infoSingoloBrano&indBR=1&idBR=${id}`,
                error: getTrack,
                success: processTrack
            });
        },

        setTrack = (info, parent) => {
            ß.data.tracks[info.br_traccia] = [ // Set track info
                info.br_id, // fM track ID number
                info.br_traccia, // Track number
                info.br_titolo, // Track title
                info.br_autori || "unknown", // track artist
                ß.formatSeconds(Math.round(parseFloat(info.br_durata_sec))) // Track duration
            ];

            if ('br_versione' in info) {
                ß.data.tracks[info.br_traccia][2] = (parent == info.br_versione) ? parent : `${parent} (${info.br_versione})`;
            }
        },

        processTrack = (data) => {
            $('#importCounter').text(--ß.data.remaining);

            // iterate over the alternate tracks
            for (let altTrack of data.tracce) {
                setTrack(altTrack, data.traccia.br_titolo);
            }

            //set artist for the main tracks
            let trackNum = ß.data.tracks.findIndex(x => x !== undefined && x[0] === data.traccia.br_ids);

            ß.data.tracks[trackNum][3] = data.traccia.br_autori;

            if (!--ß.data.remaining) {
                postProcessArtists();
                finishAddProcess();
            }
        },

        postProcessArtists = () => {
            let splitArtist = (artist) => {
                return artist.split(/\s[\-\/]\s/);
            };
            ß.data.tracks = ß.data.tracks.map(track => {
                ß.data.artistList.add(track[3]);
                return [track[0], track[1], track[2], ß.unSortnameArray(splitArtist(track[3])), track[4]];
            });
            if (ß.data.artistList.size === 1) { // If only one artist for release's tracks,
                ß.data.releaseArtist = ß.unSortnameArray(splitArtist(ß.data.artistList.entries().next().value[0]));
            }
        },

        finishAddProcess = () => {
            const releaseObj = ß.buildReleaseObject('Digital Media'),
                edit_note = MBImport.makeEditNote(ß.data.url, 'FlipperMusic', '', 'https://github.com/brianfreud/Userscripts/'),
                parameters = MBImport.buildFormParameters(releaseObj, edit_note);

            $('#importWorking').empty().append($(MBImport.buildFormHTML(parameters)).addClass('btn'));
        };

    for (let track of data.tracce) {
        ß.data.totalTracks = ß.data.totalTracks + parseInt(track.br_num_alternative, 10);

        ß.data.remaining = ß.data.remaining + 2;
        $('#importCounter').text(ß.data.remaining);
        setTrack(track);
        getTrack(track.br_id);
    }
};


fetch(`https://www.flippermusic.it/wp-content/themes/Divi-child/query.php?op=listaTracceCDInfo&traccePerPagina=2000&pagina=1&idCD=${ß.data.fM_ID}`)
    .then(response => response.json())
    .then(data => {
        $('#importCounter').text(ß.data.remaining);

        $('#et-top-navigation').prepend($(`
			<div style="position: absolute;left: 25%;top: 44%;" id="importWorking">
			    Working...<span id="importCounter"">all</span> remaining
			</div>
		`));

        ß.processRelease(data);
    });

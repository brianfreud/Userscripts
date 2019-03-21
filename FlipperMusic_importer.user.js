// ==UserScript==
/* globals         MBImport, $, ß */
// @name           Import FlipperMusic release listings to MusicBrainz
// @description    Add a button to import FlipperMusic release listings to MusicBrainz
// @version        2019.3.21.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/FlipperMusic_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/FlipperMusic_importer.user.js
// @include        https://www.flippermusic.it/album/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        http://creativecouple.github.io/jquery-timing/jquery-timing.js?v=20141012-210756
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.data.fM_ID = document.URL.match(/\d+/)[0];

let processRelease = (data) => {
    let rel = data.descCD;

    Object.assign(ß.data, {
        artistList: new Set(),
        catNum: rel.cd_cod,
        label: rel.ca_descrizione,
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
          
        setTrack = (info, parentTitle) => {
            ß.data.tracks[info.br_traccia] = [ // Set track info
                info.br_id, // fM track ID number
                info.br_traccia, // Track number
                info.br_titolo, // Track title
                info.br_autori || "unknown", // track artist
                Math.round(parseFloat(info.br_durata_sec)) // Track duration
            ];

            if ('br_titolo_mod' in info) {

                if (parentTitle == info.br_versione) {
                    ß.data.tracks[info.br_traccia][2] = info.br_titolo_mod;
                } else {
                    ß.data.tracks[info.br_traccia][2] = `${parentTitle} (${info.br_versione})`;
                }
            }
        },
          
        processTrack = (data) => {
            $('#importCounter').text(--ß.data.remaining);

            // iterate over the alternate tracks
            for (let altTrack of data.tracce) {
                setTrack(altTrack, data.traccia.br_titolo);
            }

            //set artist for the main track
            let trackNum = ß.data.tracks.findIndex(x => x !== undefined && x[0] === data.traccia.br_ids),
                artistArr = data.traccia.br_autori.split(/\s[\-\/]\s/);

            ß.data.tracks[trackNum][3] = ß.unSortnameArray(splitArtist(artistArr));
        };

    for (let track of data.tracce) {
        ß.data.totalTracks = ß.data.totalTracks + parseInt(track.br_num_alternative, 10);
        setTrack(track);
        getTrack(track.br_id);
      
        if (ß.data.remaining === 0) console.dir(ß);
    }
};


$.getJSON(`https://www.flippermusic.it/wp-content/themes/Divi-child/query.php?` +
    `op=listaTracceCDInfo&traccePerPagina=2000&pagina=1&idCD=${ß.data.fM_ID}`,
    function(data) {
        ß.data.remaining = 2 * data.tracce.length;

        $('#importCounter').text(ß.data.remaining);

        processRelease(data);
    });

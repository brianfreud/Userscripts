// ==UserScript==
// @name           Import FlipperMusic release listings to MusicBrainz
// @description    Add a button to import FlipperMusic release listings to MusicBrainz
// @version        2019.4.26.1
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/FlipperMusic_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/FlipperMusic_importer.user.js
// @include        https://www.flippermusic.it/album/*
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
/* global          MBImport, ß */
/* eslint          array-bracket-newline: off */
/* eslint          array-element-newline: off */
/* eslint          brace-style: ["error", "stroustrup", { "allowSingleLine": true }] */
/* eslint          camelcase: off */
/* eslint          capitalized-comments: off */
/* eslint          dot-location: ["error", "property"] */
/* eslint-env      es6 */
/* eslint          id-length: off */
/* eslint          key-spacing: off */
/* eslint          line-comment-position: off */
/* eslint          max-len: off */
/* eslint          max-lines: off */
/* eslint          multiline-comment-style: off */
/* eslint          newline-per-chained-call: off */
/* eslint          no-confusing-arrow: off */
/* eslint          no-extra-parens: ["error", "all", { "nestedBinaryExpressions": false }] */
/* eslint          no-inline-comments: off */
/* eslint          no-invalid-this: off */
/* eslint          no-magic-numbers: off */
/* eslint          no-param-reassign: off */
/* eslint          no-plusplus: off */
/* eslint          no-return-assign: "error" */
/* eslint          no-ternary: off */
/* eslint          no-whitespace-before-property: off */
/* eslint          object-curly-spacing: off */
/* eslint          one-var: off */
/* eslint          padded-blocks: off */
/* eslint          prefer-destructuring: off */
/* eslint          prefer-named-capture-group: off */
/* eslint          prefer-reflect: off */
/* eslint          quote-props: ["error", "as-needed"] */
/* eslint          quotes: ["error", "backtick"] */
/* eslint          sort-keys: off */
/* eslint          sort-vars: off */
/* eslint          spaced-comment: off */
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    const baseQueryURL = `https://www.flippermusic.it/wp-content/themes/Divi-child/query.php?`;

    ß.data.fM_ID = document.URL.match(/\d+/u)[0];

    const scrapeTracks = async () => {
        const addTrack = (info, duration, title) => {
            ß.data.tracks.push({
                artist: ß.unSortnameSlashString(info.br_autori) || `unknown`,
                duration: ß.formatSeconds(Math.round(duration)),
                number: info.br_traccia || info.br_indice + 1,
                title
            });
        };

        for (const track of ß.data.rawData.tracce) {
            // We do actually want to only look up one track at a time, so as to not swamp the server
            // eslint-disable-next-line no-await-in-loop
            await fetch(`${baseQueryURL}op=infoSingoloBrano&indBR=1&idBR=${track.br_id}`)
                .then((response) => {
                    document.querySelector(`#importCounter`).innerText = --ß.data.tracksRemaining;

                    return Object.freeze(response.json());
                })
                .then((json) => {
                    addTrack(json.traccia, track.br_durata_sec, track.br_titolo);
                    json.tracce.forEach((altTrack) => {
                        addTrack(altTrack, altTrack.br_durata_sec, `${track.br_titolo} (${altTrack.br_versione.toLowerCase()})`);
                    });
                });
        }
    };

    const getReleaseInfo = async () => {
        await fetch(`${baseQueryURL}op=listaTracceCDInfo&traccePerPagina=2000&pagina=1&idCD=${ß.data.fM_ID}`)
            .then((response) => Object.freeze(response.json()))
            .then((json) => {
                const info = json.descCD;

                Object.assign(ß.data, {
                    catNum:info.cd_cod,
                    label: ß.getLabelFromPrefix(info.cd_cod.match(/^[A-Z-]+/u)[0], info.ca_descrizione),
                    rawData: json,
                    releaseName: info.cd_titolo,
                    tracks: [],
                    tracksRemaining: json.tracce.length,
                    url: document.location.href
                });
                ß.data.country = ß.getCountryForLabel(ß.data.label);
            });
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({ site: `FlipperMusic` }),
            mbButton = MBImport.buildFormHTML(parameters);

        document.querySelector(`#importWorking`).innerHTML = mbButton;
    };

    (async function loader () {
        document.querySelector(`#et-top-navigation`).insertAdjacentHTML(`beforeBegin`, `
            <div style="position: absolute;left: 25%;top: 44%;" id="importWorking">
                Working...  <span id="importCounter">All</span> remaining
            </div>
        `);
        await getReleaseInfo();
        await scrapeTracks();
        ß.sortTracks();
        ß.cleanTrackArtists();
        ß.lookupTrackArtists();
        ß.setReleaseArtist();
        makeImportButton();
    }());
}());

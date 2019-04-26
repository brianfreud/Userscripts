// ==UserScript==
// @name           Import Riptide Music Group release listings to MusicBrainz
// @description    Add a button to import Riptide Music Group release listings to MusicBrainz
// @version        2019.4.21.0
// @include        https://explore.riptidemusic.com/*
// @namespace      https://github.com/brianfreud
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
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/RiptideMusicGroup_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/RiptideMusicGroup_importer.user.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    if (!(/#!explorer\?b=/u).test(location.hash)) { // https://stackoverflow.com/questions/52446721
        return;
    }

    ß.data.albumID = document.location.href.match(/b=(\d+)/u)[1];
    ß.data.releaseInfoURL = `https://explore.riptidemusic.com/ajax.php?p=track_info&b=${ß.data.albumID}`;

    const scrapeTracks = async function scrapeTracks (data, mainNum = ``) {
        for (const [i, track] of data.content.entries()) {
            if (i > 0) { // They store the release info in [0], so don't handle it as a track
                ß.data.tracks.push({
                    artist: track.artist.name,
                    duration: ß.formatSeconds(track.actualLength),
                    number: `${mainNum}${i}`,
                    title: track.title
                });

                if (track.alternates.length) { // eslint-disable-next-line no-await-in-loop
                    await fetch(`${ß.data.releaseInfoURL}&showAll=1&alt=${track.id}`)
                        .then((response) => Object.freeze(response.json()))
                        .then((json) => {
                            scrapeTracks(json, `${i}.`);
                        });
                }
            }
        }
    };

    const getReleaseInfo = async () => {
        await fetch(ß.data.releaseInfoURL)
            .then((response) => Object.freeze(response.json()))
            .then((json) => {
                const albumData = json.content[0].album;

                Object.assign(ß.data, {
                    catNum: `RT ${albumData.catalog.id}`,
                    label: albumData.catalog.name,
                    releaseName: albumData.name,
                    tracks = [],
                    url: document.location.href,
                    rawJSON: json
                }, ß.convertUNIXDate(json.content[0].headingExtra.releaseDate));
            });
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({ site: `Riptide Music Group` }),
            mbButton = `<div style="position: absolute; right: 20%; top: 0px;">${MBImport.buildFormHTML(parameters)}</div>`;

        document.querySelector(`#heading > .options_menu_anchor`).insertAdjacentHTML(`beforebegin`, mbButton);
    };

    (async function loader () {
        await getReleaseInfo();
        await scrapeTracks(ß.data.rawJSON);
        ß.sortTracks();
        ß.cleanTrackArtists();
        ß.lookupTrackArtists();
        ß.setReleaseArtist();
        makeImportButton();
    }());
}());

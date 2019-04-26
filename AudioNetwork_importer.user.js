// ==UserScript==
// @name           Import Audio Network release listings to MusicBrainz
// @description    Add a button to import Audio Network release listings to MusicBrainz
// @version        2019.4.26.0
// @include        https://www.audionetwork.com/browse/m/album/*
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
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/AudioNetwork_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/AudioNetwork_importer.user.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    const scrapeTracks = async () => {
        await fetch(`${ß.data.relJSONurl}/tracks`, {
            headers: new Headers({
                'x-api-key': `TTqwdGFMje3EQ6QkzqnOC1KPSRGEQhfp9TLySucT`
            })
        })
            .then((response) => Object.freeze(response.json()))
            .then((json) => {
                const relDate = new Date(json[0].releaseDate);

                Object.assign(ß.data, {
                    day:relDate.getDate(),
                    month: relDate.getMonth() + 1,
                    year: relDate.getFullYear()
                });

                json.forEach((track) => {
                    ß.data.tracks.push({
                        artist: track.composers.map((composer) => composer.name),
                        duration: ß.formatSeconds(track.duration),
                        number: track.albumTrackNumber,
                        title: track.title
                    });
                });
            });
    };

    const getReleaseInfo = async () => {
        ß.data.relJSONurl = `https://musicapi.audionetwork.com/albums/${document.location.href.match(/\d+$/u)[0]}`;

        await fetch(ß.data.relJSONurl, {
            headers: new Headers({
                'x-api-key': `TTqwdGFMje3EQ6QkzqnOC1KPSRGEQhfp9TLySucT`
            })
        })
            .then((response) => Object.freeze(response.json()))
            .then((json) => {
                Object.assign(ß.data, {
                    catNum: `ANW ${json.number}`,
                    label: `Audio Network`,
                    releaseName: json.name,
                    totalTracks: json.trackCount,
                    tracks = [],
                    url: document.location.href
                });
            });
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({ site: `Audio Network` }),
            mbButton = MBImport.buildFormHTML(parameters);

        document.querySelector(`.header__nav-items--right`).insertAdjacentHTML(`beforeend`, `<div style="display: inline-block;">${mbButton}</div>`);

        // The site captures the button click, so we need to repair the button click functionality.
        const element = document.querySelector(`.musicbrainz_import`).querySelector(`button`);

        element.addEventListener(`click`, () => document.querySelector(`.musicbrainz_import`).submit(), false);
    };

    (async function loader () {
        await getReleaseInfo();
        await scrapeTracks();
        ß.sortTracks();
        ß.cleanTrackArtists();
        ß.lookupTrackArtists();
        ß.setReleaseArtist();
        makeImportButton();
    }());
}());

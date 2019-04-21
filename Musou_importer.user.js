// ==UserScript==
// @name           Import Musou release listings to MusicBrainz TEST
// @description    Add a button to import Musou release listings to MusicBrainz
// @version        2019.4.21.0
// @include        http://www.musou.gr/music/album/*
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
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/Musou_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/Musou_importer.user.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    const getTrackComposer = (el) => {
        const infoDTs = el.closest(`.track-line`)
            .querySelectorAll(`.expand-row dt`);

        return [...infoDTs].filter((dt) => dt.textContent === `Composers`)[0];
    };

    const scrapeMainTracks = () => {
        ß.data.tracks = ß.getTracks({
            trackSelector: `.parent .track-title`,
            trackParser: (el, numTitle = el.textContent.toLowerCase().match(/^\s*(\d+)\.\s(.+)/u).slice(1)) => ({
                number: numTitle[0],
                title: numTitle[1],
                artist: getTrackComposer(el).nextElementSibling.textContent, // artist
                duration: el.nextSibling.textContent // duration
            })
        });
    };

    const scrapeAltTracks = () => {
        ß.data.tracks = [...ß.data.tracks, ...ß.getTracks({
            trackSelector: `.other-versions > table > tbody > tr > td > p.track-container`,
            trackParser: (el, parent = el.parentNode, numTitle = parent.textContent.match(/^\s*(\d+)\.\s(.+)/u).slice(1)) => ({
                number: numTitle[0],
                title: `${numTitle[1]} (${parent.querySelector(`.comment`).textContent})`.toLowerCase(), // [number, title]
                artist: getTrackComposer(el).nextElementSibling.textContent, // artist
                duration: parent.querySelector(`.duration`).textContent //.remove(/^\s*00:/u) // duration
            })
        })];
    };

    const getReleaseInfo = () => {
        const dlData = {},
            dtList = document.querySelector(`.expand-row`).querySelectorAll(`dt`),
            ifPropExists = (prop) => prop in dlData
                ? dlData[prop]
                : ``;

        Array.from(dtList).map((dt) => (dlData[dt.textContent] = dt.nextElementSibling.textContent)); // eslint-disable-line no-extra-parens

        Object.assign(ß.data, {
            catNum: ifPropExists(`Album code`),
            label: ifPropExists(`Sub-label`).toLowerCase(),
            releaseName: ifPropExists(`Album`),
            url: document.location.href,
            year: ifPropExists(`Year`).match(/\d{4}/u)[0] // avoid issues with data like "2019;2019"
        });
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({ site: `Musou` }),
            mbButton = `<td style="width: 28%;text-align:right;color:black;">${MBImport.buildFormHTML(parameters)}</td>`;

        document.querySelector(`.description`).insertAdjacentHTML(`afterend`, mbButton);
    };

    getReleaseInfo();
    ß.data.tracks = [];
    scrapeMainTracks();
    scrapeAltTracks();
    ß.sortTracks();
    ß.setTotalTracks();
    ß.cleanTrackArtists();
    ß.lookupTrackArtists();
    ß.setReleaseArtist();
    makeImportButton();
}());

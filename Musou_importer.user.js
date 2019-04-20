// ==UserScript==
// @name           Import Musou release listings to MusicBrainz TEST
// @description    Add a button to import Musou release listings to MusicBrainz
// @version        2019.4.20.0
// @include        http://www.musou.gr/music/album/*
// @namespace      https://github.com/brianfreud
/* global          MBImport, ß, $ */
/* eslint          array-bracket-newline: off */
/* eslint          array-element-newline: off */
/* eslint          brace-style: ["error", "stroustrup", { "allowSingleLine": true }] */
/* eslint          camelcase: off */
/* eslint          capitalized-comments: off */
/* eslint          dot-location: ["error", "property"] */
/* eslint-env      es6, jquery */
/* eslint          id-length: off */
/* eslint          key-spacing: off */
/* eslint          line-comment-position: off */
/* eslint          max-len: off */
/* eslint          max-lines: off */
/* eslint          multiline-comment-style: off */
/* eslint          newline-per-chained-call: off */
/* eslint          no-extra-parens: ["error", "all", { "nestedBinaryExpressions": false }] */
/* eslint          no-inline-comments: off */
/* eslint          no-invalid-this: off */
/* eslint          no-magic-numbers: off */
/* eslint          no-param-reassign: off */
/* eslint          no-plusplus: off */
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
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/e.js
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
        const dds = $(`.track-line:first .expand-row dt`).filter(`:contains(Sub-label), :contains(Album), :contains(Album code), :contains(Year)`)
            .map(function getText () {
                return this.nextElementSibling.innerText;
            });

        Object.assign(ß.data, {
            catNum: dds[2],
            label: dds[0].toLowerCase(),
            releaseName: dds[1],
            url: document.location.href,
            year: dds[3]
        });
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({ site: `Musou` }),
            mbButton = `<td style="width: 28%;text-align:right;color:black;">${MBImport.buildFormHTML(parameters)}</td>`;

        $(`.description:first`).after(mbButton);
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

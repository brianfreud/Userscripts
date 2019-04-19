// ==UserScript==
// @name           Import Musou release listings to MusicBrainz TEST
// @description    Add a button to import Musou release listings to MusicBrainz
// @version        2019.4.15.0
// @include        http://www.musou.gr/music/album/*
// @namespace      https://github.com/brianfreud
/* global          MBImport, ß, $ */
/* eslint          camelcase: off */
/* eslint          capitalized-comments: off */
/* eslint          dot-location: ["error", "property"] */
/* eslint-env      es6, jquery */
/* eslint          id-length: off */
/* eslint          line-comment-position: off */
/* eslint          max-len: off */
/* eslint          multiline-comment-style: off */
/* eslint          newline-per-chained-call: off */
/* eslint          no-inline-comments: off */
/* eslint          no-invalid-this: off */
/* eslint          no-sparse-arrays: off */
/* eslint          no-magic-numbers: off */
/* eslint          one-var: off */
/* eslint          padded-blocks: off */
/* eslint          prefer-destructuring: off */
/* eslint          prefer-named-capture-group: off */
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

(function strictWrapper () {
    'use strict';

    const getTrackComposer = (el) => {
        const infoDTs = el.closest(`.track-line`)
            .querySelectorAll(`.expand-row dt`);

        return [...infoDTs].filter((dt) => dt.textContent === `Composers`)[0];
    };

    const scrapeMainTracks = () => {
        ß.data.tracks = ß.getTracks({
            trackSelector: `.parent .track-title`,
            parseTrack: (el) => [
                ``, // key
                el.textContent.toLowerCase().split(`. `), // [number, title]
                getTrackComposer(el).nextElementSibling.textContent, // artist
                el.nextSibling.textContent // duration
            ].flat()
        });
    };

    const scrapeAltTracks = () => {
        ß.data.tracks.push(ß.getTracks({
            trackSelector: `.other-versions .track-title`,
            parseTrack: (el, parent = el.parentNode) => [
                ``, // key
                `${parent.textContent} (${parent.querySelector(`.comment`).textContent})`.toLowerCase().split(`. `), // [number, title]
                getTrackComposer(el).nextElementSibling.textContent, // artist
                parent.querySelector(`.duration`).textContent.remove(/^\s*00:/u) // duration
            ].flat()
        }));
    };


    // ------------------------------------------------


    ß.parseTracks = () => {
        ß.data.tracks = ß.data.tracks.map((track) => [
            track[0].split(/^(\d+)\.\s/u),
            track[1],
            track[2]
        ]).map((track) => [
            ``,
            track[0][1],
            track[0][2].toLowerCase(),
            track[2].replace(/\d+%/gu, ``)
                .replace(/\([A-Z]+\)/gu, ``)
                .replace(/\//gu, `, `)
                .replace(/\[\d+\]/u, ``)
                .split(`,`)
                .map((artist) => {
                    ß.data.artistList.add(track[2]);

                    return artist.trim();
                }),
            track[1].match(/\d\d:\d\d$/u)[0]
        ]).sort((first, second) => first[1] - second[1]);

        ß.data.totalTracks = ß.data.tracks.length;
    };

    ß.scrapeRelease = () => {
        const dds = $(`.track-line:first .expand-row dt`).filter(`:contains(Sub-label), :contains(Album), :contains(Album code), :contains(Year)`)
            .map(function getText () {
                return this.nextElementSibling.innerText;
            });

        Object.assign(ß.data, {
            catNum: dds[2],
            label: dds[0].toLowerCase(),
            releaseArtist: [`various_artists`],
            releaseName: dds[1].replace(` Vol. `, `, Volume `),
            url: document.location.href,
            year: dds[3]
        });
    };

    ß.checkReleaseArtist = () => {
        if (ß.data.artistList.size === 1) { // If only one artist for release's tracks:
            ß.data.releaseArtist = ß.data.tracks[1][3];
        }
    };

    ß.makeImportButton = () => {
        const edit_note = MBImport.makeEditNote(ß.data.url, `Mousou`, ``, `https://github.com/brianfreud/Userscripts/`),
            releaseObj = ß.buildReleaseObject(`Digital Media`),
            parameters = MBImport.buildFormParameters(releaseObj, edit_note),
            mbButton = `<td style="width: 28%;text-align:right;color:black;">${MBImport.buildFormHTML(parameters)}</td>`;

        $(`.description:first`).after(mbButton);
    };

    ß.data.artistList = new Set();
    ß.data.tracks = [];
    scrapeMainTracks();
    scrapeAltTracks();
    ß.setTotalTracks();
//    ß.parseTracks();
    ß.scrapeRelease();
console.dir(ß.data);    
    ß.checkReleaseArtist();
    ß.makeImportButton();
    // ------------------------------------------------

}());

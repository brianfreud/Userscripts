// ==UserScript==
/* globals         MBImport, ß */
// @name           Import Arcadia releases to MusicBrainz
// @description    Add a button to import Arcadia releases to MusicBrainz
// @version        2019.3.27.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/Arcadia_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/Arcadia_importer.user.js
// @include        http*://usa.arcadiamusic.com/music/album/*
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
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    const scrapeTracks = async () => {
        const tracks = document.querySelectorAll(`#MainContent_gvTracks tr`).toArray().slice(1,);

        for (const track of tracks) {
            const tdNodes = track.querySelectorAll(`td`),
                tdData = tdNodes.toArray().map((td) => td.innerText.trim()),
                trackID = tdNodes[0].querySelectorAll(`a`)[0].href.split(`/`).slice(-1),
                // eslint-disable-next-line no-return-await
                getArtist = async () => await fetch(`http://usa.arcadiamusic.com/music/track/${trackID}`, { cache: `force-cache` })
                    .then((response) => response.text())
                    .then((html) => document.createRange().createContextualFragment(html))
                    .then((htmlFrag) => htmlFrag.querySelector(`#MainContent_lblComposer`).innerText);

            ß.data.tracks.push({
                // eslint-disable-next-line no-await-in-loop
                artist: await getArtist(),
                duration: tdData[3],
                number: tdData[1],
                title: tdData[2]
            });
        }
    };

    const getReleaseInfo = () => {
        const getData = (str) => document.querySelectorAll(`#MainContent_${str}`)[0].textContent;

        Object.assign(ß.data, {
            catNum: getData(`lblCdNo`),
            label: getData(`lbLibrary`),
            releaseName: getData(`lblAlbumTitle`),
            tracks: [],
            url: document.location.href
        });
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({
                site: `Arcadia`
            }),
            mbButton = `<br><br>${MBImport.buildFormHTML(parameters)}`;

        document.querySelector(`.fancybox`).insertAdjacentHTML(`afterend`, mbButton);

    };

    (async function processData () {
        getReleaseInfo();
        await scrapeTracks();
        ß.sortTracks();
        ß.cleanTrackArtists();
        ß.lookupTrackArtists();
        ß.setReleaseArtist();
        makeImportButton();
    }());
}());

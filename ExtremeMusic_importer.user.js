// ==UserScript==
// @name           Import Extreme Music release listings to MusicBrainz
// @description    Add a button to import Extreme Music release listings to MusicBrainz
// @version        2019.4.20.0
// @include        https://www.extrememusic.com/albums/*
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
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/ExtremeMusic_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/ExtremeMusic_importer.user.js
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    const scrapeTracks = (info) => {
        info.tracks.forEach((track) => {
            track.track_sound_ids.forEach((id) => {
                const sound = info.track_sounds.filter((thisSound) => thisSound.id === id)[0],
                    noAltVer = !(track.track_sound_ids.length - 1),
                    trackTitle = noAltVer
                        ? track.title
                        : `${sound.title} (${sound.version_type})`;

                ß.data.tracks.push({
                    number: sound.track_sound_no.split(`_`).slice(1).join(`.`).remove(/^0+/u),
                    title: trackTitle.toTitleCase(),
                    artist: track.composers.map((composer) => composer.name),
                    duration: ß.formatSeconds(sound.duration)
                });
            });
        });
    };

    const getReleaseInfo = (info) => {
        const date = info.album.created.match(/(\d{4})-(\d\d)-(\d\d)/u);

        Object.assign(ß.data, {
            catNum: info.album.album_no,
            label: info.album.series_title,
            releaseName: info.album.title.toTitleCase(),
            year: date[1],
            month: date[2],
            day: date[3],
            url: document.location.href
        });
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({
                site: `Extreme Music`
            }),
            mbButton = `<div style="background:lightgrey; border-radius:4px; cursor:pointer; margin-top:1em; padding:4px; width:8em;">
                            ${MBImport.buildFormHTML(parameters)}
                        </div>`;

        $(`.tracklist-header__info:first`).append(mbButton);
    };

    (async function processData () {
        const info = await fetch(document.location.href)
            .then((response) => response.text())
            .then((html) => html.match(/\{\\"album\\".+</u)[0].slice(0, -2).replace(/\\"/ug, `"`)) // extract the JSON from the page's HTML
            .then((json) => JSON.parse(json));

        getReleaseInfo(info);
        ß.data.tracks = [];
        scrapeTracks(info);
        ß.sortTracks();
        ß.setTotalTracks();
        ß.cleanTrackArtists();
        ß.lookupTrackArtists();
        ß.setReleaseArtist();
        makeImportButton();
    }());
}());

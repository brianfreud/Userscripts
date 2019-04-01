// ==UserScript==
// @name           Import Mousou release listings to MusicBrainz
// @description    Add a button to import Mousou release listings to MusicBrainz
// @version        2019.4.1.0
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
/* eslint          no-magic-numbers: off */
/* eslint          padded-blocks: off */
/* eslint          prefer-destructuring: off */
/* eslint          prefer-named-capture-group: off */
/* eslint          quote-props: ["error", "as-needed"] */
/* eslint          quotes: ["error", "backtick"] */
/* eslint          sort-vars: off */
/* eslint          spaced-comment: off */
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/Mousou_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/Mousou_importer.user.js
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.data.tracks = [];
ß.data.artistList = new Set();

ß.scrapeMainTracks = () => {
    'use strict';

    $(`.parent .track-title`).each(function parse () {

        const $this = $(this);

        ß.data.tracks.push([
            $this.text(), // Title
            $this.next().text(), // Duration
            $this.parents(`.track-line`).find(`.expand-row dt:contains("Composers")`).next().text() // Artist
        ]);
    });
};

ß.scrapeAltTracks = () => {
    'use strict';

    $(`.other-versions .track-title`).each(function parse () {

        const $this = $(this);

        ß.data.tracks.push([
            `${$this.text()} (${$this.parent().find(`.comment`).text()})`, // Title
            $this.next().text(), // Duration
            $this.parents(`.track-line`).find(`.expand-row dt:contains("Composers")`).next().text() // Artist
        ]);
    });
};

ß.parseTracks = () => {
    'use strict';

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
    ]).sort((first, second) => first[0] - second[0]);

    ß.data.totalTracks = ß.data.tracks.length;
};

ß.scrapeRelease = () => {
    'use strict';

    const dds = $(`.track-line:first .expand-row dd`).map(function getText () {
        return this.innerText;
    });

    Object.assign(ß.data, {
        catNum: dds[6],
        label: dds[4].toLowerCase(),
        releaseArtist: [`various_artists`],
        releaseName: dds[5].replace(` Vol. `, `, Volume `),
        url: document.location.href,
        year: dds[7]
    });
};

ß.checkReleaseArtist = () => {
    'use strict';

    if (ß.data.artistList.size === 1) { // If only one artist for release's tracks:
        ß.data.releaseArtist = ß.data.tracks[1][3];
    }
};

ß.makeImportButton = () => {
    'use strict';

    const edit_note = MBImport.makeEditNote(ß.data.url, `Mousou`, ``, `https://github.com/brianfreud/Userscripts/`),
        releaseObj = ß.buildReleaseObject(`Digital Media`),
        parameters = MBImport.buildFormParameters(releaseObj, edit_note),
        mbButton = `<td style="width: 28%;text-align:right;color:black;">${MBImport.buildFormHTML(parameters)}</td>`;

    $(`.description:first`).after(mbButton);
};

ß.scrapeMainTracks();
ß.scrapeAltTracks();
ß.parseTracks();
ß.scrapeRelease();
ß.checkReleaseArtist();
ß.makeImportButton();

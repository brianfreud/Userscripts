// ==UserScript==
// @name           Import Upright Music release listings to MusicBrainz
// @description    Add a button to import Upright Music release listings to MusicBrainz
// @version        2019.4.13.1
// @include        https://search.upright-music.pl/album/*
// @namespace      https://github.com/brianfreud
/* global          MBImport, ß, $ */
/* eslint          camelcase: off */
/* eslint          capitalized-comments: off */
/* eslint          dot-location: ["error", "property"] */
/* eslint-env      es6, $ */
/* eslint          id-length: off */
/* eslint          line-comment-position: off */
/* eslint          max-len: off */
/* eslint          multiline-comment-style: off */
/* eslint          newline-per-chained-call: off */
/* eslint          no-inline-comments: off */
/* eslint          no-invalid-this: off */
/* eslint          no-magic-numbers: off */
/* eslint          no-plusplus: off */
/* eslint          no-whitespace-before-property: off */
/* eslint          padded-blocks: off */
/* eslint          prefer-destructuring: off */
/* eslint          prefer-named-capture-group: off */
/* eslint          quote-props: ["error", "as-needed"] */
/* eslint          quotes: ["error", "backtick"] */
/* eslint          sort-keys: off */
/* eslint          sort-vars: off */
/* eslint          spaced-comment: off */
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/UprightMusic_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/UprightMusic_importer.user.js
// @require        https://code.jquery.com/jquery-3.4.0.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.getReleaseInfo = () => {
    'use strict';

    const relInfo = $(`#block-us-hero`).find(`.title`).text().match(/([A-Z\s]+)(\d+)\s(.+)/u),
        labelPrefix = relInfo[1].trim();

    Object.assign(ß.data, {
        artistList: new Set(),
        catNum: relInfo[1] + relInfo[2],
        releaseArtist: [`various_artists`],
        releaseName: relInfo[3],
        label: ß.labelDB.filter((p) => p.prefix === labelPrefix)[0].name,
        numTracks: $(`.playlist-item-unexpanded`).length,
        url: document.location.href,
        tracksProcessed: 0,
        tracks: []
    });
};

ß.getDateInfo = (doc) => {
    'use strict';

    const date = $(doc.getElementsByClassName(`meta-info-published`)).text().slice(1).trim();

    Object.assign(ß.data, {
        month: {
            Jan: 1,
            Feb: 2,
            Mar: 3,
            Apr: 4,
            May: 5,
            Jun: 6,
            Jul: 7,
            Aug: 8,
            Sep: 9,
            Oct: 10,
            Nov: 11,
            Dec: 12
        } [date.match(/([A-Z][a-z]{2})/u)[1]],
        year: date.match(/(\d{4})/u)[1]
    });
};

ß.getArtistInfo = (trackNum) => {
    'use strict';

    fetch(`https://search.upright-music.pl/track/${ß.data.tracks[trackNum][0]}/ajax`)
        .then((response) => response.text())
        .then((html) => {

            const cleanedHtml = html.replace(/\\u003C/gu, `<`)
                    .replace(/\\u003E/gu, `>`)
                    .replace(/\\u0022/gu, `"`)
                    .replace(/\\/gu, ``),
                parser = new DOMParser(),
                doc = parser.parseFromString(cleanedHtml, `text/html`),
                artistsLi = doc.getElementsByClassName(`meta-info-stakeholders`),
                artists = Array.from($(artistsLi).find(`a`).slice(1).map((i, person) => person.innerText.toLowerCase()));

            ß.data.tracks[trackNum][3] = artists;
            ß.data.artistList.add(artists);

            if (ß.data.numTracks === ++ß.data.tracksProcessed) {
                ß.finalizeRelease(doc);
            }
        });
};

ß.getTracksInfo = () => {
    'use strict';

    $(`.playlist-item-unexpanded`).each(function processTrack () {

        const trackNum = ß.data.tracks.length,
            $this = $(this);

        ß.data.tracks.push([
            $this.find(`.use-ajax`).attr(`href`).split(`/`)[2], // key
            $this.find(`.item-number`).text(), // number
            $this.find(`.item-name`).text(), // title
            [], // artists (placeholder)
            $this.find(`.item-duration`).text().match(/(\d\d)'(\d\d)/u).slice(1, 3).join(`:`) // duration
        ]);

        ß.getArtistInfo(trackNum);
    });
};

ß.finalizeRelease = (doc) => {
    'use strict';

    ß.getDateInfo(doc);

    if (ß.data.artistList.size === 1) { // If only one artist for release's tracks,
        ß.data.releaseArtist = ß.data.tracks[0][3];
    }

    const releaseObj = ß.buildReleaseObject(`Digital Media`),
        edit_note = MBImport.makeEditNote(ß.data.url, `Upright Music`, ``, `https://github.com/brianfreud/Userscripts/`),
        parameters = MBImport.buildFormParameters(releaseObj, edit_note);

    $(`.hero-top-wrapper > ul`).after($(MBImport.buildFormHTML(parameters)).css(`margin`, `1em 3em`));
};

ß.getReleaseInfo();
ß.getTracksInfo();

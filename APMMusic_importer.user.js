// ==UserScript==
// @name           Import APM Music release listings to MusicBrainz
// @description    Add a button to import APM Music release listings to MusicBrainz
// @version        2019.4.14.1
// @include        https://www.apmmusic.com/albums/*
// @namespace      https://github.com/brianfreud
/* global          MBImport, ß, $ */
/* eslint          camelcase: off */
/* eslint          capitalized-comments: off */
/* eslint          dot-location: ["error", "property"] */
/* eslint-env      es6, $ */
/* eslint          id-length: off */
/* eslint          key-spacing: off */
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
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/APMMusic_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/APMMusic_importer.user.js
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

    const relInfo = $(`.album-meta-data .details .dl div span`),
        labelInfo = relInfo[0].innerText.match(/(.+)\s\((.+)\)/u),
        dateInfo = relInfo[3].innerText.match(/(\d{4})-(\d{2})-(\d{2})/u);

    Object.assign(ß.data, {
        artistList: new Set(),
        catNum: relInfo[2].innerText,
        releaseArtist: [`various_artists`],
        releaseName: $(`.title:first`).text().split(/-\s.+-\s(.+)/gu)[1],
        label: labelInfo[1],
        labelPrefix: labelInfo[2],
        url: document.location.href,
        numTracks: $(`.item.track`).length,
        tracksProcessed: 0,
        tracks: [],
        day: dateInfo[3],
        month: dateInfo[2],
        year: dateInfo[1]
    });
};

ß.getArtistInfo = (trackNum) => {
    'use strict';

    fetch(`https://searchapi.prod.apmmusic.com/api/v1/tracks/${ß.data.tracks[trackNum][0]}/versions`)
        .then((response) => response.json())
        .then((data) => {

            ß.data.tracks[trackNum][3] = data[0].composer.map((name) => name.split(/\s\(/u)[0]);

            ß.data.artistList.add(ß.data.tracks[trackNum][3]);

            if (ß.data.numTracks === ++ß.data.tracksProcessed) {
                ß.finalizeRelease();
            }
        });
};

ß.getTracksInfo = () => {
    'use strict';

    $(`.item.track`).each(function processTrack () {

        const $this = $(this),
            dataFields = $(this).find(`.table-cell`),
            trackNum = dataFields[2].innerText;

        ß.data.tracks[trackNum] = [
            $this.attr(`data-id`), // key
            trackNum, // number
            dataFields[3].innerText, // title
            [], // artists (placeholder)
            dataFields[6].innerText // duration
        ];

        ß.getArtistInfo(trackNum);
    });
};

ß.finalizeRelease = () => {
    'use strict';

    ß.data.tracks = ß.data.tracks.sort((first, second) => first[1] - second[1]);

    if (ß.data.artistList.size === 1) { // If only one artist for release's tracks,
        ß.data.releaseArtist = ß.data.tracks[0][3];
    }

    const releaseObj = ß.buildReleaseObject(`Digital Media`),
        edit_note = MBImport.makeEditNote(ß.data.url, `APM Music`, ``, `https://github.com/brianfreud/Userscripts/`),
        parameters = MBImport.buildFormParameters(releaseObj, edit_note),
        $html = $(MBImport.buildFormHTML(parameters));

    $html.css({
        float:         `right`,
        'font-size':   `120%`,
        'font-weight': 700,
        'margin-top':  `-1.7em`
    })
        .find(`img`).css(`width`, `17px`);

    $(`.header:eq(3)`).after($html);
};

const waitForAlbum = () => {
        'use strict';

        if ($(`.album-meta-data .details .dl div span`).length >= 5) {
            clearInterval(checker); // eslint-disable-line no-use-before-define
            ß.getReleaseInfo();
            ß.getTracksInfo();
        }
    },
    checker = setInterval(waitForAlbum, 1000);

// ==UserScript==
// @name           Import Universal Production Music release listings to MusicBrainz
// @description    Add a button to import Universal Production Music release listings to MusicBrainz
// @version        2019.4.7.0
// @include        https://www.universalproductionmusic.com/en-se/discover/albums/*
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
/* eslint          no-whitespace-before-property: off */
/* eslint          padded-blocks: off */
/* eslint          prefer-destructuring: off */
/* eslint          prefer-named-capture-group: off */
/* eslint          quote-props: ["error", "as-needed"] */
/* eslint          quotes: ["error", "backtick"] */
/* eslint          sort-keys: off */
/* eslint          sort-vars: off */
/* eslint          spaced-comment: off */
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/UPM_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/UPM_importer.user.js
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

ß.getReleaseInfo = () => {
    'use strict';

    const $fields = $(`.c-album-info__desc`),
        date = $fields[$fields.length - 1].innerText.split(` `);

    Object.assign(ß.data, {
        artistList: new Set(),
        catNum: $fields[0].innerText.trim(),
        releaseArtist: [`various_artists`],
        releaseName: $(`.c-detailpage__title`)[0].innerText,
        label: $fields[1].innerText.trim(),
        url: document.location.href,
        day: date[0],
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
        } [date[1]],
        year: date[2]
    });
};

ß.cleanReleaseInfo = () => {
    'use strict';

    ß.data.label = {
        Koka: `Koka Media`
    } [ß.data.label] || ß.data.label;

    if (ß.data.artistList.size === 1) { // If only one artist for release's tracks:
        ß.data.releaseArtist = ß.data.tracks[1][3];
    }

};

ß.getTrackInfo = () => {
    'use strict';

    $(`.c-track__main`).each(function processTrack () {

        const $this = $(this),
            tracknum = $this.find(`.c-track__item--id`).text().split(`-`)[1],
            existingTrack = ß.data.tracks.filter((track) => track[1] === tracknum),
            artists = $this.next().find(`[translate="PLAYLIST.ALBUM_HEADERS.COMPOSER"]`).next()
                .find(`li`).map(function getArtistText () {
                    return this.innerText.replace(/\[.+\]/u, ``).trim();
                }).toArray(),
            makeArray = () => [
                ``, // unused
                tracknum, // track number
                $this.find(`.c-track__item--title`).text().trim(), // title
                artists,
                `` // duration isn`t available :(
            ];

        artists.length > 0 && ß.data.artistList.add(artists.join(`&`));

        if (existingTrack.length) { // UPM shows main tracks as alternates when other alternates also exist
            ß.data.tracks[existingTrack] = makeArray();
        } else {
            ß.data.tracks.push(makeArray());
        }
    });

};

ß.cleanTrackInfo = () => {
    'use strict';

    let mainTrack = ``,
        currentArtist = [];

    for (const track of ß.data.tracks) {
        if (track[3].length) {
            mainTrack = track;
            currentArtist = track[3];
        } else {
            track[3] = currentArtist;
            track[2] = `${mainTrack[2]} (${track[2]})`.replace(/\n\s+(.+)/u, ` ($1)`)
                .replace(/\((.+)\s\((.+)\)\)/u, `($1) ($2)`)
                .replace(/\((.+)\s\((.+)\)\)/u, `($1) ($2)`); // second time finishes cleaning text in sub-subversions
        }
    }
    ß.data.tracks.sort((first, second) => first[1] - second[1]);
};

ß.makeImportButton = () => {
    'use strict';

    const edit_note = MBImport.makeEditNote(ß.data.url, `Universal Production Music`, ``, `https://github.com/brianfreud/Userscripts/`),
        releaseObj = ß.buildReleaseObject(`Digital Media`),
        parameters = MBImport.buildFormParameters(releaseObj, edit_note),
        mbButton = `<div>${MBImport.buildFormHTML(parameters)}</div>`;

    $(`body`).prepend(mbButton);
};

const waitForAlbum = () => {
        'use strict';

        if ($(`[translate="PLAYLIST.ALBUM_HEADERS.COMPOSER"]`).length > 0) {
            clearInterval(checker); // eslint-disable-line no-use-before-define
            ß.data.tracks = [];
            ß.getReleaseInfo();
            ß.getTrackInfo();
            ß.cleanTrackInfo();
            ß.cleanReleaseInfo();
            ß.makeImportButton();
        }
    },
    checker = setInterval(waitForAlbum, 2000);

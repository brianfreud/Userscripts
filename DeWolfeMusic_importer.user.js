// ==UserScript==
// @name           Import De Wolfe Music release listings to MusicBrainz
// @description    Add a button to import De Wolfe Music release listings to MusicBrainz
// @version        2019.4.26.0
// @include        https://www.dewolfemusic.com/search.php*
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
/* eslint          no-multi-spaces: ["error", { ignoreEOLComments: true }] */
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
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/DeWolfeMusic_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/DeWolfeMusic_importer.user.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    const extractReleaseInfo = () => {
        const relInfo = ß.data.albumData;

        Object.assign(ß.data, {
            catNum: relInfo.albums[0].reference,
            label: relInfo.libraries[0].name,
            releaseName: relInfo.albums[0].name.toTitleCase(),
            tracks = [],
            url: document.location.href
        }, ß.extractDMY(new Date(relInfo.rows[0].releasedate)));

        if (ß.data.label == `De Wolfe Vinyl`) { // replace the modern imprint's name with the name used at the time.
            ß.data.label = `Music De Wolfe`;
        }
    };

    const extractTrackInfo = () => {
        for (const track of ß.data.albumData.rows) {
            ß.data.tracks.push({
                artist: JSON.parse(track.composersObj).map((artist) => artist.name),
                duration: ß.formatSeconds(track.duration * 60),
                number: parseInt(track.track, 10),
                title: track.title
            });
        }
    };

    const getAlbumID = async () => {
        const url = document.location.href,
            params = new URL(url).searchParams,
            paramString = JSON.stringify({
                code: params.get(`code`),
                id: params.get(`id`)
            });

        /* The first fetch gets the album id.  The other data there is ignored; it is paginated, so tracks are incomplete.
           The album id then feeds the second fetch, which returns the complete release's info (up to 1000 tracks). */
        await fetch(`https://www.dewolfemusic.com/JSON/preDoneSearch.php`, {
            method: `POST`,
            headers: {
                'content-type': `application/x-www-form-urlencoded`
            },
            body: `json=${encodeURIComponent(paramString)}`
        })
            .then((response) => Object.freeze(response.json()))
            .then((json) => {
                ß.data.albumID = json.result.albums[0].id;
            });
    };
    const getReleaseInfo = async () => {
        // The DeWolfe JSON API is very picky. Everything done to 'tokens' here is to make the body parameter *exactly* as it requires.
        const advSearchArg = `${JSON.stringify({
                "mainVersions": 0, // eslint-disable-line quote-props
                "library": [],     // eslint-disable-line quote-props
                "title": "",       // eslint-disable-line quote-props, quotes
                "resultshape": 0,  // eslint-disable-line quote-props
                "parentTrack": 0,  // eslint-disable-line quote-props
                "published": 1,    // eslint-disable-line quote-props
                "libraryType": 1   // eslint-disable-line quote-props
            })}&page=1&pagesize=1000&aggregation=false`,
            tokens = escape(`[{"id":${ß.data.albumID},"type":5}]&advancedSearch=${advSearchArg}`)
                .replace(/%26/gu, `&`)
                .replace(/%3D/gu, `=`);

        await fetch(`https://www.dewolfemusic.com/JSON/searchTracks.php`, {
            credentials: `include`,
            headers: {
                accept: `*/*`,
                "accept-language": `en-US,en;q=0.9,en-GB;q=0.8`,
                "content-type": `application/x-www-form-urlencoded; charset=UTF-8`,
                "x-requested-with": `XMLHttpRequest`
            },
            referrer: `https://www.dewolfemusic.com/search.php?id=2506142&code=im4VRn`,
            referrerPolicy: `no-referrer-when-downgrade`,
            body: `tokens=${tokens}"`,
            method: `POST`,
            mode: `cors`
        })
            .then((response) => Object.freeze(response.json()))
            .then((json) => {
                ß.data.albumData = json.result;
            });
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({
                site: `De Wolfe Music`
            }),
            mbButton = MBImport.buildFormHTML(parameters);

        document.querySelector(`.albumTitle h3`).insertAdjacentHTML(`afterend`, mbButton);
    };

    (async function loader () {
        await getAlbumID();
        await getReleaseInfo();
        extractReleaseInfo();
        extractTrackInfo();
        ß.sortTracks();
        ß.cleanTrackArtists();
        ß.lookupTrackArtists();
        ß.setReleaseArtist();
        makeImportButton();
    }());
}());

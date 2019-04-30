// ==UserScript==
// @name           Import Harvest Media SG2 release listings to MusicBrainz
// @description    Add a button to import Harvest Media (SG2-style servers) release listings to MusicBrainz
// @version        2019.4.30.1
// @include        http*://echomusicpg.sg2.harvestmedia.net*
// @include        http*://indiesonics.sg2.harvestmedia.net*
// @include        http*://liftmusic.sg2.harvestmedia.net*
// @include        http*://redigloomusic.sg2.harvestmedia.net*
// @include        http*://search.twelvetonesproductionmusic.com*
// @include        http*://sg2.harvestmedia.net*
// @include        http*://synchromusic.sg2.harvestmedia.net*
// @include        http*://www.shoutmusicsync.com*
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
/* eslint          no-unused-expressions: ["error", { "allowShortCircuit": true }] */
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
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/HarvestMediaSG2_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/HarvestMediaSG2_importer.user.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    const getArtistForTrack = (trackNum) => ß.data.MOREINFO_HTML
        .querySelector(`.moreInfoRow[objectid="${ß.data.TRACK_JSON[trackNum - 1].id}"]`)
        .querySelector(`.composerinfo`)
        .nextSibling
        .textContent;

    const populateLabelDB = async function populateLabelDB () {
        if (!Object.prototype.hasOwnProperty.call(ß.data, `LABELS`)) {
            ß.data.LABELS = [];
            await fetch(`${document.location.origin}//Handler/GetLeftMenuItems.ashx?type=library`, {
                body: null,
                method: `GET`
            })
                .then((txt) => txt.text())
                .then((txt) => ß.makeFragmentFromString(txt))
                .then((frag) => {
                    const libAnchors = frag.querySelectorAll(`.librarylevellink`);

                    for (const anchor of libAnchors) {
                        ß.data.LABELS.push({
                            id: anchor.getAttribute(`objectid`),
                            name: anchor.querySelector(`span`).textContent
                        });
                    }
                });
        }
    };

    const setReleaseInfo = function setReleaseInfo () {
        const data = ß.data.ALBUM_JSON;

        Object.assign(ß.data, {
            catNum: data.AlbumCode,
            label: ß.data.LABELS.filter((labelEntry) => labelEntry.id === data.LibraryIdEnc)[0].name,
            releaseName: data.CdTitle,
            tracks: [],
            url: `${document.location.origin}/album/${data.IdEnc}${document.location.search}`
        }, ß.extractDMY(new Date(data.ReleaseDate)));
    };

    const displayError = function displayError (errMsg) {
        document.querySelector(`.albumTrackView_AlbumInfoCenter`)
            .insertAdjacentHTML(`beforeend`, `<br><div id="importError" style="color:red;font-size:125%;font-weight:900;">${errMsg}</div>`);
    };

    const setTracksInfo = function setTracksInfo () {
        const data = ß.data.TRACK_JSON;

        for (const track of data) {
            const [number, title] = ((arr) => [parseInt(arr[1], 10), arr[2]])(track.title.split(/^(\d+)\s(.+)/u));
            let artist; // eslint-disable-line init-declarations

            try {
                artist = getArtistForTrack(number);
            }
            catch (err) { // The track number isn't in the artist info, indicating that the release listing is incomplete.
                ß.data.errorState = 1;

                displayError(`The release listing is incomplete.`);

                return;
            }

            ß.data.tracks.push({
                artist,
                duration: ß.formatSeconds(track.duration),
                number,
                title
            });
        }
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({ site: document.title }),
            mbButton = MBImport.buildFormHTML(parameters);

        document.querySelector(`.albumTrackView_AlbumInfoCenter`)
            .insertAdjacentHTML(`beforeend`, `<br><div id="importButton">${mbButton}</div>`);
        document.querySelector(`#importButton button`).style.cssText = `padding: 4px; border-radius: 4px;`;
        document.querySelector(`#importButton button span`).style.cssText = `font-size: 13px; vertical-align: top;`;
    };

    const setListener = function setListener () {
        document.querySelector(`#librariesSortable`).addEventListener(`click`, (e) => {
            const albumID = e.target.getAttribute(`objectid`) || e.target.getAttribute(`objectname`);

            ß.data.errorState = 0;
            ß.deleteNode(`#importError`);
            ß.deleteNode(`#importButton`);

            (albumID !== null) && fetch(`${document.location.origin}//Handler/GetTracksPostMethod.ashx`, {
                headers: {
                    'content-type': `application/x-www-form-urlencoded; charset=UTF-8`
                },
                body: `type=album_tracks&id=${albumID}&isheader=false`,
                method: `POST`
            })
                .then((txt) => txt.text())
                .then((txt) => txt.split(`{|}`))
                .then((arr) => {
                    Object.defineProperties(ß.data, {
                        ALBUM_JSON: {
                            value: JSON.parse(arr[0]),
                            writable: true
                        },
                        TRACK_JSON: {
                            value: JSON.parse(arr[1]),
                            writable: true
                        },
                        MOREINFO_HTML: {
                            value: ß.makeFragmentFromString(arr[2]),
                            writable: true
                        }
                    });
                })
                .then(() => {
                    setReleaseInfo();
                    setTracksInfo();
                    if (!ß.data.errorState) {
                        ß.sortTracks();
                        ß.cleanTrackArtists();
                        ß.lookupTrackArtists();
                        ß.setReleaseArtist();
                        makeImportButton();
                    }
                });
        });
    };

    (async function loader () {
        await populateLabelDB();
        setListener();
    }());
}());

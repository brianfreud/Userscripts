// ==UserScript==
// @name           Import Harvest Media SG2/SG3 release listings to MusicBrainz
// @description    Add a button to import Harvest Media (SG2 & SG3 servers) release listings to MusicBrainz
// @version        2019.5.2.0
// @include        http*://www.westonemusic.com*
// @include        http*://echomusicpg.sg2.harvestmedia.net*
// @include        http*://indiesonics.sg2.harvestmedia.net*
// @include        http*://liftmusic.sg2.harvestmedia.net*
// @include        http*://redigloomusic.sg2.harvestmedia.net*
// @include        http*://search.twelvetonesproductionmusic.com*
// @include        http*://sg2.harvestmedia.net*
// @include        http*://synchromusic.sg2.harvestmedia.net*
// @include        http*://searchmusic.twistedjukebox.com*
// @include        http*://www.shoutmusicsync.com*
// @namespace      https://github.com/brianfreud
/* global          MBImport, ß, libraries */
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
/* eslint          max-lines-per-function: off */
/* eslint          max-statements: off */
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

    const displayError = function displayError (errMsg) {
        if (ß.data.MODE === `SG2`) {
            document.querySelector(`.albumTrackView_AlbumInfoCenter`)
                .insertAdjacentHTML(`beforeend`, `<br><div id="importError" style="color:red;font-size:125%;font-weight:900;">${errMsg}</div>`);
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG3`) {
// TODO
        }

        // -----------------------------------------------------------------

        else {
            displayError(`Unknown mode for site.`);
            ß.data.errorState = 1;

            return; // eslint-disable-line no-useless-return
        }

        // -----------------------------------------------------------------

    };

    const getArtistForTrack = (trackNum) => ß.data.MOREINFO_HTML
        .querySelector(`.moreInfoRow[objectid="${ß.data.TRACK_JSON[trackNum - 1].id}"]`)
        .querySelector(`.composerinfo`)
        .nextSibling
        .textContent;

    const populateLabelDB = async function populateLabelDB () {
        if (!Object.prototype.hasOwnProperty.call(ß.data, `LABELS`)) {
            ß.data.LABELS = [];

            // -----------------------------------------------------------------

            if (ß.data.MODE === `SG2`) {

                await fetch(`${document.location.origin}//Handler/GetLeftMenuItems.ashx?type=library`, {
                    body: null,
                    cache: `force-cache`,
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

            // -----------------------------------------------------------------

            else if (ß.data.MODE === `SG3`) {
                if (typeof libraries === `string`) { // West One Music (others?)
                    for (const label of JSON.parse(libraries)) {
                        ß.data.LABELS.push({
                            id: label.IDEnc,
                            name: label.Name
                        });
                    }
                }
                else { // generic SG3 sites
                    await fetch(`${document.location.origin}/Handler/GetLeftMenuItems.ashx`, {
                        body: `{"type":"library"}`,
                        method: `POST`
                    })
                        .then((response) => Object.freeze(response.json()))
                        .then((json) => {
                            for (const label of json.Libraries) {
                                ß.data.LABELS.push({
                                    id: label.ID,
                                    name: label.Name
                                });
                            }
                        });
                }
            }

            // -----------------------------------------------------------------

            else {
                displayError(`Unknown mode for site.`);
                ß.data.errorState = 1;

                return;
            }

            // -----------------------------------------------------------------

            Object.freeze(ß.data.LABELS);
        }
    };

    const setReleaseInfo = function setReleaseInfo () {
        const data = ß.data.ALBUM_JSON;

        Object.assign(ß.data, {
            catNum: data.AlbumCode || data.albumCode,
            label: data.albumLibraryName || ß.data.LABELS.filter((labelEntry) => labelEntry.id === (data.LibraryIdEnc || data.LibraryId))[0].name,
            releaseName: ß.unentity(data.albumName || data.DisplayTitle.remove(`${data.AlbumCode} `) || data.CdTitle),
            tracks: []
        }, ß.extractDMY(new Date(data.ReleaseDate || data.albumReleased)));

        if (ß.data.MODE === `SG2`) {
            ß.data.url = `${document.location.origin}/album/${data.IdEnc}${document.location.search}`;
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG3`) {
            ß.data.url = document.location.href;
        }

        // -----------------------------------------------------------------

        else {
            displayError(`Unknown mode for site.`);
            ß.data.errorState = 1;

            return; // eslint-disable-line no-useless-return
        }
    };

    const setTracksInfo = async function setTracksInfo () {
        const data = ß.data.TRACK_JSON;

        for (const track of data) {
            if (ß.data.MODE === `SG2`) {
                //const [number, title] = ((arr) => [parseInt(arr[1], 10), arr[2]])(track.title.split(/^(\d+)\s(.+)/u));
                const [number, title] = ((arr) => [parseInt(arr[1], 10), arr[2]])(track.title.split(/.*trk(\d\d\d)\s(.+)/gu));

                let artist; // eslint-disable-line init-declarations

                try {
                    console.log(number)
                    console.dir(ß.data);
                    artist = getArtistForTrack(number);
                }
                catch (err) { // The track number isn't in the artist info, indicating that the release listing is incomplete.
                    ß.data.errorState = 1;
                    console.error(err);
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

            // -----------------------------------------------------------------

            else if (ß.data.MODE === `SG3`) {
                const trackObj = {
                    duration: ß.formatSeconds(track.Duration || track.duration),
                    number: parseInt(track.TrackNumber || track.trackNumber, 10),
                    title: ß.unentity(track.title || track.Title.remove(`Tk${track.TrackNumber} `)).toLowerCase()
                };

                if (Object.prototype.hasOwnProperty.call(track, `Composer`)) { // generic SG3
                    trackObj.artist = track.Composer;
                }
                else { // West One Music, (others?)

                    await fetch(`https://www.westonemusic.com/Handlers/GetTrack.ashx`, { // eslint-disable-line no-await-in-loop
                        headers: {
                            'content-type': `application/x-www-form-urlencoded; charset=UTF-8`
                        },
                        body: `objectid=9549110ccb9334c6&playlisttype=Playlist_AlbumTab`,
                        method: `POST`
                    })
                        .then((txt) => txt.text())
                        .then((blob) => eval(blob)) // eslint-disable-line no-eval
                        .then((obj) => trackObj.artist = obj.trackComposers); // eslint-disable-line no-return-assign
                }

                ß.data.tracks.push(trackObj);
            }

            // -----------------------------------------------------------------

            else {
                displayError(`Unknown mode for site.`);
                ß.data.errorState = 1;

                return;
            }
        }
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({ site: document.title }),
            mbButton = MBImport.buildFormHTML(parameters);

        // -----------------------------------------------------------------
        // The entire page is contained in a form already, so we have to go outside of that form and use absolute positioning for this form.
        if (document.querySelector(`#test`) === null) {
            if (ß.data.MODE === `SG2`) {
                document.querySelector(`.albumTrackView_AlbumInfoCenter`)
                    .insertAdjacentHTML(`beforeend`, `<div id="test" style="width: 100px; height: 30px;">`);
            }

            // -----------------------------------------------------------------

            else if (ß.data.MODE === `SG3`) {
                document.querySelector(`.searchBar__icons, .player-bottom-options-holder`)
                    .insertAdjacentHTML(`beforebegin`, `<div id="test" style="width: 100px; height: 30px;">`);
            }

            // -----------------------------------------------------------------

            else {
                displayError(`Unknown mode for site.`);
                ß.data.errorState = 1;

                return;
            }

            // -----------------------------------------------------------------
        }

        const testPos = document.querySelector(`#test`).getBoundingClientRect();

        document.querySelector(`body`).insertAdjacentHTML(`beforeend`, `<br><div id="importButton"
            style="position: absolute; top: ${testPos.top + 85}px;right: ${testPos.right + 100}px; z-index: 2000;">${mbButton}</div>`);
        document.querySelector(`#importButton button`).style.cssText = `padding: 4px; border-radius: 4px;`;
        document.querySelector(`#importButton button span`).style.cssText = `font-size: 13px; vertical-align: top;`;
        ß.deleteNode(`#test`);
    };

    const setListener = function setListener (albumMenuNode) {
        albumMenuNode.addEventListener(`click`, (e) => {
            let albumID, requestPromise, objectcode; // eslint-disable-line init-declarations

            ß.deleteNode(`#importError`);
            ß.deleteNode(`#importButton`);

            if (e.target.tagName === `A`) {
                albumID = e.target.getAttribute(`objectid`) || e.target.getAttribute(`objectname`); // generic SG2 sites
                if (albumID === null) { // West One Music, (others?)
                    const shareLink = e.target.parentNode.parentNode.querySelector(`.share-button`);

                    if (shareLink !== null) {
                        albumID = shareLink.getAttribute(`objectid`);
                        objectcode = shareLink.getAttribute(`objectcode`);
                    }
                }
            }
            else if (e.target.tagName === `DIV` && !e.target.classList.contains(`leftMenuPanelItemRow__title--1`)) {
                albumID = e.target.parentNode.parentNode.getAttribute(`object-id`); // SG3
            }
            else { // Item clicked was not an album item
                return; // eslint-disable-line no-useless-return
            }

            ß.data.errorState = 0;

            // -----------------------------------------------------------------

            if (albumID === null) {
                displayError(`Missing album ID.`);
                ß.data.errorState = 1;

                return; // eslint-disable-line no-useless-return
            }

            // -----------------------------------------------------------------

            else if (ß.data.MODE === `SG2`) {
                requestPromise = fetch(`${document.location.origin}//Handler/GetTracksPostMethod.ashx`, {
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
                                value: Object.freeze(JSON.parse(arr[0])),
                                writable: true
                            },
                            TRACK_JSON: {
                                value: Object.freeze(JSON.parse(arr[1])),
                                writable: true
                            },
                            MOREINFO_HTML: {
                                value: ß.makeFragmentFromString(arr[2]),
                                writable: true
                            }
                        });
                    });
            }

            // -----------------------------------------------------------------

            else if (ß.data.MODE === `SG3`) {
                if (typeof objectcode === `undefined`) { // generic SG3 sites
                    requestPromise = fetch(`${document.location.origin}/Handler/GetAlbum.ashx`, {
                        body: `{"id":"${albumID}"}`,
                        method: `POST`
                    })
                        .then((txt) => txt.json())
                        .then((json) => {
                            Object.defineProperties(ß.data, {
                                ALBUM_JSON: {
                                    value: Object.freeze(json.Album),
                                    writable: true
                                },
                                TRACK_JSON: {
                                    value: Object.freeze(json.Album.Tracks),
                                    writable: true
                                }
                            });
                        });
                }
                else { // West One Music, (others?)
                    requestPromise = fetch(`${document.location.origin}/Handlers/GetAlbum.ashx`, {
                        body: `albumCode=${objectcode}&libraries=${encodeURI(libraries)}`,
                        headers: new Headers({'content-type': `application/x-www-form-urlencoded;charset=UTF-8`}),
                        method: `POST`
                    })
                        .then((txt) => txt.text())
                        .then((txt) => {
                            const json = eval(txt); // eslint-disable-line no-eval

                            Object.defineProperties(ß.data, {
                                ALBUM_JSON: {
                                    value: Object.freeze(json),
                                    writable: true
                                },
                                TRACK_JSON: {
                                    value: Object.freeze(eval(json.tracksJson).all_tracks), // eslint-disable-line no-eval
                                    writable: true
                                }
                            });
                        });
                }
            }

            // -----------------------------------------------------------------

            else {
                displayError(`Unknown mode for site.`);
                ß.data.errorState = 1;

                return; // eslint-disable-line no-useless-return
            }

            // -----------------------------------------------------------------

            requestPromise.then(async () => {
                setReleaseInfo();
                await setTracksInfo();
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

    (function loader () {
        ß.data.MODE = ((test) => {
            switch (test) {
            case typeof extraSettingsToPost === `string`:
                return `SG2`;
            case typeof preMeta === `string`:
                return `SG3`;
            case typeof SG3_Config === `object`:
                return `SG3`;
            default:
                return `unknown`;
            }
        })(true);

        const waitForMenu = async () => {
                const noLibraryVar = document.querySelector(`#librariesSortable, #leftNavContainer`),
                    hasLibraryVar = document.querySelector(`.searchlanding`);

                if (noLibraryVar !== null || (hasLibraryVar !== null && typeof libraries === `string`)) {
                    clearInterval(checker); // eslint-disable-line no-use-before-define
                    await populateLabelDB();
                    setListener(noLibraryVar || hasLibraryVar);
                }
            },
            checker = setInterval(waitForMenu, 100);
    }());
}());

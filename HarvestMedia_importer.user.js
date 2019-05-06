// ==UserScript==
// @name           Import Harvest Media SG2/SG3/LIVE release listings to MusicBrainz
// @description    Add a button to import Harvest Media (LIVE, SG2 & SG3-based servers) release listings to MusicBrainz
// @version        2019.5.5.1
// @include        http*://live.harvestmedia.net*
// @include        http*://www.westonemusic.com*
// @include        http*://echomusicpg.sg2.harvestmedia.net*
// @include        http*://indiesonics.sg2.harvestmedia.net*
// @include        http*://liftmusic.sg2.harvestmedia.net*
// @include        http*://attentionmusic.sg3.harvestmedia.net*
// @include        http*://redigloomusic.sg2.harvestmedia.net*
// @include        http*://search.twelvetonesproductionmusic.com*
// @include        http*://sg2.harvestmedia.net*
// @include        http*://sg3.harvestmedia.net*
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
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/HarvestMedia_importer.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/HarvestMedia_importer.user.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/utility_functions.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_artists.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/dict_labels.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimport.js
// @require        https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/lib/mbimportstyle.js
// @icon           https://raw.githubusercontent.com/murdos/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

(function strictWrapper () { // eslint-disable-line max-statements

    'use strict';

    const GET = `GET`,
        POST = `POST`;

    const displayError = function displayError (errMsg) {
        // -----------------------------------------------------------------

        if (ß.data.MODE === `LIVE`) {
            // TO DO
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG2`) {
            document.querySelector(`.albumTrackView_AlbumInfoCenter`)
                .appendChild(ß.makeFragmentFromString(`<div id="importError" style="color:red;font-size:125%;font-weight:900;"><br>${errMsg}</div>`));
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG3`) {
            // TO DO
        }

        // -----------------------------------------------------------------

        else console.log(errMsg); // eslint-disable-line curly, no-console

        // -----------------------------------------------------------------
    };

    const setBadMode = () => {
        displayError(`Unknown mode for site.`);
        ß.data.errorState = 1;
    };

    const populateLabelDB = async function populateLabelDB () {
        if (!Object.prototype.hasOwnProperty.call(ß.data, `LABELS`)) {
            ß.data.LABELS = [];

            // -----------------------------------------------------------------

            if (ß.data.MODE === `LIVE`) {
                await fetch(`${document.location.origin}/content/library_list.aspx?${ß.makeArgString(ß.data.reqArgs)}`, {
                    body: null,
                    cache: `force-cache`,
                    method: GET
                })
                    .then((txt) => txt.text())
                    .then((txt) => ß.makeFragmentFromString(txt))
                    .then((frag) => {
                        const libraryNodes = frag.querySelectorAll(`.ListTextLibrary`);

                        ß.data.LABELS = [...libraryNodes].map((node) => ({
                            id: node.getAttribute(`id`).split(`_`).pop(),
                            name: node.innerText
                        }));
                    });
            }

            // -----------------------------------------------------------------

            else if (ß.data.MODE === `SG2`) {

                await fetch(`${document.location.origin}//Handler/GetLeftMenuItems.ashx?type=library`, {
                    body: null,
                    cache: `force-cache`,
                    method: GET
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
                        method: POST
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

            else setBadMode(); // eslint-disable-line curly

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
        });

        // -----------------------------------------------------------------

        if (ß.data.MODE === `LIVE`) {
            ß.data.url = `${document.location.origin}/player.aspx?${ß.makeArgString(ß.data.reqArgs)}`;
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG2`) {
            ß.data.url = `${document.location.origin}/album/${data.IdEnc}${document.location.search}`;
            Object.assign(ß.data, ß.extractDMY(new Date(data.ReleaseDate || data.albumReleased)));
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG3`) {
            ß.data.url = document.location.href;
            Object.assign(ß.data, ß.extractDMY(new Date(data.ReleaseDate || data.albumReleased)));
        }

        // -----------------------------------------------------------------

        else {
            displayError(`Unknown mode for site.`);
            ß.data.errorState = 1;

            return; // eslint-disable-line no-useless-return
        }
    };

    const setTracksInfo = async function setTracksInfo () {
        const data = ß.data.TRACK_JSON,
            getArtistForTrack = (trackID) => {
                const artist = ß.data.MOREINFO_HTML
                    .querySelector(`.moreInfoRow[objectid="${trackID}"]`)
                    .querySelector(`.composerinfo`)
                    .nextSibling
                    .textContent;

                return artist.length
                    ? artist
                    : `unknown`; // Artist name field in the data is blank
            };

        ß.data.trackNumbers = new Set();

        for (const track of data) {

            // -----------------------------------------------------------------

            if (ß.data.MODE === `LIVE`) {
                const number = parseInt(track.tracknumber, 10),
                    trackID = ß.data.MOREINFO_HTML.querySelector(`#album_contentid_${number - 1}`).value;

                ß.data.tracks.push({
                    artist: ß.unSortnameString(ß.data.MOREINFO_HTML.querySelector(`#album_composer_${trackID}`).value),
                    duration: ß.formatSeconds(track.duration),
                    number,
                    title: ß.unentity(track.title).toLowerCase()
                });
                ß.data.trackNumbers.add(number);
            }

            // -----------------------------------------------------------------

            else if (ß.data.MODE === `SG2`) {
                const titlePattern1 = /.*trk(?<number>\d+)\s(?<title>.+)/iu,
                    titlePattern2 = /^(?<number>\d+)\s(?:-\s)?(?<title>.+)/u,
                    splitTitle = track.title.split(titlePattern1),
                    [number, title] = ((arr) => [parseInt(arr[1], 10), arr[2]])(splitTitle.length === 1
                        ? track.title.split(titlePattern2)
                        : splitTitle);

                let artist; // eslint-disable-line init-declarations

                try {
                    artist = getArtistForTrack(track.id);
                }
                catch (err) { // The track ID isn't in the artist info
                    ß.data.errorState = 1;
                    displayError(`The release listing has incomplete artist information.`);

                    return;
                }

                ß.data.tracks.push({
                    artist,
                    duration: ß.formatSeconds(track.duration),
                    number,
                    title
                });
                ß.data.trackNumbers.add(number);
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
                        method: POST
                    })
                        .then((txt) => txt.text())
                        .then((blob) => eval(blob)) // eslint-disable-line no-eval
                        .then((obj) => trackObj.artist = obj.trackComposers); // eslint-disable-line no-return-assign
                }

                ß.data.tracks.push(trackObj);
                ß.data.trackNumbers.add(trackObj.number);
            }

            // -----------------------------------------------------------------

            else setBadMode(); // eslint-disable-line curly
        }

        const highestTrackNumber = Math.max(...ß.data.trackNumbers);

        if (highestTrackNumber !== ß.data.tracks.length) {
            displayError(`The release listing is incomplete.  Highest track number is ${highestTrackNumber}, but only ${ß.data.tracks.length} tracks are listed.`);
            ß.data.errorState = 2; // Recoverable error

            const missingTracks = ß.getArrayDifference(ß.makeSequentialIntFilledArray(highestTrackNumber, 1), ß.data.trackNumbers);

            missingTracks.forEach((i) => ß.data.tracks.push({
                artist: `unknown`,
                number: i,
                title: `[unknown]`
            }));
        }
    };

    const makeImportButton = function makeImportButton () {
        const parameters = ß.buildImportButton({ site: `Harvest Media` }),
            mbButton = MBImport.buildFormHTML(parameters);

        // -----------------------------------------------------------------

        // The entire page is contained in a form already.  By placing the MB button's form in the shadow DOM, we can bypass the restriction on placing forms inside of forms in the DOM.

        let mbBtnPos; // eslint-disable-line init-declarations

        // -----------------------------------------------------------------

        if (ß.data.MODE === `LIVE`) {
            if (document.querySelector(`#mbPos`) === null) {
                document.querySelector(`#tblNavBar`).parentNode.parentNode.nextElementSibling.querySelector(`td`)
                    .appendChild(ß.makeFragmentFromString(`<div id="mbPos" style="white-space: nowrap;">`));
            }
            mbBtnPos = document.querySelector(`#mbPos`);
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG2`) {
            mbBtnPos = document.querySelector(`.albumTrackView_AlbumInfoRightTop`);
            mbBtnPos.setAttribute(`id`, `mbPos`);
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG3`) {
            if (document.querySelector(`#mbPos`) === null) {
                document.querySelector(`.searchBar__icons, .album-code-information`)
                    .appendChild(ß.makeFragmentFromString(`<div id="mbPos" style="width: 100px; height: 30px; white-space: nowrap;">`));
            }
            mbBtnPos = document.querySelector(`#mbPos`);
        }

        // -----------------------------------------------------------------

        else setBadMode(); // eslint-disable-line curly

        // -----------------------------------------------------------------

        const mbForm = ß.makeFragmentFromString(`<br><div id="importButton" >${mbButton}</div>`);

        if (ß.data.errorState === 2) { // Missing tracks
            mbForm.querySelector(`span`).textContent = `Import anyway`;
        }

        if (!mbBtnPos.shadowRoot) {
            mbBtnPos.attachShadow({mode: `open`});
        }

        mbBtnPos.shadowRoot.appendChild(mbForm);
    };

    const setListener = function setListener (albumMenuNode) {
        albumMenuNode.addEventListener(`click`, (e) => {
            let albumID, requestPromise, objectcode; // eslint-disable-line init-declarations

            // <-- Clean up anything from any previous release that may have been loaded this session
            const mbBtnPos = document.querySelector(`#mbPos`);

            ß.deleteNode(`#importError`);
            Object.prototype.hasOwnProperty.call(ß.data, `reqArgs`) && Object.prototype.hasOwnProperty.call(ß.data.reqArgs, `collectionid`) && (ß.data.reqArgs.collectionid = ``);
            mbBtnPos !== null && mbBtnPos.shadowRoot && (mbBtnPos.shadowRoot.innerHTML = ``); // Remove any pre-existing buttons
            // --> Finished cleaning up

            if (e.target.tagName === `A`) {
                albumID = e.target.getAttribute(`objectid`) || e.target.getAttribute(`objectname`); // generic SG2 sites
                if (albumID === null) {
                    if (ß.data.MODE === `LIVE`) { // LIVE
                        ß.data.reqArgs.collectionid = albumID = e.target.getAttribute(`onclick`).match(/'(.+)'/u)[1]; // eslint-disable-line no-multi-assign
                    }
                    else { // West One Music, (others?)
                        const shareLink = e.target.parentNode.parentNode.querySelector(`.share-button`);

                        if (shareLink !== null) {
                            albumID = shareLink.getAttribute(`objectid`);
                            objectcode = shareLink.getAttribute(`objectcode`);
                        }
                    }
                }
            }
            else if (e.target.tagName === `DIV` && !e.target.classList.contains(`leftMenuPanelItemRow__title--1`)) { // SG3
                albumID = e.target.parentNode.parentNode.getAttribute(`object-id`);
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

            else if (ß.data.MODE === `LIVE`) {
                requestPromise = fetch(`${document.location.origin}/content/album.aspx?${ß.makeArgString(ß.data.reqArgs)}`, {
                    body: null,
                    cache: `force-cache`,
                    method: GET
                })
                    .then((txt) => txt.text())
                    .then((html) => {
                        ß.data.MOREINFO_HTML = ß.makeFragmentFromString(html);
                    })
                    .then(() => eval(ß.data.MOREINFO_HTML.querySelector(`#spanJSON_album`).textContent).playlist_all) // eslint-disable-line no-eval
                    .then((json) => {
                        const relData = json[0].collectionname.match(/^(\w+)\s(.+)/u);

                        Object.defineProperties(ß.data, {
                            ALBUM_JSON: {
                                value: Object.freeze({
                                    albumCode: relData[1],
                                    albumLibraryName: json[0].cataloguename,
                                    albumName: relData[2]
                                }),
                                writable: true
                            },
                            TRACK_JSON: {
                                value: Object.freeze(json),
                                writable: true
                            }
                        });
                    });
            }

            // -----------------------------------------------------------------

            else if (ß.data.MODE === `SG2`) {
                requestPromise = fetch(`${document.location.origin}//Handler/GetTracksPostMethod.ashx`, {
                    headers: {
                        'content-type': `application/x-www-form-urlencoded; charset=UTF-8`
                    },
                    body: `type=album_tracks&id=${albumID}&isheader=false`,
                    method: POST
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
                        method: POST
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

                // -----------------------------------------------------------------

                else { // West One Music, (others?)
                    requestPromise = fetch(`${document.location.origin}/Handlers/GetAlbum.ashx`, {
                        body: `albumCode=${objectcode}&libraries=${encodeURI(libraries)}`,
                        headers: new Headers({'content-type': `application/x-www-form-urlencoded;charset=UTF-8`}),
                        method: POST
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

            else setBadMode(); // eslint-disable-line curly

            // -----------------------------------------------------------------

            requestPromise.then(async () => {
                setReleaseInfo();
                await setTracksInfo();
                if (ß.data.errorState !== 1) {
                    ß.sortTracks();
                    ß.cleanTrackArtists();
                    ß.lookupTrackArtists();
                    ß.setReleaseArtist();
                    makeImportButton();
                }
            });
        });
    };

    // Sets any site-specific info needed to start doing fetch requests
    const getSiteSettings = () => {
        // -----------------------------------------------------------------

        if (ß.data.MODE === `LIVE`) {
            ß.data.reqArgs = {
                acctid: document.querySelector(`#acctid`).value,
                macctid: document.querySelector(`#macctid`).value,
                sorttype: `MY`
            };
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG2`) {
            // None currently
        }

        // -----------------------------------------------------------------

        else if (ß.data.MODE === `SG3`) {
            // None currently
        }

        // -----------------------------------------------------------------

        else setBadMode(); // eslint-disable-line curly

        // -----------------------------------------------------------------
    };

    (function loader () {
        ß.data.MODE = ((test) => {
            switch (test) {
            case typeof auditionOnly === `function`:
                return `LIVE`;
            case typeof extraSettingsToPost === `string`:
                return `SG2`;
            case typeof preMeta === `string` || typeof SG3_Config === `object`:
                return `SG3`;
            default:
                return `unknown`;
            }
        })(true);

        const waitForMenu = async () => {
                const noLibraryVar = document.querySelector(`#librariesSortable, #leftNavContainer, .jspPane`),
                    hasLibraryVar = document.querySelector(`.searchlanding`);

                if (noLibraryVar !== null || (hasLibraryVar !== null && typeof libraries === `string`)) {
                    clearInterval(checker); // eslint-disable-line no-use-before-define
                    getSiteSettings();
                    await populateLabelDB();
                    setListener(noLibraryVar || hasLibraryVar);
                }
            },
            checker = setInterval(waitForMenu, 100);
    }());
}());

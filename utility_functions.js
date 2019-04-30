// ==UserScript==
// @name           Utility functions
// @version        2019.4.30.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/utility_functions.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/utility_functions.js
/* globals         MBImport */
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
/* eslint          no-extra-parens: ["error", "all", { "nestedBinaryExpressions": false }] */
/* eslint          no-inline-comments: off */
/* eslint          no-invalid-this: off */
/* eslint          no-magic-numbers: off */
/* eslint          no-param-reassign: off */
/* eslint          no-plusplus: off */
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
// ==/UserScript==

const ß = {};

(function strictWrapper () {
    'use strict';

    Object.defineProperties(String.prototype, { // eslint-disable-line no-extend-native
        /**
         * Removes a string or regex match from a string.
         * @extends external:String
         * @param {string|regex} matcher - The match expression to remove
         */
        remove: {
            value: function value (matcher) {
                return this.replace(matcher, ``);
            }
        },

        /**
         * Converts a string to titlecase.
         * @extends external:String
         */
        toTitleCase: {
            value: function value () {
                return this.toLowerCase()
                    .split(` `)
                    .map((a) => a.substr(0, 1).toUpperCase() + a.substr(1))
                    .join(` `);
            }
        }
    });

    Object.defineProperties(NodeList.prototype, { // eslint-disable-line no-extend-native
        /**
         * Wrapper for Array.from to allow cleaner chaining
         * @extends external:NodeList
         */
        toArray: {
            value: function value () { // A little more complex, but over 8x faster vs Array.from
                const arrLen = this.length,
                    newArray = Array(arrLen);

                for (let i = 0; i < arrLen; i++) {
                    newArray[i] = this[i];
                }

                return newArray;
            }
        }
    });

    Object.assign(ß, {
        data: {},

        /**
         * Wrapper for handling track scraping.
         * @param {Object} obj - An object containing 2 properties
         * @param {string} obj.trackSelector - A selector {string} that selects all (or a group of) tracks
         * @param {function} obj.trackParser - A function that extracts to an {object} the data for a single track
         * @returns {Array} - Array of objects, one for each track's data
        */
        getTracks: (obj) => {
            const allTracks = Object.freeze(document.querySelectorAll(obj.trackSelector).entries()),
                trackDB = [];

            for (const [, element] of allTracks) {
                trackDB.push(obj.trackParser(element));
            }

            return trackDB;
        },

        // Sorts the track array by track number
        sortTracks () { ß.data.tracks = ß.data.tracks.sort((first, second) => parseInt(first.number, 10) - parseInt(second.number, 10)); },

        // Sets the total number of tracks to the number of tracks in the track array.
        // Warning: If the tracklist is incomplete on the site, this number may NOT be the same as the total number of tracks on the release!
        setTotalTracks () { ß.data.totalTracks = ß.data.tracks.length; },

        // Turns artist data for each tracks into an array of artist names.
        cleanTrackArtists () {
            // Turn variations of 'Foo Bar (BMI) 25% [362303688], Caz Dip (ASCAP) 75% [12345678]' into 'Foo Bar, Caz Dip'
            const cleanArtistInfo = (str) => str
                .remove(/\[\d+\]/gu)
                .remove(/(\(…|\s)\d+%/gu) // handle the normal ' 50%' as well as ' (…50%'
                .remove(new RegExp([
                    `APRA`,
                    `ASCAP`,
                    `BMI`,
                    `BUMA`,
                    `GEMA`,
                    `KODA`,
                    `PPL`,
                    `PRS`,
                    `SACM`,
                    `SACEM`,
                    `SESAC`,
                    `SOCAN`,
                    `STEMRA`
                ].join(`|`), `gu`))
                .remove(/\(\)/gu)
                .remove(/\s+(?=,)/gu)
                .trim();

            // Converts artist data into an array of artist names
            const buildArtistArray = (data) => // eslint-disable-next-line implicit-arrow-linebreak
                [Array.isArray(data)
                    ? data
                    : data.split(/\s*,(?!\s?jr)\s*/gu)
                ].flat()
                    .map((name) => name.toTitleCase());

            ß.data.artistList = new Set();

            for (const track of ß.data.tracks) {
                if (Array.isArray(track.artist)) {
                    for (let arrayEntry of track.artist) {
                        arrayEntry = cleanArtistInfo(arrayEntry);
                    }
                }
                else {
                    track.artist = buildArtistArray(cleanArtistInfo(track.artist));
                }
                track.artist = track.artist.sort();
                ß.data.artistList.add(JSON.stringify(track.artist));
            }
        },

        lookupTrackArtists () {
            const getJoinPhrase = (artistList, i) => {
                if (artistList.length > 1) {
                    if (artistList.length - 1 !== i) {
                        return artistList.length - 2 === i
                            ? ` & `
                            : `, `;
                    }
                } // else

                return ``;
            };

            for (const track of ß.data.tracks) {
                if (track.artist === `unknown`) {
                    track.artist_credit = [MBImport.specialArtist(`unknown`)];
                }
                else {
                    const creditArray = [];

                    for (const [i, name] of [...track.artist].entries()) {
                        const credit = {
                            artist_name: name.toTitleCase(),
                            joinphrase: getJoinPhrase(track.artist, i),
                            mbid: ß.artistDB.get(name.toLowerCase()) || ``
                        };

                        creditArray.push(credit);
                    }
                    track.artist_credit = creditArray;
                }
            }
        },

        // Sets the release artist
        setReleaseArtist () {
            ß.data.releaseArtist = ß.data.artistList.size === 1 // How many artists for for release's tracks?
                ? ß.data.tracks[0].artist_credit // One
                : [MBImport.specialArtist(`various_artists`)]; // Multiple
        },

        // eslint-disable-next-line max-params
        getXForLabel: (lookup, searchField, retVal = searchField, fallback = ``) => {
            const match = ß.labelDB.filter((label) => label[searchField] === lookup);

            return match.length
                ? match[0][retVal]
                : fallback;
        },

        getCountryForLabel: (lookup) => ß.getXForLabel(lookup, `name`, `country`),

        getLabelFromPrefix: (lookup, fallback) => ß.getXForLabel(lookup, `prefix`, `name`, fallback),

        buildLabelCredit: () => {
            const label = ß.labelDB.filter((labelEntry) => labelEntry.name === ß.data.label.toLowerCase());

            if (typeof label === `undefined` || !label.length) {
                return [{
                    catno: ß.data.catNum,
                    name: ß.data.label.toTitleCase()
                }];
            } // else

            return [{
                catno: ß.data.catNum,
                country: `country` in label[0]
                    ? label[0].country
                    : ``,
                mbid: label[0].mbid,
                name: label[0].name
            }];
        },

        buildReleaseObject: (format = `CD`) => {
            const releaseObj = {
                title: ß.data.releaseName.replace(/\s+(?:-\s)?Vol(?:ume)?\.?\s/ui, `, Volume `),
                artist_credit: ß.data.releaseArtist,
                type: `album`,
                status: `official`,
                language: `eng`,
                script: `Latn`,
                year: ß.data.year || ``,
                month: ß.data.month || ``,
                day: ß.data.day || ``,
                labels: ß.buildLabelCredit(),
                urls: [{
                    url: ß.data.url,
                    link_type: 288
                }],
                discs: [{
                    format,
                    tracks: ß.data.tracks
                }]
            };

            releaseObj.country = releaseObj.labels[0].country;

            return releaseObj;
        },

        buildImportButton: (args) => {
            const edit_note = MBImport.makeEditNote(ß.data.url, args.site, ``, `https://github.com/brianfreud/Userscripts/`),
                releaseObj = ß.buildReleaseObject(args.type || `Digital Media`);

            return MBImport.buildFormParameters(releaseObj, edit_note);
        },

        extractDMY: (date) => ({
            day: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear()
        }),

        convertUNIXDate: (seconds) => {
            const date = new Date(seconds * 1000); // multiply by 1000 to convert seconds to ms for Date()

            return ß.extractDMY(date);
        },

        formatSeconds: (seconds) => {
            seconds = Math.round(seconds);

            return ((seconds - (seconds %= 60)) / 60) + (seconds > 9
                ? `:`
                : `:0`) + seconds;
        },

        unSortname: (str) => { // Turns "Jones, Bob" back into "Bob Jones"
            const name = str.split(`,`)
                .map((a) => a.trim());

            return [name.splice(-1), name].flat().join(` `);
        },

        // Turn ["Jones, Bob"] into ["bob jones"]
        unSortnameArray: (arr) => arr.map((name) => ß.unSortname(name.toLowerCase())),

        // Turn "Bar, Foo / Jones, Bob" into "foo bar, bob jones"
        unSortnameSlashString: (str) => str.split(`/`).map((name) => ß.unSortname(name)).join(`, `),

        // Turns a string of HTML into a DOMFragment
        makeFragmentFromString (str) {
            const template = document.createElement(`template`);

            template.innerHTML = str;

            return template.content;
        },

        // Deletes a node from the DOM
        deleteNode (selector) {
            const node = document.querySelector(selector);

            (node !== null) && node.remove();
        }
    });
}());

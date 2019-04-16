// ==UserScript==
/* globals MBImport, $ */
// @name           Utility functions
// @version        2019.4.16.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/utility_functions.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/utility_functions.js
/* eslint          array-bracket-newline: off */
/* eslint          array-element-newline: off */
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
/* eslint          no-extra-parens: ["error", "all", { "nestedBinaryExpressions": false }] */
/* eslint          no-inline-comments: off */
/* eslint          no-invalid-this: off */
/* eslint          no-magic-numbers: off */
/* eslint          no-param-reassign: off */
/* eslint          no-plusplus: off */
/* eslint          no-ternary: off */
/* eslint          no-whitespace-before-property: off */
/* eslint          padded-blocks: off */
/* eslint          prefer-destructuring: off */
/* eslint          prefer-named-capture-group: off */
/* eslint          quote-props: ["error", "as-needed"] */
/* eslint          quotes: ["error", "backtick"] */
/* eslint          sort-keys: off */
/* eslint          sort-vars: off */
/* eslint          spaced-comment: off */
// ==/UserScript==

const ß = {};

(function strictWrapper () {
    'use strict';

    Object.assign(ß, {
        data: {},

        buildArtistCredit: (names) => {
            const creditArr = [];

            for (const [i, name] of [...names].entries()) {
                if (name === `various_artists` || name === `unknown`) {
                    creditArr.push(MBImport.specialArtist(name));
                } else {
                    const creditObj = {
                        artist_name: ß.toTitleCase(name),
                        mbid: ß.artistDB[name.toLowerCase()] || ``
                    };

                    if (names.length > 1) {
                        if (names.length - 1 !== i) {
                            creditObj.joinphrase = names.length - 2 === i
                                ? ` & `
                                : `, `;
                        }
                    }
                    creditArr.push(creditObj);
                }
            }

            return creditArr;
        },

        buildLabelCredit: () => {
            const label = ß.labelDB.filter((p) => p.name === ß.data.label.toLowerCase()); // Find any label's specific object, if it is in the labelDB array

            if (typeof label === `undefined` || !label.length) {
                return [{
                    catno: ß.data.catNum,
                    name: ß.toTitleCase(ß.data.label)
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

        buildTracklistArray: () => {
            const trackArray = [];

            ß.data.tracks = [...new Set(ß.data.tracks)];

            for (const track of ß.data.tracks) {
                if (typeof track !== `undefined`) {
                    trackArray.push({
                        number: track[1],
                        title: track[2],
                        duration: track[4],
                        artist_credit: ß.buildArtistCredit(track[3])
                    });
                }
            }

            return trackArray;
        },

        buildReleaseObject: (format = `CD`) => {
            const releaseObj = {
                title: ß.data.releaseName.replace(` - Volume`, `, Volume`),
                artist_credit: ß.buildArtistCredit(ß.data.releaseArtist),
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
                    tracks: ß.buildTracklistArray()
                }]
            };

            releaseObj.country = releaseObj.labels[0].country;

            return releaseObj;
        },

        formatSeconds: (seconds) => ((seconds - (seconds %= 60)) / 60) + (seconds > 9
            ? `:`
            : `:0`) + seconds,

        toTitleCase: (str) => str
            .toLowerCase()
            .split(` `)
            .map((word) => word.substr(0, 1).toUpperCase() + word.substr(1))
            .join(` `),

        unSortname: (str) => { // Turns "Jones, Bob" back into "Bob Jones"
            const name = str.split(`,`)
                .map((a) => a.trim());

            return [name.splice(-1), name].flat().join(` `);
        },

        // Turn ["Jones, Bob"] into ["bob jones"]
        unSortnameArray: (arr) => arr.map((name) => ß.unSortname(name.toLowerCase())),

        getIDText: (str) => ß.$getID(str).text(),

        $getTDs: (node) => $(node).find(`td`),

        getTDText: ($nodes, i) => $.trim($nodes.eq(i).text()),

        buildImportTools: (prefix = ``) => {
            Object.assign(ß, {
                $getID: (str) => $(`#${prefix}${str}`)
            });
        }
    });
}());

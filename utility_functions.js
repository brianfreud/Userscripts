// ==UserScript==
/* globals artistDB, labelDB, MBImport */
// @name           Utility functions
// @version        2019.3.18.1
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/utility_functions.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/utility_functions.js
// ==/UserScript==

window.buildArtistCredit = (name) => {
        // TODO: Find a release with multiple artists on a track / handle multiple artist credits

        let creditObj = {
            artist_name: name,
            credited_name: name,
            mbid: name in artistDB ? artistDB[name] : '',
            joinphrase: ''
        };

        if (name === 'various_artists' || name === 'unknown') {
            Object.assign(creditObj, MBImport.specialArtist(name));
        }
        return creditObj;
    },
    
    buildLabelCredit = (infoObj) => {
        const label = infoObj.label;
        return [{
            catno: infoObj.catNum,
            mbid: label in labelDB ? labelDB[label] : '',
            name: label
        }];
    },
    
    buildTracklistArray = (infoObj) => {
        let trackArray = [];

        infoObj.tracks = [...new Set(infoObj.tracks)];

        for (let track of infoObj.tracks) {
            if (track !== undefined) {
                trackArray.push({
                    number: track[1],
                    title: track[2],
                    duration: track[4],
                    artist_credit: [buildArtistCredit(track[3])]
                });
            }
        }
        return trackArray;
    },
    
    buildReleaseObject = (infoObj, format = 'CD') => {
        return {
            title: infoObj.releaseName,
            artist_credit: [buildArtistCredit(infoObj.releaseArtist)],
            type: 'album',
            status: 'official',
            language: 'eng',
            script: 'Latn',
            labels: buildLabelCredit(infoObj),
            urls: [{
                url: infoObj.url,
                link_type: 288
            }],
            discs: [{
                format: format,
                tracks: buildTracklistArray(infoObj)
            }, ]
        };
    };
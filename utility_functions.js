// ==UserScript==
/* globals MBImport */
// @name           Utility functions
// @version        2019.3.18.7
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/utility_functions.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/utility_functions.js
// ==/UserScript==

const ß = {

    data: {},

    buildArtistCredit: (name) => {
        // TODO: Find a release with multiple artists on a track / handle multiple artist credits

        let creditObj = {
            artist_name: name,
            credited_name: name,
            mbid: name in ß.artistDB ? ß.artistDB[name] : '',
            joinphrase: ''
        };

        if (name === 'various_artists' || name === 'unknown') {
            Object.assign(creditObj, MBImport.specialArtist(name));
        }
        return creditObj;
    },

    buildLabelCredit: () => {
        const label = ß.labelDB.filter(p => p.name.toLowerCase() == ß.data.label); // Find any label's specific object, if it is in the labelDB array
        return [{
            catno: ß.data.catNum,
            mbid: !!label.length ? label[0].mbid : '',
            name: label[0].name
        }];
    },

    buildTracklistArray: () => {
        let trackArray = [];

        ß.data.tracks = [...new Set(ß.data.tracks)];

        for (let track of ß.data.tracks) {
            if (track !== undefined) {
                trackArray.push({
                    number: track[1],
                    title: track[2],
                    duration: track[4],
                    artist_credit: [ß.buildArtistCredit(track[3])]
                });
            }
        }
        return trackArray;
    },

    buildReleaseObject: (format = 'CD') => {
        return {
            title: ß.data.releaseName,
            artist_credit: [ß.buildArtistCredit(ß.data.releaseArtist)],
            type: 'album',
            status: 'official',
            language: 'eng',
            script: 'Latn',
            labels: ß.buildLabelCredit(),
            urls: [{
                url: ß.data.url,
                link_type: 288
            }],
            discs: [{
                format: format,
                tracks: ß.buildTracklistArray()
            }, ]
        };
    },

    toTitleCase: (str) => {
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.substr(0, 1).toUpperCase() + word.substr(1,))
            .join(' ');
    },

    getIDText: (str) => ß.$getID(str).text(),

    $getTDs: (node) => $(node).find('td'),

    getTDText: ($nodes, i) => $.trim($nodes.eq(i).text()),

    buildImportTools: (prefix = '') => {
        Object.assign(ß, {
            $getID: (str) => $(`#${prefix}${str}`),
        });
    }
};

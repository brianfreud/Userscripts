// ==UserScript==
/* globals         $ */
// @author         Brian Schweitzer
// @name           Show logo image on label pages at MusicBrainz
// @description    Show logo image on label pages at MusicBrainz, if the AR exists
// @version        2019.3.23.1
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/ShowLogoOnLabelPage.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/ShowLogoOnLabelPage.user.js
// @include        http*://musicbrainz.org/label/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js

// ==/UserScript==

(() => {
    let url = document.URL.split('/');
    $.getJSON(`${url[0]}//musicbrainz.org/ws/2/label/${url[4]}?inc=url-rels&fmt=json`, (data) => {
        let ar = data.relations.filter(ar => ar.type == 'logo');
        if (0 < ar.length) {
            $('.commons-image').append(`<img src="${ar[0].url.resource}"/>`);
        }
    });
})();

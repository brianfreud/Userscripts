// ==UserScript==
// @author         Brian Schweitzer
// @name           Show logo image on label pages at MusicBrainz
// @description    Show logo image on label pages at MusicBrainz, if the AR exists
// @version        2019.4.7.0
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/master/ShowLogoOnLabelPage.user.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/master/ShowLogoOnLabelPage.user.js
// @include        http*://musicbrainz.org/label/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require        https://raw.githubusercontent.com/brianfreud/Userscripts/master/getAverageRGB.js
/* global          $, getAverageRGB */
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
/* eslint          yoda: off */
// ==/UserScript==

{

    const url = document.URL.split(`/`);

    $.getJSON(`${url[0]}//musicbrainz.org/ws/2/label/${url[4]}?inc=url-rels&fmt=json`, (data) => {
        'use strict';

        const ar = data.relations.filter((rel) => rel.type === `logo`);

        if (0 < ar.length) {

            const imageURL = ar[0].url.resource,
                img = new Image(),
                src = `https://cors-anywhere.herokuapp.com/${imageURL}`;

            $(`.commons-image`).append(`<img style="max-width: 215px;" src="${imageURL}" class="LabelLogo"/>`);

            // Solve the issue of all-white logos not being visible against the background

            img.onload = function onload () {

                const RGB = getAverageRGB(img),
                    rangeMin = 70,
                    rangeMax = 110,
                    rangeCheck = (val) => rangeMin <= val && rangeMax >= val;

                if (rangeCheck(RGB.r) && rangeCheck(RGB.g) && rangeCheck(RGB.b)) {

                    $(`.LabelLogo`).css(`filter`, `invert(100%)`);

                }

            };

            img.crossOrigin = ``;
            img.src = src;

        }

    });

}

// ==UserScript==
/* globals ß */
// @name           Script dictionary
// @version        2019.3.31.1
// @namespace      https://github.com/brianfreud
// @downloadURL    https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/dict_scripts.js
// @updateURL      https://raw.githubusercontent.com/brianfreud/Userscripts/edit/master/dict_scripts.js
// ==/UserScript==

'ß' in window || let ß = { data: {} };

ß.scripts = [
    { code: 'Adlm', name: 'Adlam' },
    { code: 'Aghb', name: 'Caucasian Albanian' },
    { code: 'Ahom', name: 'Ahom' },
    { code: 'Arab', name: 'Arabic' },
    { code: 'Armi', name: 'Imperial Aramaic' },
    { code: 'Armn', name: 'Armenian' },
    { code: 'Avst', name: 'Avestan' },
    { code: 'Bali', name: 'Balinese' },
    { code: 'Bamu', name: 'Bamum' },
    { code: 'Bass', name: 'Bassa Vah' },
    { code: 'Batk', name: 'Batak' },
    { code: 'Beng', name: 'Bengali' },
    { code: 'Bhks', name: 'Bhaiksuki' },
    { code: 'Bopo', name: 'Bopomofo' },
    { code: 'Brah', name: 'Brahmi' },
    { code: 'Brai', name: 'Braille' },
    { code: 'Bugi', name: 'Buginese' },
    { code: 'Buhd', name: 'Buhid' },
    { code: 'Cakm', name: 'Chakma' },
    { code: 'Cans', name: 'Canadian Syllabics' },
    { code: 'Cari', name: 'Carian' },
    { code: 'Cham', name: 'Cham' },
    { code: 'Cher', name: 'Cherokee' },
    { code: 'Copt', name: 'Coptic' },
    { code: 'Cprt', name: 'Cypriot' },
    { code: 'Cyrl', name: 'Cyrillic' },
    { code: 'Deva', name: 'Devanagari' },
    { code: 'Dogr', name: 'Dogra' },
    { code: 'Dsrt', name: 'Deseret' },
    { code: 'Dupl', name: 'Duployan' },
    { code: 'Egyp', name: 'Egyptian Hieroglyphs' },
    { code: 'Elba', name: 'Elbasan' },
    { code: 'Ethi', name: 'Ethiopic' },
    { code: 'Geor', name: 'Georgian' },
    { code: 'Glag', name: 'Glagolitic' },
    { code: 'Gong', name: 'Gunjala Gondi' },
    { code: 'Gonm', name: 'Masaram Gondi' },
    { code: 'Goth', name: 'Gothic' },
    { code: 'Gran', name: 'Grantha' },
    { code: 'Grek', name: 'Greek' },
    { code: 'Gujr', name: 'Gujarati' },
    { code: 'Guru', name: 'Gurmukhi' },
    { code: 'Hang', name: 'Hangul' },
    { code: 'Hani', name: 'Han' },
    { code: 'Hano', name: 'Hanunoo' },
    { code: 'Hatr', name: 'Hatran' },
    { code: 'Hebr', name: 'Hebrew' },
    { code: 'Hira', name: 'Hiragana' },
    { code: 'Hluw', name: 'Anatolian Hieroglyphs' },
    { code: 'Hmng', name: 'Pahawh Hmong' },
    { code: 'Hung', name: 'Old Hungarian' },
    { code: 'Ital', name: 'Old Italic' },
    { code: 'Java', name: 'Javanese' },
    { code: 'Kali', name: 'Kayah Li' },
    { code: 'Kana', name: 'Katakana' },
    { code: 'Khar', name: 'Kharoshthi' },
    { code: 'Khmr', name: 'Khmer' },
    { code: 'Khoj', name: 'Khojki' },
    { code: 'Knda', name: 'Kannada' },
    { code: 'Kthi', name: 'Kaithi' },
    { code: 'Lana', name: 'Tai Tham' },
    { code: 'Laoo', name: 'Lao' },
    { code: 'Latn', name: 'Latin' },
    { code: 'Lepc', name: 'Lepcha' },
    { code: 'Limb', name: 'Limbu' },
    { code: 'Lina', name: 'Linear A' },
    { code: 'Linb', name: 'Linear B' },
    { code: 'Lisu', name: 'Lisu' },
    { code: 'Lyci', name: 'Lycian' },
    { code: 'Lydi', name: 'Lydian' },
    { code: 'Mahj', name: 'Mahajani' },
    { code: 'Maka', name: 'Makasar' },
    { code: 'Mand', name: 'Mandaic' },
    { code: 'Mani', name: 'Manichaean' },
    { code: 'Marc', name: 'Marchen' },
    { code: 'Medf', name: 'Medefaidrin' },
    { code: 'Mend', name: 'Mende Kikakui' },
    { code: 'Merc', name: 'Meroitic Cursive' },
    { code: 'Mero', name: 'Meroitic Hieroglyphs' },
    { code: 'Mlym', name: 'Malayalam' },
    { code: 'Modi', name: 'Modi' },
    { code: 'Mong', name: 'Mongolian' },
    { code: 'Mroo', name: 'Mro' },
    { code: 'Mtei', name: 'Meetei Mayek' },
    { code: 'Mult', name: 'Multani' },
    { code: 'Mymr', name: 'Myanmar' },
    { code: 'Narb', name: 'Old North Arabian' },
    { code: 'Nbat', name: 'Nabataean' },
    { code: 'Newa', name: 'Newa' },
    { code: 'Nkoo', name: 'N’ko' },
    { code: 'Nshu', name: 'Nushu' },
    { code: 'Ogam', name: 'Ogham' },
    { code: 'Olck', name: 'Ol Chiki' },
    { code: 'Orkh', name: 'Old Turkic' },
    { code: 'Orya', name: 'Oriya' },
    { code: 'Osge', name: 'Osage' },
    { code: 'Osma', name: 'Osmanya' },
    { code: 'Palm', name: 'Palmyrene' },
    { code: 'Pauc', name: 'Pau Cin Hau' },
    { code: 'Perm', name: 'Old Permic' },
    { code: 'Phag', name: 'Phags-pa' },
    { code: 'Phli', name: 'Inscriptional Pahlavi' },
    { code: 'Phlp', name: 'Psalter Pahlavi' },
    { code: 'Phnx', name: 'Phoenician' },
    { code: 'Plrd', name: 'Miao' },
    { code: 'Prti', name: 'Inscriptional Parthian' },
    { code: 'Rjng', name: 'Rejang' },
    { code: 'Rohg', name: 'Hanifi Rohingya' },
    { code: 'Runr', name: 'Runic' },
    { code: 'Samr', name: 'Samaritan' },
    { code: 'Sarb', name: 'Old South Arabian' },
    { code: 'Saur', name: 'Saurashtra' },
    { code: 'Sgnw', name: 'SignWriting' },
    { code: 'Shaw', name: 'Shavian' },
    { code: 'Shrd', name: 'Sharada' },
    { code: 'Sidd', name: 'Siddham' },
    { code: 'Sind', name: 'Khudawadi' },
    { code: 'Sinh', name: 'Sinhala' },
    { code: 'Sogd', name: 'Sogdian' },
    { code: 'Sogo', name: 'Old Sogdian' },
    { code: 'Sora', name: 'Sora Sompeng' },
    { code: 'Soyo', name: 'Soyombo' },
    { code: 'Sund', name: 'Sundanese' },
    { code: 'Sylo', name: 'Syloti Nagri' },
    { code: 'Syrc', name: 'Syriac' },
    { code: 'Tagb', name: 'Tagbanwa' },
    { code: 'Takr', name: 'Takri' },
    { code: 'Tale', name: 'Tai Le' },
    { code: 'Talu', name: 'New Tai Lue' },
    { code: 'Taml', name: 'Tamil' },
    { code: 'Tang', name: 'Tangut' },
    { code: 'Tavt', name: 'Tai Viet' },
    { code: 'Telu', name: 'Telugu' },
    { code: 'Tfng', name: 'Tifinagh' },
    { code: 'Tglg', name: 'Tagalog' },
    { code: 'Thaa', name: 'Thaana' },
    { code: 'Thai', name: 'Thai' },
    { code: 'Tibt', name: 'Tibetan' },
    { code: 'Tirh', name: 'Tirhuta' },
    { code: 'Ugar', name: 'Ugaritic' },
    { code: 'Vaii', name: 'Vai' },
    { code: 'Wara', name: 'Warang Citi' },
    { code: 'Xpeo', name: 'Old Persian' },
    { code: 'Xsux', name: 'Cuneiform' },
    { code: 'Yiii', name: 'Yi' },
    { code: 'Zanb', name: 'Zanabazar Square' }
];

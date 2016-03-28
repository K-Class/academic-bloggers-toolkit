String.prototype.toTitleCase = function () {
    var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;
    return this.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function (match, index, title) {
        if (index > 0 && index + match.length !== title.length &&
            match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
            (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
            title.charAt(index - 1).search(/[^\s-]/) < 0) {
            return match.toLowerCase();
        }
        if (match.substr(1).search(/[A-Z]|\../) > -1) {
            return match;
        }
        return match.charAt(0).toUpperCase() + match.substr(1);
    });
};
var Parsers;
(function (Parsers) {
    var MainParser = (function () {
        function MainParser(data, editor) {
            this.citationFormat = data['citation-format'];
            this.PMIDquery = data['pmid-input'] !== '' && data['pmid-input'] !== undefined
                ? data['pmid-input'].replace(/\s/g, '')
                : '';
            MainParser.manualCitationType = data['manual-type-selection'];
            MainParser.includeLink = data['include-link'];
            this.editor = editor;
        }
        MainParser.prototype.fromPMID = function () {
            var requestURL = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=" + this.PMIDquery + "&version=2.0&retmode=json";
            var request = new XMLHttpRequest();
            request.open('GET', requestURL, true);
            request.addEventListener('load', this._parsePMID.bind(this));
            request.send(null);
        };
        MainParser.prototype.fromManualInput = function (data) {
            var cleanedData;
            var type = MainParser.manualCitationType;
            var authors = data.authors;
            var title = data[(type + "-title")].toTitleCase();
            var source = data[(type + "-source")];
            var pubdate = data[(type + "-date")] ? data[(type + "-date")] : '';
            var volume = data[(type + "-volume")] ? data[(type + "-volume")] : '';
            var issue = data[(type + "-issue")] ? data[(type + "-issue")] : '';
            var pages = data[(type + "-pages")] ? data[(type + "-pages")] : '';
            var lastauthor = data.authors[data.authors.length - 1].name;
            var url = data[(type + "-url")] ? data[(type + "-url")] : '';
            var accessdate = data[(type + "-accessed")] ? data[(type + "-accessed")] : '';
            cleanedData = {
                authors: authors,
                title: title,
                source: source,
                pubdate: pubdate,
                volume: volume,
                issue: issue,
                pages: pages,
                lastauthor: lastauthor,
                url: url,
                accessdate: accessdate,
            };
            var payload;
            switch (this.citationFormat) {
                case 'ama':
                    var AMA_1 = new Parsers.AMA;
                    payload = AMA_1.parse([cleanedData]);
                    break;
                case 'apa':
                    var APA_1 = new Parsers.APA;
                    payload = APA_1.parse([cleanedData]);
                    break;
                default:
                    this.editor.windowManager.alert('An error occurred while trying to parse the citation');
                    this.editor.setProgressState(0);
                    return;
            }
            console.log("OUTPUT:");
            console.log(cleanedData);
            return;
        };
        MainParser.prototype._parsePMID = function (e) {
            var req = e.target;
            if (req.readyState !== 4 || req.status !== 200) {
                this.editor.windowManager.alert('Your request could not be processed. Please try again.');
                this.editor.setProgressState(0);
                return;
            }
            var res = JSON.parse(req.responseText);
            if (res.error) {
                var badPMID = res.error.match(/uid (\S+)/)[1];
                var badIndex = this.PMIDquery.split(',').indexOf(badPMID);
                this.editor.windowManager.alert("PMID \"" + badPMID + "\" at index #" + (badIndex + 1) + " failed to process. Double check your list!");
            }
            var payload;
            switch (this.citationFormat) {
                case 'ama':
                    var AMA_2 = new Parsers.AMA;
                    payload = AMA_2.parse(res.result);
                    break;
                case 'apa':
                    var APA_2 = new Parsers.APA;
                    payload = APA_2.parse(res.result);
                    break;
                default:
                    this.editor.windowManager.alert('An error occurred while trying to parse the citation');
                    this.editor.setProgressState(0);
                    return;
            }
            if (payload.name === 'Error') {
                this.editor.windowManager.alert(payload.message);
                this.editor.setProgressState(0);
                return;
            }
            if (payload.length === 1) {
                this.editor.insertContent(payload.join());
                this.editor.setProgressState(0);
                return;
            }
            var orderedList = '<ol>' + payload.map(function (ref) { return ("<li>" + ref + "</li>"); }).join('') + '</ol>';
            this.editor.insertContent(orderedList);
            this.editor.setProgressState(0);
        };
        return MainParser;
    }());
    Parsers.MainParser = MainParser;
})(Parsers || (Parsers = {}));
var Parsers;
(function (Parsers) {
    var AMA = (function () {
        function AMA() {
        }
        AMA.prototype.parse = function (data) {
            var pmidArray = data.uids || false;
            if (pmidArray) {
                return this._fromPMID(data, pmidArray);
            }
            return this._fromManual(data);
        };
        AMA.prototype._fromPMID = function (data, pmidArray) {
            var _this = this;
            var output;
            try {
                output = pmidArray.map(function (PMID) {
                    var ref = data[PMID];
                    var year = ref.pubdate.substr(0, 4);
                    var link = Parsers.MainParser.includeLink === true
                        ? " PMID: <a href=\"http://www.ncbi.nlm.nih.gov/pubmed/" + PMID + "\" target=\"_blank\">" + PMID + "</a>"
                        : '';
                    var authors = _this._parseAuthors(ref.authors);
                    if (authors.name === 'Error') {
                        throw authors;
                    }
                    return (authors + " " + ref.title + " <em>" + ref.source + ".</em> " + year + "; ") +
                        ("" + (ref.volume === undefined || ref.volume === '' ? '' : ref.volume)) +
                        ((ref.issue === undefined || ref.issue === '' ? '' : '(' + ref.issue + ')') + ":") +
                        (ref.pages + "." + link);
                });
            }
            catch (e) {
                return e;
            }
            return output;
        };
        AMA.prototype._fromManual = function (data) {
            switch (Parsers.MainParser.manualCitationType) {
                case 'journal':
                    break;
                case 'blog':
                    break;
                case 'website':
                    break;
                default:
            }
            console.log('MADE IT DO FROM MANUAL');
            console.log(data);
            return ['unfinished'];
        };
        AMA.prototype._parseAuthors = function (authorArr) {
            var authors = '';
            switch (authorArr.length) {
                case 0:
                    return new Error("No authors were found for given reference");
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                    authors = authorArr.map(function (author) { return author.name; }).join(', ') + '.';
                    break;
                default:
                    for (var i = 0; i < 3; i++) {
                        authors += authorArr[i].name + ', ';
                    }
                    ;
                    authors += 'et al.';
            }
            return authors;
        };
        return AMA;
    }());
    Parsers.AMA = AMA;
})(Parsers || (Parsers = {}));
var Parsers;
(function (Parsers) {
    var APA = (function () {
        function APA() {
        }
        APA.prototype.parse = function (data) {
            var pmidArray = data.uids || false;
            if (pmidArray) {
                return this._fromPMID(data, pmidArray);
            }
            return this._fromManual(data);
        };
        APA.prototype._fromPMID = function (data, pmidArray) {
            var _this = this;
            var output;
            try {
                output = pmidArray.map(function (PMID) {
                    var ref = data[PMID];
                    var year = ref.pubdate.substr(0, 4);
                    var link = Parsers.MainParser.includeLink === true
                        ? " PMID: <a href=\"http://www.ncbi.nlm.nih.gov/pubmed/" + PMID + "\" target=\"_blank\">" + PMID + "</a>"
                        : '';
                    var authors = _this._parseAuthors(ref.authors, ref.lastauthor);
                    if (authors.name === 'Error') {
                        throw authors;
                    }
                    return (authors + " (" + year + "). " + ref.title + " <em>") +
                        ((ref.fulljournalname === undefined || ref.fulljournalname === '' ? ref.source : ref.fulljournalname.toTitleCase()) + ".</em>, ") +
                        ("" + (ref.volume === undefined || ref.volume === '' ? '' : ref.volume)) +
                        ((ref.issue === undefined || ref.issue === '' ? '' : '(' + ref.issue + ')') + ", ") +
                        (ref.pages + "." + link);
                });
            }
            catch (e) {
                return e;
            }
            return output;
        };
        APA.prototype._fromManual = function (data) {
            return ['unfinished'];
        };
        APA.prototype._parseAuthors = function (authorArr, lastAuthor) {
            var authors = '';
            switch (authorArr.length) {
                case 0:
                    return new Error("No authors were found for given reference");
                case 1:
                    authors = authorArr.map(function (author) {
                        return (author.name.split(' ')[0] + ", ") +
                            (author.name.split(' ')[1].split('').join('. ') + ".");
                    }).join();
                    break;
                case 2:
                    authors = authorArr.map(function (author) {
                        return (author.name.split(' ')[0] + ", ") +
                            (author.name.split(' ')[1].split('').join('. ') + ".");
                    }).join(', & ');
                    break;
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                    authors = authorArr.map(function (author, i, arr) {
                        if (i === arr.length - 1) {
                            return (("& " + author.name.split(' ')[0] + ", ") +
                                (author.name.split(' ')[1].split('').join('. ') + "."));
                        }
                        return ((author.name.split(' ')[0] + ", ") +
                            (author.name.split(' ')[1].split('').join('. ') + "., "));
                    }).join('');
                    break;
                default:
                    for (var i = 0; i < 6; i++) {
                        authors +=
                            (authorArr[i].name.split(' ')[0] + ", ") +
                                (authorArr[i].name.split(' ')[1].split('').join('. ') + "., ");
                    }
                    authors += ". . . " +
                        (lastAuthor.split(' ')[0] + ", ") +
                        (lastAuthor.split(' ')[1].split('').join('. ') + ".");
                    break;
            }
            return authors;
        };
        return APA;
    }());
    Parsers.APA = APA;
})(Parsers || (Parsers = {}));
tinymce.PluginManager.add('abt_ref_id_parser_mce_button', function (editor, url) {
    var ABT_Button = {
        type: 'menubutton',
        image: url + '/../images/book.png',
        title: 'Academic Blogger\'s Toolkit',
        icon: true,
        menu: [],
    };
    var separator = { text: '-' };
    var bibToolsMenu = {
        text: 'Bibliography Tools',
        menu: [],
    };
    var trackedLink = {
        text: 'Tracked Link',
        onclick: function () {
            var user_selection = tinyMCE.activeEditor.selection.getContent({ format: 'text' });
            editor.windowManager.open({
                title: 'Insert Tracked Link',
                width: 600,
                height: 160,
                buttons: [{
                        text: 'Insert',
                        onclick: 'submit'
                    }],
                body: [
                    {
                        type: 'textbox',
                        name: 'tracked_url',
                        label: 'URL',
                        value: ''
                    },
                    {
                        type: 'textbox',
                        name: 'tracked_title',
                        label: 'Link Text',
                        value: user_selection
                    },
                    {
                        type: 'textbox',
                        name: 'tracked_tag',
                        label: 'Custom Tag ID',
                        tooltip: 'Don\'t forget to create matching tag in Google Tag Manager!',
                        value: ''
                    },
                    {
                        type: 'checkbox',
                        name: 'tracked_new_window',
                        label: 'Open link in a new window/tab'
                    },
                ],
                onsubmit: function (e) {
                    var trackedUrl = e.data.tracked_url;
                    var trackedTitle = e.data.tracked_title;
                    var trackedTag = e.data.tracked_tag;
                    var trackedLink = ("<a href=\"" + trackedUrl + "\" id=\"" + trackedTag + "\" ") +
                        ((e.data.tracked_new_window ? 'target="_blank"' : '') + ">" + trackedTitle + "</a>");
                    editor.execCommand('mceInsertContent', false, trackedLink);
                }
            });
        }
    };
    var requestTools = {
        text: 'Request More Tools',
        onclick: function () {
            editor.windowManager.open({
                title: 'Request More Tools',
                body: [{
                        type: 'container',
                        html: "<div style=\"text-align: center;\">" +
                            "Have a feature or tool in mind that isn't available?<br>" +
                            "<a " +
                            "href=\"https://github.com/dsifford/academic-bloggers-toolkit/issues\" " +
                            "style=\"color: #00a0d2;\" " +
                            "target=\"_blank\">Open an issue</a> on the GitHub repository and let me know!" +
                            "</div>",
                    }],
                buttons: [],
            });
        }
    };
    var inlineCitation = {
        text: 'Inline Citation',
        onclick: function () {
            editor.windowManager.open({
                title: 'Inline Citation',
                url: AU_locationInfo.tinymceViewsURL + 'inline-citation.html',
                width: 400,
                height: 85,
                onClose: function (e) {
                    editor.insertContent('[cite num=&quot;' + e.target.params.data + '&quot;]');
                }
            });
        }
    };
    var formattedReference = {
        text: 'Formatted Reference',
        onclick: function () {
            editor.windowManager.open({
                title: 'Insert Formatted Reference',
                url: AU_locationInfo.tinymceViewsURL + 'formatted-reference.html',
                width: 600,
                height: 100,
                onclose: function (e) {
                    if (Object.keys(e.target.params).length === 0) {
                        return;
                    }
                    editor.setProgressState(1);
                    var payload = e.target.params.data;
                    var refparser = new Parsers.MainParser(payload, editor);
                    console.log(payload);
                    if (payload.hasOwnProperty('manual-type-selection')) {
                        refparser.fromManualInput(payload);
                        editor.setProgressState(0);
                        return;
                    }
                    refparser.fromPMID();
                },
            });
        },
    };
    bibToolsMenu.menu.push(inlineCitation, separator, formattedReference);
    ABT_Button.menu.push(bibToolsMenu, trackedLink, separator, requestTools);
    editor.addButton('abt_ref_id_parser_mce_button', ABT_Button);
});

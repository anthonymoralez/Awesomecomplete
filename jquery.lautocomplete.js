/**
 * L'Autocomplete — A lightweight, simple autocomplete plugin
 *  Clint Tseng — 2009-08-20
 *    I think licenses are dumb and superfluous. I'm releasing this into the
 *    wild under public domain, but please do let me know what you think!
 */

(function($)
{
    var ident = 0;

    // Initializer. Call on a text field to make things go.
    $.fn.lautocomplete = function(options)
    {
        var options = $.extend({}, $.fn.lautocomplete.defaults, options);

        return this.each(function()
        {
            var $this = $(this);
            var config = $.meta ? $.extend({}, options, $this.data()) : options;
            $this.data('lautocomplete-config', config);

            var $list = $('<ul/>').addClass(config.suggestionListClass)
                                  .insertBefore($this)
                                  .hide()
                                  .css('width', $this.innerWidth())
                                  .css('margin-top', $this.outerHeight(false));
            $this.data('lautocomplete-list', $list);

            var typingDelayPointer;
            var suppressKey = false;
            $this.keyup(function(event)
            {
                if (suppressKey)
                {
                    suppressKey = false;
                    return;
                }

                // ignore arrow keys, shift
                if ( ((event.which > 36) && (event.which < 41)) ||
                     (event.which == 16) )
                    return;

                if (config.typingDelay > 0)
                {
                    clearTimeout(typingDelayPointer);
                    typingDelayPointer = setTimeout(function() { processInput($this); });
                }
                else
                {
                    processInput($this);
                }
            });

            $this.keydown(function(event)
            {
                // enter = 13; up = 38; down = 40; esc = 27
                var $active = $list.children('li.' + config.activeItemClass);
                switch (event.which)
                {
                    case 13:
                        if ($active.length !== 0)
                        {
                            event.preventDefault();
                            $this.val($active.data('lautocomplete-value'));
                            $list.hide();
                        }
                        $list.hide();
                        suppressKey = true;
                        break;
                    case 38:
                        event.preventDefault();
                        if ($active.length === 0)
                        {
                            $list.children('li:last-child').addClass(config.activeItemClass);
                        }
                        else
                        {
                            $active.prev().addClass(config.activeItemClass);
                            $active.removeClass(config.activeItemClass);
                        }
                        break;
                    case 40:
                        event.preventDefault();
                        if ($active.length === 0)
                        {
                            $list.children('li:first-child').addClass(config.activeItemClass);
                        }
                        else if ($active.is(':not(:last-child)'))
                        {
                            $active.next().addClass(config.activeItemClass);
                            $active.removeClass(config.activeItemClass);
                        }
                        break;
                    case 27:
                        $list.hide();
                        suppressKey = true;
                        break;
                }
            });

            // stupid hack to get around loss of focus on mousedown
            var mouseDown = false;
            var blurWait = false;
            $(document).bind('mousedown.lautocomplete' + ++ident, function()
            {
                mouseDown = true;
            });
            $(document).bind('mouseup.lautocomplete' + ident, function()
            {
                mouseDown = false;
                if (blurWait)
                {
                    blurWait = false;
                    $list.hide();
                }
            });
            $this.blur(function()
            {
                if (mouseDown)
                {
                    blurWait = true;
                }
                else
                {
                    var $active = $list.children('li.' + config.activeItemClass);
                    if ($list.is(':visible') && ($active.length !== 0))
                        $this.val($active.data('lautocomplete-value'));
                    $list.hide();
                }
            });
            $this.focus(function()
            {
                if ($list.children(':not(.' + config.noResultsClass + ')').length > 0)
                    $list.show();
            });
        });
    };

    // Data callback.  If you're using callbacks to a server,
    // call this on the autocompleted text field to complete the
    // callback process after you have your matching items.
    $.fn.lautocomplete.onData = function(data, term)
    {
        return this.each(function()
        {
            var $this = $(this);
            processData($this, data, (term || $this.val()));
        });
    };


// private helpers
    var processInput = function($this)
    {
        if (typeof dataMethod === 'function')
        {
            dataMethod($this.val(), $this);
        }
        else
        {
            processData($this, $this.data('lautocomplete-config').staticData, $this.val());
        }
    };
    
    var processData = function($this, data, term)
    {
        var $list = $this.data('lautocomplete-list');
        $list.empty().hide();
        if (term === '')
            return;

        var config = $this.data('lautocomplete-config');

        var results = [];
        for (var item = 0; item < data.length; item++)
        {
            var dataItem = jQuery.extend({}, data[item]);
            var matchCount = 0;

            var maxFieldMatches = 0;
            var topMatch = null;

            for (var field in dataItem)
            {
                for (var j = 0; j < config.dontMatch.length; j++)
                    if (field == config.dontMatch[j])
                        continue;

                var dataString = dataItem[field].toString();
                var terms = [ term ];
                if (config.splitTerm)
                    terms = term.split(config.wordDelimiter);

                for (var j = 0; j < terms.length; j++)
                {
                    if (terms[j] === '')
                        continue;

                    terms[j] = terms[j].replace(/[\\*+?|{}()^$.#]/g, '\\$1');
                    var regex = new RegExp('(' + terms[j] + ')', (config.ignoreCase ? 'ig' : 'g'));

                    var matches = [];
                    if (matches = dataString.match(regex))
                    {
                        matchCount += matches.length;

                        if ((field != config.nameField) && (matches.length > maxFieldMatches))
                        {
                            maxFieldMatches = matches.length;
                            topMatch = field;
                        }
                    }
                }

                if (config.highlightMatches)
                {
                    var regex = new RegExp('(' + terms.join('|') + ')', (config.ignoreCase ? 'ig' : 'g'));

                    dataItem[field] = dataString.replace(regex, '<span class="match">$1</span>');
                }
            }

            if (matchCount > 0)
                results.push({
                    dataItem: dataItem,
                    originalDataItem: data[item],
                    matchCount: matchCount,
                    topMatch: topMatch
                });
        }

        results.sort(function(a, b) { b.matchCount - a.matchCount })
        results = results.slice(0, config.resultLimit);

        for (var i in results)
        {
            $('<li>' + config.renderFunction(results[i].dataItem, results[i].topMatch) + '</li>')
                .data('lautocomplete-value', config.valueFunction(results[i].originalDataItem))
                .appendTo($list)
                .click(function()
                {
                    $this.val($(this).data('lautocomplete-value'));
                });
        }

        if ((config.noResultsMessage !== undefined) && (results.length == 0))
            $list.append($('<li class="' + config.noResultsClass + '">' + config.noResultsMessage + '</li>'));

        if ((results.length > 0) || (config.noResultsMessage !== undefined))
            $list.show();
    };

// default functions
    var defaultRenderFunction = function(dataItem, topMatch)
    {
        if (topMatch === 'name')
            return '<p class="title">' + dataItem['name'] + '</p>';
        else
            return '<p class="title">' + dataItem['name'] + '</p>' +
                   '<p class="matchRow"><span class="matchedField">' + topMatch + '</span>: ' +
                        dataItem[topMatch] + '</p>';
    };
    
    var defaultValueFunction = function(dataItem)
    {
        return dataItem['name'];
    };

    $.fn.lautocomplete.defaults = {
        activeItemClass: 'active',
        dataMethod: undefined,
        dontMatch: [],
        highlightMatches: true,
        ignoreCase: true,
        nameField: 'name',
        noResultsClass: 'noResults',
        noResultsMessage: undefined,
        splitTerm: true,
        staticData: [],
        suggestionListClass: "autocomplete",
        renderFunction: defaultRenderFunction,
        resultLimit: 10,
        typingDelay: 0,
        valueFunction: defaultValueFunction,
        wordDelimiter: /[^\da-z]+/ig
    };
})(jQuery);
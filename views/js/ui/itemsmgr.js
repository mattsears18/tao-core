define([
    'jquery',
    'lodash',
    'core/pluginifier',
    'tpl!ui/itemsmgr/tpl/layout'
], function($, _, Pluginifier, layout){

    'use strict';

    var ns = 'itemsmgr';
    var defaults = {
        'start': 0,
        'rows': 25
    };

    /**
     * The itemsMgr component makes you able to browse itemss and bind specific
     * actions to undertake for edition and removal of them.
     *
     * @exports ui/itemsmgr
     */
    var itemsMgr = {

        /**
         * Initialize the plugin.
         *
         * Called the jQuery way once registered by the Pluginifier.
         * @example $('selector').itemsmgr({});
         *
         * @constructor
         * @param {Object} options - the plugin options
         * @param {String} options.url - the URL of the service used to retrieve the resources.
         * @param {Function} options.actions.xxx - the callback function for items xxx, with a single parameter representing the identifier of the items.
         * @fires itemsMgr#create.itemsmgr
         * @returns {jQueryElement} for chaining
         */
        init: function(options) {

            return this.each(function() {
                var $elt = $(this);

                options = _.defaults(options, defaults);

                var data = {
                    'rows': options.rows,
                    'page': 1,
                    'sortby': 'id',
                    'sortorder': 'asc'
                };

                itemsMgr._query($elt, options, data);
            });
        },

        _query: function($elt, options, data) {

            $.ajax({
                url: options.url,
                data: data,
                type: 'GET'
            }).done(function(response) {
                // Add the list of custom actions to the response for the tpl
                response.actions = _.keys(options.actions);
                var $rendering = $(layout(response));

                _.forEach(options.actions,function(action,name){
                    $rendering
                        .off('click','.'+name)
                        .on('click','.'+name, function(e){
                            e.preventDefault();
                            var $elt = $(this);
                            action.apply($elt,[$elt.parent().data('items-identifier')]);
                        });
                });

                // Now $rendering takes the place of $elt...
                var $forwardBtn = $rendering.find('.itemsmgr-forward');
                var $backwardBtn = $rendering.find('.itemsmgr-backward');
                var $sortBy = $rendering.find('th');

                $forwardBtn.click(function() {
                    itemsMgr._next($rendering, options, data);
                });

                $backwardBtn.click(function() {
                    itemsMgr._previous($rendering, options, data);
                });

                $sortBy.click(function() {
                    var sortBy = $(this).data('sort-by');
                    itemsMgr._sort($rendering, options, data, sortBy);
                });

                if (data.page === 1) {
                    $backwardBtn.attr('disabled', '');
                } else {
                    $backwardBtn.removeAttr('disabled');
                }

                if (response.page >= response.total) {
                    $forwardBtn.attr('disabled', '');
                } else {
                    $forwardBtn.removeAttr('disabled');
                }

                $elt.replaceWith($rendering);
            });
        },

        _next: function($elt, options, data) {
            data.page +=1;
            itemsMgr._query($elt, options, data);
        },

        _previous: function($elt, options, data) {
            data.page -= 1;
            itemsMgr._query($elt, options, data);
        },
        _sort: function($elt, options, data, sortBy) {
            if (data.sortorder == "asc") {
                data.sortorder = "desc";
            }else{
                data.sortorder = "asc";
            }
            data.sortby = sortBy;
            itemsMgr._query($elt, options, data);
        }
    };

    Pluginifier.register(ns, itemsMgr);
});

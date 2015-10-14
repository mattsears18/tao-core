/**
 * @author Jérôme Bogaert <jerome@taotesting.com>
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define(['jquery', 'i18n', 'helpers', 'layout/section', 'ui/feedback', 'ui/datatable'], function($, __, helpers, section, feedback) {
    'use strict';

    /**
     * Edit a user (shows the edit section)
     * @param {String} uri - the user uri
     */
    var editUser = function editUser(uri) {
        section
            .get('edit_user')
            .enable()
            .loadContentBlock(helpers._url('edit', 'Users', 'tao'), {uri : uri})
            .show();
    };

    /**
     * Removes a user
     * @param {String} uri - the user uri
     */
	var removeUser = function removeUser(uri){
        //TODO use a confirm component
        if (window.confirm(__('Please confirm user deletion'))) {
            $.ajax({
                url : helpers._url('delete', 'Users', 'tao'),
                data:  {uri : uri},
                type : 'POST'
            }).done(function(response){
                if(response.deleted){
                    feedback().success(response.message);
                } else {
                    feedback().error(response.message);
                }
                $('#user-list').datatable('refresh');
            });
        }
	};

    /**
     * The user index controller
     * @exports controller/users/index
     */
    return {
        start : function(){
            var $userList = $('#user-list');
    
            section.on('show', function(section){
                if(section.id === 'list_users'){
                    $userList.datatable('refresh');
                }

            });

            //initialize the user manager component
            $userList.datatable({
                url: helpers._url('data', 'Users', 'tao'),
                selectable: true,
                clickable: true,
                //filter: true,
                filter: {
                    columns: ['login', 'name', 'guiLg']
                },
                status: true,
                actions: {
                    edit: editUser,
                    remove: removeUser,
                    test: function (uri) {
                        console.log('This is test!');
                        alert(uri);
                    }
                },
                tools: {
                    edit: editUser,
                    remove: removeUser,
                    test: function() {
                        alert('test');
                    }
                },
                'model': [
                    {
                        id : 'login',
                        label : __('Login'),
                        sortable : true,
                        filterable: true // new property
                    },{
                        id : 'name',
                        label : __('Name'),
                        sortable : true,
                        filterable: true // new property
                    },
                    {
                        id : 'email',
                        label : __('Email'),
                        sortable : true
                    },{
                        id : 'roles',
                        label : __('Roles'),
                        sortable : false
                    },{
                        id : 'dataLg',
                        label : __('Data Language'),
                        sortable : true
                    },{
                        id: 'guiLg',
                        label : __('Interface Language'),
                        sortable : true
                    }
                ]
            });
        }
    };
});

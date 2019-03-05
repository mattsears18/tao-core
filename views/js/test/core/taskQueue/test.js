/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */

define( [

    'jquery',
    'lodash',
    'core/taskQueue/taskQueueModel',
    'json!test/core/taskQueue/samples/newTaskCreationResult.json',
    'lib/jquery.mockjax/jquery.mockjax'
], function(  $, _, taskQueueModelFactory, newTaskCreationResultData ) {
    'use strict';

    //Mock the POST method that is rejected by some server config such as nginx
    $.mockjax( {
        url: '/tao/views/js/test/core/taskQueue/samples/newTaskCreationResult.json',
        responseText: newTaskCreationResultData
    } );

    QUnit.module( 'API' );

    QUnit.test( 'module', function( assert ) {
        assert.expect( 3 );

        assert.equal( typeof taskQueueModelFactory, 'function', 'The taskQueueModelFactory module exposes a function' );
        assert.equal( typeof taskQueueModelFactory(), 'object', 'The taskQueueModelFactory produces an object' );
        assert.notStrictEqual( taskQueueModelFactory(), taskQueueModelFactory(), 'The taskQueueModelFactory provides a different object on each call' );
    } );

    QUnit.cases.init( [
        { title: 'on' },
        { title: 'off' },
        { title: 'trigger' },
        { title: 'before' },
        { title: 'after' }
    ] ).test( 'Eventifier API ', function( data, assert ) {
        var instance = taskQueueModelFactory();
        assert.equal( typeof instance[ data.title ], 'function', 'The resourceList exposes the eventifier method "' + data.title );
    } );

    QUnit.cases.init( [
        { title: 'setEndpoints' },
        { title: 'get' },
        { title: 'getAll' },
        { title: 'archive' },
        { title: 'pollSingle' },
        { title: 'pollSingleStop' },
        { title: 'pollAll' },
        { title: 'pollAllStop' },
        { title: 'create' },
        { title: 'getCached' },
        { title: 'redirect' }
    ] ).test( 'Instance API ', function( data, assert ) {
        var instance = taskQueueModelFactory();
        assert.equal( typeof instance[ data.title ], 'function', 'The resourceList exposes the method "' + data.title );
    } );

    QUnit.module( 'Get and Poll' );

    QUnit.test( 'getAll', function( assert ) {
        var ready = assert.async();
        assert.expect( 2 );
        taskQueueModelFactory( {
            url: {
                all: '/tao/views/js/test/core/taskQueue/samples/getAll.json'
            }
        } ).getAll().then( function( tasks ) {
            assert.ok( _.isArray( tasks ), 'the data is an array' );
            assert.equal( tasks.length, 3, 'all data fetched' );
            ready();
        } );
    } );

    QUnit.test( 'setEndpoints', function( assert ) {
        var ready = assert.async();
        assert.expect( 2 );
        taskQueueModelFactory()
            .setEndpoints( {
                all: '/tao/views/js/test/core/taskQueue/samples/getAll.json'
            } )
            .getAll().then( function( tasks ) {
                assert.ok( _.isArray( tasks ), 'the data is an array' );
                assert.equal( tasks.length, 3, 'all data fetched' );
                ready();
            } );
    } );

    QUnit.test( 'pollAll', function( assert ) {
        var ready = assert.async();
        assert.expect( 4 );
        taskQueueModelFactory( {
            url: {
                all: '/tao/views/js/test/core/taskQueue/samples/getAll.json'
            }
        } ).on( 'pollAllStart', function() {
            assert.ok( true, 'poll all started' );
        } ).on( 'pollAll', function( tasks ) {

            //Change url
            assert.ok( _.isArray( tasks ), 'the data is an array' );
            assert.equal( tasks.length, 3, 'all data fetched' );
            this.pollAllStop();

        } ).on( 'pollAllStop', function() {
            assert.ok( true, 'poll all stopped' );
            ready();
        } ).pollAll();
    } );

    QUnit.test( 'get', function( assert ) {
        var ready = assert.async();
        assert.expect( 2 );
        taskQueueModelFactory( {
            url: {
                get: '/tao/views/js/test/core/taskQueue/samples/getSingle-inprogress.json'
            }
        } ).get( 'rdf#i15083379701993186432222' ).then( function( task ) {
            assert.ok( _.isPlainObject( task ), 'the data is an array' );
            assert.equal( task.status, 'in_progress', 'the status is correct' );
            ready();
        } );
    } );

    QUnit.test( 'get cached', function( assert ) {
        var ready = assert.async();
        var taskQueueModel;
        var getBackup;
        var expectedTask = {
            'id': 'rdf#i15083379701993186432222',
            'taskName': 'Task Name 2',
            'taskLabel': 'Task label 2',
            'status': 'in_progress',
            'owner': 'userId',
            'createdAt': '1510149584',
            'updatedAt': '1510149574',
            'file': false,
            'category': 'publish',
            'report': null
        };

        assert.expect( 3 );

        taskQueueModel = taskQueueModelFactory( {
            url: {
                get: '/tao/views/js/test/core/taskQueue/samples/getSingle-inprogress.json'
            }
        } );
        getBackup = taskQueueModel.get;
        taskQueueModel.get = function( id ) {
            assert.ok( true, 'The get should be called only once' );
            return getBackup.call( this, id );
        };

        taskQueueModel
            .getCached( 'rdf#i15083379701993186432222' )
            .then( function( task ) {
                assert.deepEqual( task, expectedTask, 'The retrieved task is correct' );

                return taskQueueModel.getCached( 'rdf#i15083379701993186432222' );
            } )
            .then( function( task ) {
                assert.deepEqual( task, expectedTask, 'The retrieved task is correct' );
                ready();
            } )
            .catch( function( err ) {
                assert.ok( false, err.message );
                ready();
            } );
    } );

    QUnit.test( 'pollSingle', function( assert ) {
        var ready = assert.async();
        var taskId = 'rdf#i15083379701993186432222';
        var i = 3;
        assert.expect( 20 );
        taskQueueModelFactory( {
            url: {
                get: '/tao/views/js/test/core/taskQueue/samples/getSingle-inprogress.json'
            }
        } ).on( 'pollSingleStart', function( id ) {
            assert.ok( true, 'poll single started' );
            assert.equal( id, taskId, 'the started task id is correct' );
        } ).on( 'pollSingle', function( id, task ) {

            assert.equal( id, taskId, 'the task id is correct' );
            assert.ok( _.isPlainObject( task ), 'the data is a plain object' );
            assert.equal( task.status, 'in_progress', 'the status is correct' );

            if ( i > 0 ) {
                i--;
            }else {
                this.setEndpoints( {
                    get: '/tao/views/js/test/core/taskQueue/samples/getSingle-completed.json'
                } );
            }

        } ).on( 'pollSingleFinished', function( id, task ) {
            assert.ok( true, 'poll single completed' );
            assert.equal( id, taskId, 'the completed task id is correct' );
            assert.ok( _.isPlainObject( task ), 'the data is a plain object' );
        } ).pollSingle( taskId ).then( function( result ) {
            assert.equal( result.finished, true, 'task had time to be completed' );
            assert.ok( _.isPlainObject( result.task ), 'the data is a plain object' );
            assert.equal( result.task.status, 'completed', 'the status is completed' );
            ready();
        } );
    } );

    QUnit.module( 'Archive' );

    QUnit.test( 'archive - success', function( assert ) {
        var ready = assert.async();
        assert.expect( 1 );
        taskQueueModelFactory( {
            url: {
                archive: '/tao/views/js/test/core/taskQueue/samples/archive-success.json'
            }
        } ).archive( 'rdf#i15083379701993186432222' ).then( function() {
            assert.ok( true, 'archive successful' );
            ready();
        } ).catch( function() {
            assert.ok( false, 'archive should not fail' );
            ready();
        } );
    } );

    QUnit.test( 'archive - failure', function( assert ) {
        var ready = assert.async();
        assert.expect( 2 );
        taskQueueModelFactory( {
            url: {
                archive: '/tao/views/js/test/core/taskQueue/samples/archive-failure.json'
            }
        } ).archive( 'rdf#i15083379701993186432222' ).then( function() {
            assert.ok( false, 'should not be successful' );
            ready();
        } ).catch( function( err ) {
            assert.ok( true, 'archive failure detected' );
            assert.equal( err.message, '500 : oops, big bad error', 'archive failure detected' );
            ready();
        } );
    } );

    QUnit.module( 'Create' );

    QUnit.test( 'quick finish - promise mode', function( assert ) {
        var ready = assert.async();
        assert.expect( 7 );
        taskQueueModelFactory( {
            url: {
                get: '/tao/views/js/test/core/taskQueue/samples/newTaskCreated.json'
            }
        } ).on( 'created', function( result ) {

            assert.ok( _.isPlainObject( result ), 'the data is a plain object' );
            assert.ok( _.isPlainObject( result.task ), 'the data contains the task data is a plain object' );
            assert.equal( result.task.status, 'in_progress', 'the status is correct' );

        } ).on( 'pollSingle', function() {

            //After the first poll, simulate a prompt completion of the task
            this.setEndpoints( {
                get: '/tao/views/js/test/core/taskQueue/samples/newTaskFinished.json'
            } );

        } ).create( '/tao/views/js/test/core/taskQueue/samples/newTaskCreationResult.json', { someparam:'xyz' } ).then( function( result ) {
            assert.ok( true, 'archive successful' );
            assert.equal( result.finished, true, 'the task has time to finish quickly' );
            assert.ok( _.isPlainObject( result.task ), 'the data is a plain object' );
            assert.equal( result.task.status, 'completed', 'the status is correct' );
            ready();
        } ).catch( function() {
            assert.ok( false, 'should not fail' );
            ready();
        } );
    } );

    QUnit.test( 'quick finish - event mode', function( assert ) {
        var ready = assert.async();
        assert.expect( 6 );
        taskQueueModelFactory( {
            url: {
                get: '/tao/views/js/test/core/taskQueue/samples/newTaskCreated.json'
            }
        } ).on( 'created', function( result ) {

            assert.ok( _.isPlainObject( result ), 'the data is a plain object' );
            assert.ok( _.isPlainObject( result.task ), 'the data contains the task data is a plain object' );
            assert.equal( result.task.status, 'in_progress', 'the status is correct' );

        } ).on( 'pollSingle', function() {

            //After the first poll, simulate a prompt completion of the task
            this.setEndpoints( {
                get: '/tao/views/js/test/core/taskQueue/samples/newTaskFinished.json'
            } );

        } ).on( 'fastFinished', function( result ) {

            assert.ok( true, 'the task has time to finish quickly' );
            assert.ok( _.isPlainObject( result.task ), 'the data is a plain object' );
            assert.equal( result.task.status, 'completed', 'the status is correct' );
            ready();

        } ).on( 'enqueued', function() {

            assert.ok( false, 'should not be enqueued' );
            ready();

        } ).create( '/tao/views/js/test/core/taskQueue/samples/newTaskCreationResult.json', { someparam:'xyz' } );
    } );

    QUnit.test( 'enqueued - promise mode', function( assert ) {
        var ready = assert.async();
        assert.expect( 7 );
        taskQueueModelFactory( {
            url: {
                get: '/tao/views/js/test/core/taskQueue/samples/newTaskCreated.json'
            },
            pollSingleIntervals: [
                { iteration: 1, interval:100 }
            ]
        } ).on( 'created', function( result ) {

            assert.ok( _.isPlainObject( result ), 'the data is a plain object' );
            assert.ok( _.isPlainObject( result.task ), 'the data contains the task data is a plain object' );
            assert.equal( result.task.status, 'in_progress', 'the status is correct' );

        } ).create( '/tao/views/js/test/core/taskQueue/samples/newTaskCreationResult.json', { someparam:'xyz' } ).then( function( result ) {
            assert.ok( true, 'archive successful' );
            assert.equal( result.finished, false, 'the task has not the time to finish quickly' );
            assert.ok( _.isPlainObject( result.task ), 'the data is a plain object' );
            assert.equal( result.task.status, 'in_progress', 'the status is correct' );
            ready();
        } ).catch( function() {
            assert.ok( false, 'should not fail' );
            ready();
        } );
    } );

    QUnit.test( 'enqueued - event mode', function( assert ) {
        var ready = assert.async();
        assert.expect( 6 );
        taskQueueModelFactory( {
            url: {
                get: '/tao/views/js/test/core/taskQueue/samples/newTaskCreated.json'
            },
            pollSingleIntervals: [
                { iteration: 1, interval:100 }
            ]
        } ).on( 'created', function( result ) {

            assert.ok( _.isPlainObject( result ), 'the data is a plain object' );
            assert.ok( _.isPlainObject( result.task ), 'the data contains the task data is a plain object' );
            assert.equal( result.task.status, 'in_progress', 'the status is correct' );

        } ).on( 'fastFinished', function() {

            assert.ok( false, 'should not finish quickly' );
            ready();

        } ).on( 'enqueued', function( result ) {

            assert.ok( true, 'the task has no time to finish quickly' );
            assert.ok( _.isPlainObject( result.task ), 'the data is a plain object' );
            assert.equal( result.task.status, 'in_progress', 'the status is correct' );
            ready();

        } ).create( '/tao/views/js/test/core/taskQueue/samples/newTaskCreationResult.json', { someparam:'xyz' } );
    } );
} );

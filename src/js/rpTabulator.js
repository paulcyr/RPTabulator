/*! RPTabulator - v0.5.0 - 2016-09-02
 * https://github.com/thisispaulcyr/RPTabulator
 * Paul Cyr <web@thisispaul.ca> (http://thisispaul.ca)
 * License: Microsoft Reference Source License (http://referencesource.microsoft.com/license.html) */

"use strict";

define(
    ['jquery', 'lf/lovefield', 'anotherUtility', 'jquery.validate', 'datatables.net', 'datatables.net-responsive']
    ,function($, lf, util) {

let RPTabulator = class RPTabulator {

    constructor() {

        // Load existing configuration
        try {
            this.config = JSON.parse(localStorage.getItem('config'));
            if (typeof this.config !== 'object' || this.config.length === 0) this.config = {};
        }
        catch (e) { this.config = {}; }

        this.config.lang = (window.navigator.userLanguage || window.navigator.language).substr(0,2);
            
        let strings = {
            name: {en: 'Ranked Pairs Tabulator'}
            ,'Error:': {fr: 'Erreur:'}
            ,'Loading...': {fr: 'En cours de chargement...'}
            ,'Are you sure you want to close the program?': {}
            ,'Elections': {}
            ,'Candidates': {}
            ,'Voting': {}
            ,'Results': {}
            ,'No elections have been created.': {}
            ,'Create Election': {}
            ,'ID:': {}
            ,'Created:': {}
            ,'Modified:': {}
            ,'Default': {}
            ,'Ballot:': {}
            ,'No candidates have been added.': {}
            ,'Add an individual candidate': {}
            ,'Import candidates': {}
            ,'Candidate\'s Name': {}
            ,'Candidates\' Names': {}
            ,'One candidate per line': {}
            ,'Add': {}
            ,'Import': {}
            ,'Cancel': {}
            ,'A candidate with the name "': {}
            ,'" already exists. Remove that name or enter a different one.': {}
            ,'The following candidate names already exist:': {}
            ,'Remove those names or enter different ones.': {}
            ,'No "pageLoaded" event was triggered within five seconds of the start of page load. This may be due to slow loading or a missing "pageLoaded" trigger.': {}
        }

        // Populate the strings object with the current langauge
        this.config.strings = this.config.strings || {};
        for (let key in strings) {
            if (typeof this.config.strings[key] === 'undefined') {
                if (strings[key][this.lang])
                    this.config.strings[key] = strings[key][this.lang];
                else this.config.strings[key] = key;
            }
        }

        localStorage.setItem('config', JSON.stringify(this.config));

        this.strings = this.config.strings;
        this.loadedItems = {};

        // Check for jQuery         
        if (typeof window.jQuery !== 'function') this.loadedItems.jQuery = false;
        else {
            this.loadedItems.jQuery = true;
            if (window.$ !== window.jQuery) window.$ = window.jQuery; // Ensure $ is set to jQuery
        }

        // Open DB and create tables
        if (window.lf) {

			let lf = this.lf = window.lf;
            
            this.ds = lf.schema.create('RPTabulator', 1);

            // Elections
            this.ds.createTable('elections')
                .addColumn('id', lf.Type.INTEGER)
                .addColumn('created', lf.Type.DATE_TIME)
                .addColumn('modified', lf.Type.DATE_TIME)
                .addColumn('name', lf.Type.STRING)
                .addColumn('ballot', lf.Type.OBJECT)
                .addColumn('results', lf.Type.OBJECT)
                .addPrimaryKey(['id'], true)
                .addIndex('idx__modified', ['modified'], false, lf.Order.DESC)
                .addIndex('idx__name', ['name'], true, lf.Order.ASC)

            // Candidates
            this.ds.createTable('candidates')
                .addColumn('id', lf.Type.INTEGER)
                .addColumn('created', lf.Type.DATE_TIME)
                .addColumn('modified', lf.Type.DATE_TIME)
                .addColumn('election_id', lf.Type.INTEGER)
                .addColumn('name', lf.Type.STRING)
                .addPrimaryKey(['id'], true)
                .addUnique('unique__election_id__name', ['election_id', 'name'])
                .addIndex('idx__election_id', ['election_id'], false, lf.Order.DESC)
                .addIndex('idx__election_id__name', ['election_id', 'name'], true, lf.Order.DESC)
                .addForeignKey('fk__election_id__elections_id', {
                    local: 'election_id',
                    ref: 'elections.id',
                    action: lf.ConstraintAction.CASCADE
                });

            // Ballots
            this.ds.createTable('ballots')
                .addColumn('id', lf.Type.INTEGER)
                .addColumn('created', lf.Type.DATE_TIME)
                .addColumn('modified', lf.Type.DATE_TIME)
                .addColumn('election_id', lf.Type.INTEGER)
                .addColumn('vote', lf.Type.OBJECT)
                .addPrimaryKey(['id'], true)
                .addIndex('idx__election_id', ['election_id'], false, lf.Order.DESC)
                .addForeignKey('fk__election_id__elections_id', {
                    local: 'election_id',
                    ref: 'elections.id',
                    action: lf.ConstraintAction.CASCADE
            });
            
            this.ds.connect().then((db) => {
                // Connection successful

                this.db = db;
                this.loadedItems.lf = true;
                                
                $(document).trigger('dbConnected.rpTabulator');
            })
        }

        
    }

    relativePagePath(path) {
        // If a URL, get the pathname
        if (/^https?:\/\/.*/i.test(path)) {
            let parser = document.createElement('a');
            parser.href = path;
            path = parser.pathname
        }
        return path.replace(new RegExp('^' + window.url.REL_PATH, 'i'), '') || 'elections'; // Elections is default
    }

    load() {

        if (this.loadedItems.loadMethod == true) throw new Error('RPTabulator already loaded.');

        this.$pageTitle = $('.page-title');
        this.$pageSubtitle = $('.page-subtitle');
        this.$content = $('#main > .container > .content');

        // Load any error messages;
        if (this.loadedItems.jQuery !== true) {
            let errorDiv = new util.ErrorMessage('A required component appears to be missing and could not be loaded.', {
                type: 'danger'
                ,code: 'Missing component: jQuery'
            });
            errorDiv.style.textAlign = 'center';
            container.appendChild(errorDiv);
        }
        if (this.loadedItems.lf !== true) {

            if (window.lf) { // Lovefield exists, but failed to load.
                let errorDiv = new util.ErrorMessage('Your browser may be unable to support a required commponent.', {
                    type: 'danger'
                    ,details: '<p>Only the following browsers are compatible:</p><ul style="display: inline-block; text-align: left; text-align: start;"><li>Google Chrome (37+)</li><li>Mozilla Firefox (31+)</li><li>Microsoft Edge</li><li>Microsoft Internet Explorer (10+)</li><li>Apple Safari (5.1+)</li></ul>'
                    ,detailsContainerType: 'div'
                    ,code: 'Failed component: Lovefield (database)'
                });
                $(errorDiv).css('text-align', 'center');
                container.appendChild(errorDiv);
            }
            else { // Lovefield could not be found.
                let errorDiv = new util.ErrorMessage('A required component could not be loaded.', {
                    type: 'danger'
                    ,code: 'Missing component: Lovefield (database)'
                });
                $(errorDiv).css('text-align', 'center');
                container.appendChild(errorDiv);
            }
        }
        
        // Throw the error for any failed dependencies
        if (this.loadedItems.jQuery !== true) throw new Error('The required dependency \'jQuery\' could not be loaded.');   
        if (this.loadedItems.lf !== true) {
            if (window.lf) throw new Error('The required dependency \'Lovefield\' was found but could not be loaded.');  
            else throw new Error('The required dependency \'Lovefield\' could not be loaded.');
        }

        $('nav.primary .toggle').css('display', '');

        this.menus = {
            default: [
                {href: window.url.ROOT, label: this.strings['Elections']}
                ,{href: window.url.ROOT + encodeURI(this.strings['Candidates'].toLowerCase()), label: this.strings['Candidates']}
                ,{href: window.url.ROOT + encodeURI(this.strings['Voting'].toLowerCase()), label: this.strings['Voting']}
                ,{href: window.url.ROOT + encodeURI(this.strings['Results'].toLowerCase()), label: this.strings['Results']}
            ]
        }

        /****************
         ** Navigation **
         ****************/
        // Browser popstate
        $(window).on('popstate', () => { this.loadPage(window.location.href, false) });

        // Link clicks
        $(document).on('pageLoaded.rpTabulator', () => {
            $('a').filter(function() {
                return this.href // ...and it has a URL...
                    && !this.href.match(/^.+\.\S{3,4}$/i) // ...but the URL does not include a file extention
                    // ...and it does not have a "target" attribute or it does and that attribue is "_self", effectively excluding targets such as "_blank"
                    && (
                        !$(this).attr('target')
                        || $(this).attr('target') == '_self'
                    );
                })
                .off('click.navigation.rpTabulator')
                .on('click.navigation.rpTabulator', (e) => {
                    e.preventDefault();
                    let href = e.currentTarget.href;
                    if (!util.isSameTarget(href, this.prevURL)) this.loadPage(href);                
                });
        });

        this.loadPage(window.location.href, false);
        this.loadedItems.loadMethod = true;
    }
    

    loadPage(url, isJSJax) {
        if (!(util.validator.isString(url))) throw new util.ArgumentError(url, 'url', 'loadPage', Object.getPrototypeOf(this).constructor.name);
        if (!(typeof isJSJax === 'undefined' || util.validator.isBoolean(isJSJax))) throw new util.ArgumentError(isJSJax, 'isJSJax', 'loadPage', Object.getPrototypeOf(this).constructor.name);

		if (!(url.length > 0)) url = window.url.ROOT;
		isJSJax = isJSJax === false ? false : true;

		let page;

		if (/^https?:\/\/.*/i.test(url)) page = this.relativePagePath(url);
		else {
			page = url;
			url = window.url.ROOT + page
		}

        $(document).trigger('pageLoading.rpTabulator');

        this.page = new RPTabulator.Page(this, page);

        if (isJSJax) {
            let title = this.page.getTitle();
            history.pushState(null, title, url);
        }

        let timeout = setTimeout(() => {
            console.warn(this.strings['No "pageLoaded" event was triggered within five seconds of the start of page load. This may be due to slow loading or a missing "pageLoaded" trigger.'])
        }, 5000)
        
        $(document).one('pageLoaded.rpTabulator', () => {
            clearTimeout(timeout);
        });

        this.page.load();

        this.prevURL = (() => {
            return {protocol: window.location.protocol, hostname: window.location.hostname, pathname: window.location.pathname}
        })();
    }

    insert(tableName, payload) {
        if (!util.validator.isNotEmptyString(tableName)) throw new util.ArgumentError(tableName, 'tableName', 'insert', Object.getPrototypeOf(this).constructor.name);
        if (!(
            util.validator.isNotEmptyArray(payload)
                && payload.every((obj) => {
                    return util.validator.isNotEmptyObject(obj)
                })
            || (util.validator.isNotEmptyObject(payload))
        )) throw new util.ArgumentError(options, 'payload', 'insert', Object.getPrototypeOf(this).constructor.name);

        let table = rp.db.getSchema().table(tableName)
            ,rows = []
            
        if (util.validator.isNotEmptyArray(payload)) {
            payload.forEach((row) => {
                if('id' in row) delete row.id;
                row.created = row.modified = Object.freeze(new Date());
                rows.push(table.createRow(row))
            })
        }
        else {
            if('id' in payload) delete payload.id;
            payload.created = payload.modified = Object.freeze(new Date());
            rows.push(table.createRow(payload));
        }

        return new Promise((resolve, reject) => {
            this.db.insertOrReplace().into(table).values(rows).exec()
                .then((result) => { resolve(result) });
        });
    }

    delete(tableName, ids) {
        if (!util.validator.isNotEmptyString(tableName)) throw new util.ArgumentError(tableName, 'tableName', 'delete', Object.getPrototypeOf(this).constructor.name);
        if (!(
            util.validator.isNotEmptyArray(ids)
                && ids.every((id) => {
                    return util.validator.isNumeric(ids)
                })
            || util.validator.isNumeric(ids)
        )) throw new util.ArgumentError(ids, 'ids', 'delete', Object.getPrototypeOf(this).constructor.name);

        let table = rp.db.getSchema().table(tableName)
            ,condition = util.validator.isNotEmptyArray(ids) ? table.id.in(ids) : table.id.eq(ids)

        return new Promise((resolve, reject) => {
            this.db.delete().from(table).where(condition).exec()
                .then((result) => { resolve(result) });
        });
    }

    isUnique(tableName, arg2, value) {
        if (!util.validator.isNotEmptyString(tableName)) throw new util.ArgumentError(tableName, 'tableName', 'isUnique', Object.getPrototypeOf(this).constructor.name);

        let lf = this.lf
			,table = this.db.getSchema().table(tableName)
            ,columnName
            ,where

        if (util.validator.isNotEmptyArray(arg2)) { // Array of conditions
            let conditions = []

            columnName = arg2[0]
            
            arg2.forEach((conditionArray) => {
                if (!util.validator.isNotEmptyArray(conditionArray) || conditionArray.length !== 2) throw new util.ArgumentError(arg2, 'conditions (argument 2)', 'isUnique', Object.getPrototypeOf(this).constructor.name);
                conditions.push(table[conditionArray[0]].eq(conditionArray[1]))
            })

            where = lf.op.and.apply(lf, conditions);

        } else {
            if (!util.validator.isNotEmptyString(arg2)) throw new util.ArgumentError(arg2, 'columnName (argument 2)', 'isUnique', Object.getPrototypeOf(this).constructor.name);
            if (!util.validator.isNotEmptyString(value)) throw new util.ArgumentError(value, 'value', 'isUnique', Object.getPrototypeOf(this).constructor.name);

            table = this.db.getSchema().table(tableName);
            columnName = arg2;
            where = table[columnName].eq(value);
        }

        return new Promise((resolve, reject) => {
            this.db.select(lf.fn.count(table[columnName]))
                .from(table)
                .where(where)
                .exec()
                .then((rows) => {
                    if ('COUNT(' + columnName + ')' in rows[0]) resolve(rows[0]['COUNT(' + columnName + ')'] === 0);
                    else resolve(rows[0]['COUNT(*)'] === 0)
                });
        });
    }

    areUnique(arg1, arg2) {
        function validQueries(queriesArray) {
            // Three-level nested array with the inner-most array of length two.
            // [
            //   [
            //      [fielda1, valuea1], ..., [fieldan, valuean] // Conditions for a query
            //   ],
            //   ...,
            //   [
            //      [fieldz1, valuez1], ..., [fieldzn, valuezn] // Additional query
            // ]]
            return util.validator.isNotEmptyArray(queriesArray)
                && queriesArray.every(function(queryConditions) {
                    return util.validator.isNotEmptyArray(queryConditions)
                        && queryConditions.every(function(queryCondition) {
                            return queryCondition.length === 2;
                        })
                })
        }
        
        if (arg2) {
            if (!util.validator.isNotEmptyString(arg1)) throw new util.ArgumentError(arg1, 'tableName (argument 1)', 'areUnique', Object.getPrototypeOf(this).constructor.name);
            if (!validQueries(arg2)) throw new util.ArgumentError(arg2, 'queriesArrays (argument 2)', 'areUnique', Object.getPrototypeOf(this).constructor.name);
        }
        else if (!(
            // Array of objects with properties 'table' and 'queries'. 'table' must be string. 'queries' must be valid queries per validQueries()
            util.validator.isNotEmptyArray(arg1)
            && arg1.every(function(tableAndQueries) {
                return util.validator.isNotEmptyObject(tableAndQueries)
                    && 'table' in tableAndQueries
                    && util.validator.isNotEmptyString(tableAndQueries.table)
                    && 'queries' in tableAndQueries
                    && validQueries(tableAndQueries.queries)
            })
        )) throw new util.ArgumentError(arg1, 'argument 1', 'areUnique', Object.getPrototypeOf(this).constructor.name);

        let tablesAndQueries = []
            ,areUniques = []

        // Normalize
        if (arg2) {
            arg2.forEach((queryConditions) => {
                tablesAndQueries.push({table: arg1, queries: queryConditions});
            });
        } else tablesAndQueries = arg1;

        tablesAndQueries.forEach((tableAndQueries) => {
            areUniques.push(this.isUnique.call(this, tableAndQueries.table, tableAndQueries.queries))
        });
       
        return Promise
            .all(areUniques)
            .then(
                (results) => {
                    let details = [];

                    for (let i=0; i < results.length; i++) {
                        details.push({
                            table: tablesAndQueries[i].table
                            ,conditions: tablesAndQueries[i].queries
                            ,isUnique: results[i]
                        });
                    }

                    return {
                        areUnique: results.every((value) => { return value; })
                        ,details: details
                    }
                }
            );
    }
}

RPTabulator.Page = class Page {
    constructor(rp, id) {
        if (!(rp instanceof RPTabulator)) throw new util.ArgumentError(rp, 'rp', 'constructor', Object.getPrototypeOf(this).constructor.name);
        if (!(util.validator.isNotEmptyString(id))) throw new util.ArgumentError(id, 'id', 'constructor', Object.getPrototypeOf(this).constructor.name);

        this.rp = rp;
        this.id = id;
        this.params = [];

        let getPageFromArray = (pageArray, pages, parent) => {
            if (pageArray.length > 1 && !(pageArray[0] in pages)) throw new util.ArgumentError(pageArray, 'pageArray', 'getPageFromArray', Object.getPrototypeOf(this).constructor.name);

            parent = parent || [];

            if (pageArray.length > 1
                && 'subpages' in pages[pageArray[0]]
                && pageArray[1] in pages[pageArray[0]].subpages
                && typeof pages[pageArray[0]].subpages[pageArray[1]] === 'object'
            ) {
                return getPageFromArray(
                    pageArray.slice(1)
                    ,pages[pageArray[0]].subpages
                    ,parent.push(pageArray[0])
                );
            }
            else {
                if (pageArray.length > 1) this.params = pageArray.slice(1)
                pages[pageArray[0]].parent = parent;
                return pages[pageArray[0]];
            }
        }

        this.page = getPageFromArray(id.split('/'), RPTabulator.pages);
        this.name = util.validator.isNotEmptyString(this.page.name) ? this.page.name : id;
        
    }

    setPrimaryMenu(items) {
        let menu = new util.Menu(items);
        $('nav.primary > .container > .menu').remove();
        $('nav.primary > .container').append(menu.get());
    }

    load() {
        $(window).trigger('onNavigate');
        $(window).off('.rpTabulator');
        this.setPrimaryMenu((
            util.validator.isNotEmptyObject(this.page.menu)
        	? this.page.menu : this.rp.menus.default
        ));
        this.setTitle();
        this.setHeader();
        if(typeof this.page.generator === 'function') this.page.generator.call(this, this.params);
        else throw new Error('Unable to load page: ' + this.id);
    }

    getTitle() {
        let pageTitle = typeof this.customTitle === 'string' ? this.customTitle : this.name

        return this.titleOverride ? pageTitle : this.rp.strings.name + ' | ' + pageTitle;
    }

    setTitle(pageTitle = null, override = false) {
        this.customTitle = pageTitle || null;
        this.titleOverride = override || false;

        let breadcrumb
            ,seperator = ' > '
            ,title = this.getTitle()

        breadcrumb = (this.page.parent && this.page.parent instanceof Array) ? this.page.parent.join(seperator) : '';

        $('title', 'head').text(title);

        if (breadcrumb) rp.$pageTitle.html(pageTitle + seperator + breadcrumb);
        else rp.$pageTitle.html(title);
    }

    setHeader(value = null) {
        if (value === false) this.header = null;
    }
}

RPTabulator.Candidates = class Candidates extends util.Records {
    constructor(candidates) {
        super('candidates', util.UUIDv4());
        this.candidates = candidates || [];
    }
}

RPTabulator.pages = RPTabulator.pages || {};

RPTabulator.pages.elections = {
    name: 'Elections'
    ,generator: function() {
        let table = rp.db.getSchema().table('elections');
        rp.db.select().from(table).exec().then((results) => {
            results.forEach(function(value) {
                value.created = value.created.toLocaleString();
                value.modified = value.modified.toLocaleString();
            })
            let content
				,newElection = document.createElement('a');

			$(newElection)
				.attr('href', window.url.ROOT + 'elections/create')
				.html(rp.strings['Create Election'])
				.addClass('btn btn-primary');
			
            if (results.length === 0) {
                content = rp.strings['No elections have been created.']
                rp.$content.html(content, newElection);
            }
            else {
                
                results.forEach(function(value, i) {
                    results[i] = {href: window.url.ROOT + 'election/' + value.id, values: value}
                })
                content = util.tableGenerator(['Name', 'Created', 'Modified', 'Ballot', 'Results'], results, {tableClass: 'table table-striped'});
                rp.$content.html(newElection).append(content);
                $('.table').DataTable({
                    paging: false
                    ,searching: false
                    ,info: false
                });
            }
            $(document).trigger('pageLoaded.rpTabulator');
        });
        
    }
    ,subpages: {}
} 

RPTabulator.pages.elections.subpages.create = {
    name: 'Create Election'
    ,generator: function() {
        let selector
            ,formObj = new util.Form([
                    {type: 'fieldset', inputs: [
                        {type: 'input', name: 'name', label: 'Name', required: true, class: 'form-control'}
                        ,{type: 'submit', value: 'Save & Continue', class: 'btn btn-primary save-continue'}
                        ,{type: 'submit', value: 'Save & Return', class: 'btn btn-default save-return'}
                    ]}
                ]        
                ,{
                    method: 'post'
                    ,wrapInputs: {element: 'div', class: 'form-group'}
                    ,labels: {class: 'control-label'}
                }
            );

        rp.$content.html(formObj.form);

        formObj.setSubmitHandler(function() {});

        selector = '#' + formObj.id;

        $('input[type="submit"]', selector).on('click.rpTabulator', (e) => {
            let name = $('[name="name"]', '#' + formObj.id).first().val();
            rp.isUnique('elections', 'name', $('input[name="name"]').val()).then((isUnique) => {
                $('#' + formObj.id).trigger('formComplete.' + formObj.id);
                if (isUnique) {
                    rp.insert('elections', {name: name}).then((results) => {
						if($(e.currentTarget).hasClass('save-return')) rp.loadPage('elections');
						else (rp.loadPage('election/' + results[0].id))
                    });
                }
                else {
                    formObj.showError('name', {
                        inputClass:'has-error'
                        ,messageClass: 'alert alert-danger'
                        ,message: 'An election with that name already exists. Enter a different name.'
                    })
                }
                
            });
        });

        $(document).trigger('pageLoaded.rpTabulator');
    }
}
    
RPTabulator.pages.election = {
    name: 'Election'
    ,generator: function(args) {
        util.pageCSS('election');
        let tableElections = rp.db.getSchema().table('elections')
            ,tableCandidates = rp.db.getSchema().table('candidates')
            ,load = (results) => {
                let election = results[0].elections
                    ,candidates = results[0].candidates
                    ,title = $('.page-title').html()
                    ,candidatesTable
                    ,candidatesDataTable
                    ,candidateFormID

                function createCandidatesTable() {
                    let rows = []
                    
                    results.forEach(function(value) {
                        rows.push({
                            candidates: value.candidates.name
                            ,delete: deleteButton(value.candidates.id)
                        });
                    });

                    candidatesTable = util.tableGenerator(['Candidates', 'Delete'], rows, {tableClass: 'table table-striped candidates'});

                    $(rightDiv).html(candidatesTable);
                    candidatesDataTable = $('table', rightDiv).DataTable({
                        paging: false
                        ,searching: false
                        ,info: false
                        ,responsive: true
                        ,autoWidth: false
                        ,columns: [null, {orderable: false}]
                    });

                    $('button.candidate-delete', candidatesTable).one('click', deleteCandidate);
                }

                function appendCandidatesTable(id, name){
                    if ($('table.candidates').length === 0) {
                        createCandidatesTable();
                    }
                    candidatesDataTable.row.add([name, deleteButton(id)]);
                    $(candidatesTable).one('click', 'button.candidate-delete[data-id="' + id +'"]', deleteCandidate);
                }

                function addCandidateForm() {
                    // Prevent import during addition
                    $('button.import-candidates').off('click');

                    let formObj = new util.Form([
                            {type: 'fieldset', inputs: [
                                {type: 'input', name: 'name', label: rp.strings['Candidate\'s Name'], required: true, class: 'form-control'}
                            ]}
                            ,{type: 'fieldset', class: 'buttons', inputs: [
                                ,{type: 'submit', value: rp.strings['Add'], class: 'btn btn-primary add-candidate'}
                                ,{type: 'button', value: rp.strings['Cancel'], class: 'btn btn-default cancel-add-candidate', formnovalidate: true}
                            ]}
                        ]        
                        ,{
                            wrapInputs: {element: 'div', class: 'form-group'}
                            ,labels: {class: 'control-label'}
                        }
                    );

                    formObj.setSubmitHandler(function() {});
                    candidateFormID = '#' + formObj.id;

                    $(formObj.form).hide().insertAfter('.candidate-controls').slideDown(100);

                    $('input[type="submit"], button', candidateFormID).on('click.rpTabulator', {formObj: formObj}, candidateAdditionFormButtonClick);
                }

                function importCandidatesForm() {
                    // Prevent individual additions during import
                    $('button.add-candidate').off('click');

                    let formObj = new util.Form([
                            {type: 'fieldset', inputs: [
                                {type: 'textarea'
                                    ,name: 'names'
                                    ,label: rp.strings['Candidates\' Names'] + ' &ndash; ' + rp.strings['One candidate per line']
                                    ,required: true
                                    ,class: 'form-control'
                                }
                            ]}
                            ,{type: 'fieldset', class: 'buttons', inputs: [
                                ,{type: 'submit', value: rp.strings['Import'], class: 'btn btn-primary import-candidates'}
                                ,{type: 'button', value: rp.strings['Cancel'], class: 'btn btn-default cancel-import-candidates', formnovalidate: true}
                            ]}
                        ]        
                        ,{
                            wrapInputs: {element: 'div', class: 'form-group'}
                            ,labels: {class: 'control-label'}
                        }
                    );

                    formObj.setSubmitHandler(function() {});
                    candidateFormID = '#' + formObj.id;

                    $(formObj.form).hide().insertAfter('.candidate-controls').slideDown(100);

                    $('input[type="submit"], button', candidateFormID).on('click.rpTabulator', {formObj: formObj}, candidateAdditionFormButtonClick);
                }

                function candidateAdditionFormButtonClick(e) {

                    function insertCandidates(election_id, names) {
                        if (!(util.validator.isNumeric(election_id))) throw new util.ArgumentError(election_id, 'election_id', 'insertCandidates', Object.getPrototypeOf(this).constructor.name);
                        if (!(util.validator.isNotEmptyArray(names))) throw new util.ArgumentError(names, 'names', 'insertCandidates', Object.getPrototypeOf(this).constructor.name);
                        
                        let rows = [],
                            results

                        names.forEach((name) => {
                            rows.push({election_id: election_id, name: name})
                        })

                        return rp.insert('candidates', rows)
                            .then((insertResults) => {
                                results = insertResults;
                                // Update modified timestamp in elections table
                                return rp.db.update(tableElections)
                                    .set(tableElections.modified, Object.freeze(new Date()))
                                    .where(tableElections.id.eq(election_id))
                                    .exec();

                            })
                            .then(() => {
                                results.forEach((result) => {
                                    appendCandidatesTable(result.id, result.name)
                                });
                                candidatesDataTable.draw();
                                done();
                            });
                    }

                    function done() {
                        $(candidateFormID).fadeOut(50, function() { $(this).remove(); });
                        $('button.add-candidate').one('click', addCandidateForm);
                        $('button.import-candidates').one('click', importCandidatesForm);
                    }

                    e.preventDefault();

                    if ($(e.currentTarget).hasClass('add-candidate')) {
                        let name = $('[name="name"]', candidateFormID).first().val()
                            ,conditions = [['name', name], ['election_id', election.id]]
                        
                        rp.isUnique('candidates', conditions).then((isUnique) => {
                            $(candidateFormID).trigger('formComplete.rpTabulator');
                            if (isUnique) insertCandidates(election.id, [name]);
                            else {
                                e.data.formObj.showError('name', {
                                    inputClass:'has-error'
                                    ,messageClass: 'alert alert-danger'
                                    ,message: 'An candidate with that name already exists. Enter a different name.'
                                });
                            }

                        });
                    } else if ($(e.currentTarget).hasClass('import-candidates')) {
                        let names = $('[name="names"]', candidateFormID).first().val().split(/\r|\n/)
                            ,conditionsArrays = []

                        names.forEach((name) => {
                            conditionsArrays.push([['name', name] ,['election_id', election.id]])
                        })
                        
                        rp.areUnique('candidates', conditionsArrays).then((results) => {
                            $(candidateFormID).trigger('formComplete.rpTabulator');
                            if (results.areUnique) {
                                let inserts = [];
                                insertCandidates(election.id, names);
                            }
                            else {
                                let duplicates = [];
                                results.details.forEach((detail) => {
                                    if (detail.isUnique === true) return;

                                    // Get the name
                                    detail.conditions.some((condition) => {
                                        if (condition[0] === 'name') {
                                            duplicates.push(condition[1]);
                                            return true;
                                        }
                                    });
                                });

                                duplicates.sort();

                                let message = duplicates.length === 1
                                    ? rp.strings['A candidate with the name "'] + duplicates.toString() + rp.strings['" already exists. Remove that name or enter a different one.']
                                    : rp.strings['The following candidate names already exist:'] + ' ' + duplicates.join('; ') + '. ' + rp.strings['Remove those names or enter different ones.'];

                                e.data.formObj.showError('names', {
                                    inputClass:'has-error'
                                    ,messageClass: 'alert alert-danger'
                                    ,message: message
                                });
                            }

                        });
                    }
                    else done();
                }

                function deleteButton(id) {
                    let deleteButton = document.createElement('button');

                    deleteButton.innerHTML = '&times;';
                    deleteButton.setAttribute('data-id', id);
                    $(deleteButton).addClass('btn btn-default btn-sm candidate-delete');

                    return deleteButton.outerHTML;
                }

                function deleteCandidate(e) {
                    let id = e.currentTarget.dataset.id;
                    
                    return rp.delete('candidates', id)
                        .then((result) => {
                            // Update modified timestamp in elections table
                            return rp.db.update(tableElections)
                                .set(tableElections.modified, Object.freeze(new Date()))
                                .where(tableElections.id.eq(election.id))
                                .exec();

                        })
                        .then(() => {
                            candidatesDataTable
                                .row($(this).parents('tr'))
                                .remove()
                                .draw();
                        });
                }

                rp.$content.html('');

                title += ': ' + election.name;
                this.setTitle(title, true);
                rp.$pageSubtitle.text(rp.strings['ID:'] + ' ' + election.id);

                // Left column

                let leftDiv = document.createElement('div')
                leftDiv.classList.add('col-left');

                let created = election.created.toLocaleString()
                    ,modified = election.modified.toLocaleString()
                    ,ballotType = typeof election.ballotType === 'undefined' ? rp.strings['Default'] : election.ballotType

                let info = [
                    [rp.strings['Created:'], created]
                    ,[rp.strings['Modified:'], modified]
                    ,[rp.strings['Ballot:'], ballotType]
                ];
                leftDiv.appendChild(util.tableGenerator(info, {tableClass: 'general'}));

                let candidateControls = document.createElement('div')
                    ,buttons = [['<button class="btn btn-default add-candidate">' + rp.strings['Add an individual candidate'] + '</button>'
                        ,'<button class="btn btn-default import-candidates">' + rp.strings['Import candidates'] + '</button>'
                    ]];
                candidateControls.classList.add('candidate-controls');
                candidateControls.appendChild(util.tableGenerator(buttons));
                leftDiv.appendChild(candidateControls);

                // Right column

                let rightDiv = document.createElement('div');
                $(rightDiv).addClass('col-right candidates');

                if (candidates.id === null)
                    rightDiv.innerHTML = ('<p>' + rp.strings['No candidates have been added.'] + '</p>');
                else createCandidatesTable();

                let container = document.createElement('div');
                container.classList.add('container');

                $(container).append(leftDiv, rightDiv);
                rp.$content.append(container);

                // Events
                $('button.add-candidate').one('click', addCandidateForm);
                $('button.import-candidates').one('click', importCandidatesForm);

                $(document).trigger('pageLoaded.rpTabulator');
            }

        rp.db.select()
            .from(tableElections)
            .leftOuterJoin(tableCandidates, tableElections.id.eq(tableCandidates.election_id))
            .where(tableElections.id.eq(args[0]))
            .exec()
            .then(load)
    }
    
}


return RPTabulator;
});
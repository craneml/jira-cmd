/*global requirejs,define,fs*/
define([
    'superagent',
    'cli-table',
    '../../lib/config'
], function (request, Table, config) {

    var ls = {
        project: null,
        query: null,
        type: null,
        issuetype: null,
        issues: null,
        table: null,

        getIssues: function () {
            var that = this,
                i = 0;
            request
                .get(config.auth.url + this.query)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config.auth.token)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }

                    that.issues = res.body.issues;
                    that.table = new Table({
                        head: ['Key', 'Type', 'Priority', 'Summary', 'Status']
                    });

                    for (i = 0; i < that.issues.length; i += 1) {
                        var issuetype = that.issues[i].fields.issuetype,
                            priority = that.issues[i].fields.priority,
                            summary = that.issues[i].fields.summary,
                            status = that.issues[i].fields.status;

                        if (!issuetype) {
                            issuetype = {
                                name: ''
                            };
                        }
                        if (!priority) {
                            priority = {
                                name: ''
                            };
                        }
                        if (summary.length > 75) {
                            summary = summary.substr(0, 72) + '...';
                        }
                        that.table.push([
                            that.issues[i].key,
                            issuetype.name,
                            priority.name,
                            summary,
                            status.name
                        ]);
                    }

                    if (that.issues.length > 0) {
                        console.log(that.table.toString());
                    } else {
                        console.log('No issues');
                    }

                });
        },

        showAll: function (type) {
            this.type = (type) ? '+AND+type="' + type + '"' : '';
            this.query = 'rest/api/2/search?jql='
                + 'assignee=currentUser()'
                + this.type
                + '+AND+status+not+in+("Done", "Rejected")+AND+status+in+("' + this.getAvailableStatuses() + '")'
                + '+order+by+priority+DESC,+key+ASC&maxResults=200';
            //console.log(this.query);
            return this.getIssues();
        },

        showByStatus: function (status) {
            this.status = (status) ? '+AND+status="' + status + '"' : '';
            this.query = 'rest/api/2/search?jql='
                + 'assignee=currentUser()'
                + this.status
                + '+order+by+priority+DESC,+key+ASC&maxResults=200';
            //console.log(this.query);
            return this.getIssues();
        },

        showInDevelopment: function () {
            this.query = 'rest/api/2/search?jql='
                + 'assignee=currentUser()'
                + '+AND+status+in+("IN+DEVELOPMENT")'
                + '+order+by+priority+DESC,+key+ASC';
            return this.getIssues();
        },

        showByProject: function (project, type) {
            this.type = (type) ? '+AND+type=' + type : '';

            this.query = 'rest/api/2/search?jql='
                + 'assignee=currentUser()'
                + this.type
                + '+AND+project=' + project
                + '+AND+status+in+("' + this.getAvailableStatuses() + '")'
                + '+order+by+priority+DESC,+key+ASC';
            return this.getIssues();
        },

        search: function (query) {
            this.query = 'rest/api/2/search?jql='
                + 'summary+~+"' + query + '"'
                + '+OR+description+~+"' + query + '"'
                + '+OR+comment+~+"' + query + '"'
                + '+order+by+priority+DESC,+key+ASC';
            return this.getIssues();
        },

        jqlSearch: function (jql, options) {
            if (options.custom && config.custom_jql && config.custom_jql[options.custom]) {
                this.query = 'rest/api/2/search?jql=' + encodeURIComponent(config.custom_jql[options.custom]);
            } else {
                this.query = 'rest/api/2/search?jql=' + encodeURIComponent(jql);
            }
            return this.getIssues();
        },

        getAvailableStatuses: function () {
            return config.options.available_issues_statuses.join('", "');
        }
    };

    return ls;

});

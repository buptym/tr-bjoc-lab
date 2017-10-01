'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

//body parser
app.use(bodyParser.json());

//Home Page
app.get('/', function (req, res) {
    res.send('Hello World!');
});

//A simple web Inf
app.get('/tool', function (req, res) {
    var html = '<form method="post" action="/dbcmd">Database CMD: <input type="text" size=100 Name="db_cmd"/><br/><input type="submit" name="submit"/></form>';
    res.send(html);
});

//execute db operations
app.post('/dbcmd', function (req, res) {

    var db_cmd = req.body.db_cmd;
    var dbh = get_pg_client();

    dbh.connect(function (err) {
        if (err) {
            console.log(err.message);
            res.send(err.message)
        }
    });

    dbh.query(db_cmd, function (err, result) {
        res.send(result);
    });
    
    dbh.disconnect()

});
//Test Echo
app.post('/echo', function (req, res) {
    var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Hi Zhu, Seems like some problem. Speak again."
    return res.json({
        speech: 'I am Zhu, you just spoke:' + speech,
        displayText: speech,
        source: 'webhook-eiw-demo'
    });
});

//Demo of Chatbot
app.post('/slack-eiw', function (req, res) {

    var action = req.body.result.action;

    var slack_message = welcome();

    if (action && action == 'q_people' && req.body.result.parameters.Name) {
        q_people(req, res);
    } else if (action && action == 'q_company' && req.body.result.parameters.Company) {
        q_company(req, res);
    } else if (action && action == 'q_project' && req.body.result.parameters.Project) {
        q_project(req, res);
    } else if (action && action == 'q_stamp_duty' && req.body.result.parameters.Location) {
        q_stamp_duty(req,res);
    } else {
        return res.json({
            speech: "ZZS",
            displayText: "speech",
            source: 'webhook-eiw-demo',
            data: {
                "slack": slack_message
            }
        });
    }
});

function q_stamp_duty(req,res) {
    var client = get_pg_client();
    var err = {};
    var _location = "-";

    if (req.body.result.parameters.Location) {
        _location = req.body.result.parameters.Location;
    }

    client.connect(function (err) {
        if (err) {
            console.log(err);
            res.json(err);
        }
    });

    console.log("DB connected~~!")

    client.query('SELECT * FROM stamp_duty where location like \'%' + _location + '%\'', function (err, result) {
        if (err) {
            return res.json(err);
        } else {
            if (result.rowCount > 0) {
                var slack_message = {
                    "text": result.rows[0].full_name,
                    "attachments": [{
                        "location": result.rows[0].location,
                        "solution_descr1": result.rows[0].solution_descr1,
                        "solution_descr2": result.rows[0].solution_descr2,
                        "solution_descr3": result.rows[0].solution_descr3,
                        "solution_descr4": result.rows[0].solution_descr4,
                        "solution_descr5": result.rows[0].solution_descr5,
                        "thumb_url1": result.rows[0].thumb_url1,
                        "thumb_url2": result.rows[0].thumb_url2,
                        "thumb_url3": result.rows[0].thumb_url3,
                        "thumb_url4": result.rows[0].thumb_url4,
                        "thumb_url5": result.rows[0].thumb_url5
                    }]
                };
                return res.json({
                    speech: result.rows[0].title,
                    displayText: "speech",
                    source: 'webhook-eiw-demo',
                    data: {
                        "slack": slack_message
                    }
                });
            } else {
                return res.json({});
            };
        }
    });
    client.disconnect()
}

//Demo purpose hardcoded, not save in DB
function q_project(req, res) {
    var slack_message = bimbqm();
    return res.json({
        speech: "ZZS",
        displayText: "speech",
        source: 'webhook-eiw-demo',
        data: {
            "slack": slack_message
        }
    });
}

//Search company from database
function q_company(req, res) {
    var client = get_pg_client();
    var people = {};
    var err = {};
    var _name = '-';

    if (req.body.result.parameters.Company) {
        _name = req.body.result.parameters.Company;
    }

    client.connect(function (err) {
        if (err) {
            console.log(err);
            res.json(err);
        }

    });

    console.log("DB connected~~!")

    client.query('SELECT * FROM company where full_name like \'%' + _name + '%\'',
        function (err, result) {
            if (err) {
                return res.json(err);
            } else {
                if (result.rowCount > 0) {
                    var slack_message = company_to_json(result);
                    return res.json({
                        speech: result.rows[0].logo,
                        displayText: "speech",
                        source: 'webhook-eiw-demo',
                        data: {
                            "slack": slack_message
                        }
                    });
                } else {
                    return res.json({});
                };
            }
        });

};

//Formating output for slack
function company_to_json(result) {
    return {
        "text": result.rows[0].logo,
        "attachments": [{
                "title": result.rows[0].title1,
                "title_link": result.rows[0].title_link1,
                "color": result.rows[0].color1,
                "thumb_url": result.rows[0].thumb_url1
            },
            {
                "title": result.rows[0].title2,
                "title_link": result.rows[0].title_link2,
                "color": result.rows[0].color2,
                "thumb_url": result.rows[0].thumb_url2
            }
        ]
    }
}


//Select people from database
function q_people(req, res) {
    var client = get_pg_client();
    var people = {};
    var err = {};
    var _name = "-";

    if (req.body.result.parameters.Name) {
        _name = req.body.result.parameters.Name;
    }

    client.connect(function (err) {
        if (err) {
            console.log(err);
            res.json(err);
        }
    });

    console.log("DB connected~~!")

    client.query('SELECT * FROM PEOPLE where full_name like \'%' + _name + '%\'', function (err, result) {
        if (err) {
            return res.json(err);
        } else {
            if (result.rowCount > 0) {
                var slack_message = {
                    "text": result.rows[0].full_name,
                    "attachments": [{
                        "title": result.rows[0].title,
                        "title_link": result.rows[0].title_link,
                        "color": result.rows[0].color,
                        "thumb_url": result.rows[0].thumb_url
                    }]
                };
                return res.json({
                    speech: result.rows[0].title,
                    displayText: "speech",
                    source: 'webhook-eiw-demo',
                    data: {
                        "slack": slack_message
                    }
                });
            } else {
                return res.json({});
            };
        }
    });

};

function welcome() {
    return {
        "text": "What can I help you?",
        "attachments": [{
            "title": "TR BJOC Innovation Lab",
            "title_link": "https://www.thomsonreuters.cn/content/dam/openweb/images/china/artworked/Jinhui3.jpg",
            "color": "#f49e42",
            "thumb_url": "https://www.thomsonreuters.cn/content/dam/openweb/images/china/artworked/Jinhui3.jpg"
        }]
    }
}

function bimbqm() {
    return {
        "text": "Details of JIRA board for Browse and Commerce",
        "attachments": [{
            "title": "JIRA Board",
            "title_link": "http://www.thomsonreuters.com",
            "color": "#36a64f",

            "fields": [{
                "title": "Epic Count",
                "value": "50",
                "short": "false"
            }, {
                "title": "Story Count",
                "value": "40",
                "short": "false"
            }],

            "thumb_url": "https://stiltsoft.com/blog/wp-content/uploads/2016/01/5.jira_.png"
        }, {
            "title": "Story status count",
            "title_link": "http://www.thomsonreuters.com",
            "color": "#f49e42",

            "fields": [{
                "title": "Not started",
                "value": "50",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }]
        }]
    }
}


function get_pg_client() {
    var pg = require('pg');
    pg.defaults.ssl = true;
    var conString = process.env.DATABASE_URL;
    return new pg.Client(conString);

};

//Start web server
app.listen((process.env.PORT || 8000), function () {
    console.log("Server up and listening");
});

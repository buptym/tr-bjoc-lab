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

    if(db_cmd == '_initial_'){
        var db_cmd1 = 'insert into quick_response(action, solution_descr, thumb_url1, thumb_url2) values (\'HK_stamp_duty\', \' \
Stamp duty with Y/N flag is used to indicate whether a security is subject to a stamp duty (a tax placed on legal documents upon transfer). \
For securities listed on HKEX, most ordinary shares and company warrant are stamp duty eligible but with a few exceptions. While all derivative warrants, CBBC, ETFs, L&I products and most debt are not subject to stamp duty. \
 \
For EIKON users, kindly refer to the Security Miscellaneous Information page, which is <stock code> + <MI> + <.HK> for stamp duty information, e.g. <0001MI.HK>. Alternatively, you can check FID8999 (TAX_ELIGBL), with Y for stamp duty eligible and N for stamp duty ineligible. \
 \
Example of Miscellaneous Information page: \
(please see pic1) \
For DataScope Users, kindly be note Stamp Duty information only available for the main RIC, that is <stock code> + <.HK>/<.HZ>/<.HS>,e.g. <0001.HK>, but not applicable for the alias RIC, e.g. <stock code> + <stat.HK>, e.g. <0001stat.HK>. \
 \
Besides, you can refer the HKEX website for the full list of securities that not subject to stamp duty: \
http://www.HKEX.com.hk/eng/market/sec_tradinfo/secstpduty.htm  \
(please see pic2) \
 \
If need further assistance \
Your case will be directing to specific content team, kindly be note office hour is from 01:00-10:00GMT. \
\', \'https://i.imgur.com/Xy7oAKh.png\', \'https://i.imgur.com/K31AAnp.png\')';
        dbh.query(db_cmd1, function (err, result) {
            res.send(result);
        });


    } else {
        dbh.query(db_cmd, function (err, result) {
            res.send(result);
        });
    }
    
    
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

    if (action && action == 'project'){
        q_project(req, res);
    } else if (action && action.length > 0) {
        q_quick_response(req, res);
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

function q_quick_response(req,res) {
    var client = get_pg_client();
    var err = {};
    var action = req.body.result.action;

    client.connect(function (err) {
        if (err) {
            console.log(err);
            res.json(err);
        }
    });

    console.log("DB connected~~!")

    client.query('SELECT * FROM quick_response where action like \'%' + action + '%\'', function (err, result) {
        if (err) {
            return res.json(err);
        } else {
            if (result.rowCount > 0) {
                var slack_message = {
                    "text": result.rows[0].title,
                    "attachments": [{
                        "fields": [{ 
                            "value": formatDescr(result.rows[0].solution_descr), 
                            "short": "false" 
                        }]
                    }]
                };
                if (result.rows[0].thumb_url1) {
                    slack_message.attachments.push(
                        {"title": "pic1", "image_url": result.rows[0].thumb_url1}
                    );
                }
                if (result.rows[0].thumb_url2) {
                    slack_message.attachments.push(
                        {"title": "pic2", "image_url": result.rows[0].thumb_url2}
                    );
                }
                if (result.rows[0].thumb_url3) {
                    slack_message.attachments.push(
                        {"title": "pic3", "image_url": result.rows[0].thumb_url3}
                    );
                }
                if (result.rows[0].thumb_url4) {
                    slack_message.attachments.push(
                        {"title": "pic4", "image_url": result.rows[0].thumb_url4}
                    );
                }
                if (result.rows[0].thumb_url5) {
                    slack_message.attachments.push(
                        {"title": "pic5", "image_url": result.rows[0].thumb_url5}
                    );
                }
                
                return res.json({
                    speech: result.rows[0].solution_descr,
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

function formatDescr(str) {
    var descr = replaceAll(str, '\\n', '\n');
    descr = replaceAll(descr, '\\t', '\t');
    return descr;
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
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



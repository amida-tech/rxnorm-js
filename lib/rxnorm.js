"use strict";
var fs          = require("fs"),
    request     = require("request"),
    path        = require("path"),
    async       = require("async"),
    util        = require("util"),
    querystring = require("querystring");

// generic GET query with any endpoint
function query(base, q, callback) {
    var url = util.format("%s?%s", base, querystring.stringify(q));
    request(url, function (err, response) {
        if (err) return callback(err);
        callback(null, response.body);
    });
}

// query the FDA endpoint
function queryfda(q, callback) {
    query("https://api.fda.gov/drug/event.json", q, callback);
}

// search adverse events for drugs using RxNorm
function queryfdaCode(medcode, callback) {
    queryfda({
        search: "patient.drug.openfda.rxcui:" + medcode,
        count: "patient.reaction.reactionmeddrapt.exact"
    }, callback);
}

// search adverse events for drugs with the same brand or generic name
function queryfdaName(medname, callback) {
    queryfda({
        search: "patient.drug.openfda.generic_name:" + medname + "+brand_name:" + medname,
        count: "patient.reaction.reactionmeddrapt.exact"
    }, callback);
}

// find images for a medication with a certain rxcui code
function queryRxImageCode(medcode, callback) {
    query("http://rximage.nlm.nih.gov/api/rximage/1/rxbase", {
        rxcui: medcode,
        resolution: 600
    }, callback);
}

// find a medication by name
function queryRxNormName(medname, callback) {
    query("http://rxnav.nlm.nih.gov/REST/rxcui.json", {
        name: medname
    }, callback);
}

// find spelling suggestions for a medication
function queryRxNormSpelling(medname, callback) {
    query("http://rxnav.nlm.nih.gov/REST/spellingsuggestions.json", {
        name: medname
    }, callback);
}

// find a medication by approximate name
function queryRxNormApproximate(medname, maxEntries, callback) {
    // maxEntries is optional
    if (!callback) {
        callback = maxEntries;
        maxEntries = 5;
    }

    query("http://rxnav.nlm.nih.gov/REST/approximateTerm.json", {
        term: medname,
        maxEntries: maxEntries
    }, callback);
}

// find a medication by dose form group
function queryRxNormDFG(rxcui, callback) {
    query("http://rxnav.nlm.nih.gov/REST/rxcui/" + rxcui + "/related.json", {
        tty: "DFG"
    }, callback);
}

// medlinePlus Connect, submit code, code system (RxNorm), and drug name
function queryMedlinePage(rxcui, medname, callback) {
    query("http://apps.nlm.nih.gov/medlineplus/services/mpconnect_service.cfm", {
        "mainSearchCriteria.v.cs": "2.16.840.1.113883.6.88",
        "mainSearchCriteria.v.c": rxcui,
        "mainSearchCriteria.v.dn": "",
        "informationRecipient.languageCode.c": "en",
        "knowledgeResponseType": "application/json"
    }, callback);
}

function drugFormList(drugs, callback) {
    var newDrugs = drugs;
    newDrugs.compiled = [];
    newDrugs.dfg = [];
    newDrugs.brand = [];
    var brandRegEx = /\[([^\]]+)\]/g; //retrieve between square brackets
    var doseFormGroups = [];

    async.series([
        // read in doseFormGroups from text file
        function (cb) {
            fs.readFile(path.resolve(__dirname, "dose_form_groups.txt"), "UTF-8", function (err, doseForms) {
                if (err) return cb(err);
                // each group is a new line in the file
                doseFormGroups = doseForms.toString().split("\n").filter(function (form) {
                    // ignore empty lines
                    return form.length > 0;
                });
                cb();
            });
        },
        function (cb) {
            if (newDrugs.drugGroup) {
                if (newDrugs.drugGroup.conceptGroup) {
                    async.each(newDrugs.drugGroup.conceptGroup, function (conceptGroup, cb2) {
                        if (conceptGroup.conceptProperties) {
                            async.each(conceptGroup.conceptProperties, function (drug, cb3) {
                                if (drug.tty === "GPCK" || drug.tty === "BPCK") {
                                    cb3();
                                } else {
                                    drug.dfg = [];
                                    newDrugs.compiled.push(drug);
                                    cb3();
                                }
                            }, function (err) {
                                cb2();
                            });
                        } else {
                            cb2();
                        }
                    }, function (err, results) {
                        cb();
                    });
                } else {
                    cb();
                }
            } else {
                cb();
            }
        },
        function (cb) {
            if (newDrugs.compiled) {
                async.each(drugs.compiled, function (drug, cb3) {
                    if (drug.tty === "GPCK" || drug.tty === "BPCK") {
                        cb3();
                    } else {
                        var possibleDrugFormList = [];
                        var possibleFormList = [];
                        var formList = [];
                        var drugBrand = "Generic";
                        var modifiedName = drug.name;
                        async.series([function (cb4) {
                            for (var i = 0; i <= doseFormGroups.length; i++) {
                                if (i === doseFormGroups.length) {
                                    if (possibleFormList.length === 0) {
                                        possibleFormList.push("Other");
                                        possibleDrugFormList.push("Other");
                                    }
                                    cb4();
                                } else {
                                    if (drug.name.indexOf(doseFormGroups[i]) !== -1) {
                                        possibleFormList.push(doseFormGroups[i]);
                                        possibleDrugFormList.push(doseFormGroups[i]);
                                        modifiedName = modifiedName.replace(doseFormGroups[i], "");
                                    }
                                }
                            }
                        }, function (cb4) {
                            for (var i = 0; i <= doseFormGroups.length; i++) {
                                if (i === doseFormGroups.length) {
                                    if (possibleFormList.length === 0) {
                                        possibleFormList.push("Other");
                                        possibleDrugFormList.push("Other");
                                    }
                                    cb4();
                                } else {
                                    if (drug.synonym.indexOf(doseFormGroups[i]) !== -1) {
                                        possibleFormList.push(doseFormGroups[i]);
                                        possibleDrugFormList.push(doseFormGroups[i]);
                                    }
                                }
                            }
                        }, function (cb4) {
                            for (var i = 0; i <= possibleDrugFormList.length; i++) {
                                if (i === possibleDrugFormList.length) {
                                    cb4();
                                } else {
                                    if (formList.indexOf(possibleDrugFormList[i]) === -1) {
                                        formList.push(possibleDrugFormList[i]);
                                    }
                                }
                            }
                        }, function (cb4) {
                            for (var i = 0; i <= newDrugs.compiled.length; i++) {
                                if (i === newDrugs.compiled.length) {
                                    cb4();
                                } else {
                                    var tempBrand = drug.name.match(brandRegEx);
                                    if (tempBrand) {
                                        drugBrand = tempBrand[tempBrand.length - 1];
                                        drugBrand = drugBrand.replace("[", "").replace("]", "");
                                        if (newDrugs.brand.indexOf(drugBrand) === -1) {
                                            newDrugs.brand.push(drugBrand);
                                        }
                                    }
                                }
                            }
                        }, function (cb4) {
                            for (var i = 0; i <= newDrugs.compiled.length; i++) {
                                if (i === newDrugs.compiled.length) {
                                    cb4();
                                } else {
                                    if (newDrugs.compiled[i] === drug) {
                                        newDrugs.compiled[i].dfg = formList;
                                        newDrugs.compiled[i].brand = drugBrand;
                                        newDrugs.compiled[i].modifiedname = modifiedName.replace("[" + drugBrand + "]", "");
                                    }
                                }
                            }
                        }], function (err, results) {
                            for (var i = 0; i <= possibleFormList.length; i++) {
                                if (i === possibleFormList.length) {
                                    cb3();
                                } else {
                                    if (newDrugs.dfg.indexOf(possibleFormList[i]) === -1) {
                                        newDrugs.dfg.push(possibleFormList[i]);
                                    }
                                }
                            }
                        });
                    }
                }, function (err) {
                    cb();
                });
            } else {
                cb();
            }
        }
    ], function (err, results) {
        callback(null, newDrugs);
    });
}

// query dose form groups
function queryRxNormGroup(medname, callback) {
    query("http://rxnav.nlm.nih.gov/REST/drugs.json", {
        name: medname
    }, function (err, body) {
        if (err) return callback(err);
        drugFormList(JSON.parse(body), callback);
    });
}

// export functions
module.exports = {
    queryfdaCode: queryfdaCode,
    queryfdaName: queryfdaName,
    queryRxImageCode: queryRxImageCode,
    queryRxNormName: queryRxNormName,
    queryRxNormSpelling: queryRxNormSpelling,
    queryRxNormApproximate: queryRxNormApproximate,
    queryRxNormDFG: queryRxNormDFG,
    queryMedlinePage: queryMedlinePage,
    queryRxNormGroup: queryRxNormGroup
};

"use strict";
let superagent = require("superagent");
let _ = require("lodash");
let url = require("url");
let inflection = require("inflection");

function delay(ms){
  return function(callback){
    setTimeout(callback, ms);
  };
}


module.exports.register = function*(plugin){
  plugin.expose("type", "host");
  plugin.expose("parameters", {
    credentials:[
      {name: "clientId", required: true},
      {name: "apiKey", required: true}
    ],
    options:[
      {name: "name", required: true},
      {name: "sizeId", required: false},
      {name: "sizeSlug", required: false},
      {name: "imageId", required: false},
      {name: "imageSlug", required: false},
      {name: "regionId", required: false},
      {name: "regionSlug", required: false},
      {name: "sshKeyIds", required: false},
      {name: "privateNetworking", required: false},
      {name: "backupsEnabled", required: false}
    ]
  });
  plugin.expose("provision", function* (parameters) {
    let makeCall = module.exports.makeCall;
    let credentials = parameters.credentials || {};
    let query = _.assign({}, credentials, parameters.options || {});
    if(!query.name){
      query.name = "ServiceMakerDroplet";
    }
    query = _.transform(query, function(res, val, key){
      res[inflection.underscore(key)] = val;
    });
    if(!query["size_id"] && !query["size_slug"]){
      query["size_slug"] = "512mb";
    }
    if(!query["region_id"] && !query["region_slug"]){
      query["region_slug"] = "nyc2";
    }
    if(!query["image_id"] && !query["image_slug"]){
      query["image_slug"] = "ubuntu-14-04-x32";
    }
    let r = yield makeCall("droplets/new", query);
    let id = r.body.droplet.id;
    let eventId = r.body.droplet["event_id"];
    query = {
      "client_id": credentials.clientId,
      "api_key": credentials.apiKey
    };
    var start = new Date();
    yield delay(5000);
    while(true){
      r = yield makeCall("events/" + eventId, query);
      if(r.body.event["action_status"]){
        break;
      }
      else{
        if((new Date() - start) >= 600000 ){ // wait max 10 minutes
            throw new Error("Timeout");
        }
        yield delay(15000);
      }
    }
    r = yield makeCall("droplets/" + id, query);
    let ip = r.body.droplet["ip_address"];
    return { id: id, ip: ip};
  });
};

module.exports.register.attributes = {
  pkg: require("./package.json")
};

module.exports.makeCall = function (relativeUrl, query){
  return function(cb){
    let u = url.resolve("https://api.digitalocean.com/v1/", relativeUrl);
    superagent.get(u).query(query)
      .end(function(r){
        if(typeof r === "string"){
          return cb(new Error(r));
        }
        if(r instanceof Error){
          return cb(r);
        }
        let b = r.body || {};
        if(b.status !== "OK"){
          cb(new Error(b.message || "Unknown error"));
        }
        cb(null, r);
      });
  };
};

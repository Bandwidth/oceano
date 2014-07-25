"use strict";
let plugin = require("..");
let helper = require("./hostHelper");
let sinon = require("sinon");
let Hapi = require("co-hapi");


describe("The Digital Ocean service provider", function() {
  let server, digitalOcean;
  before(function*(){
    server = new Hapi.Server("localhost", 3001);
    yield server.pack.register(plugin);
    digitalOcean = server.plugins[require("../package.json").name];
  });

  it("provides metadata about the service", function() {
    digitalOcean.type.should.equal("host");
  });

  describe("provisioning an instance", function() {
    let runner, stub;
    beforeEach(function() {
      runner = helper.createRunner();
      stub = sinon.stub(plugin, "makeCall");
      stub.withArgs("droplets/new").returns({
        body: {
          droplet: {
            id: "id",
            "event_id": "eventId"
          }
        }
      });
      stub.withArgs("droplets/id").returns({
        body: {
          droplet: {
            id: "id",
            "ip_address": "192.168.1.1"
          }
        }
      });
      stub.withArgs("events/eventId").returns({
        body: {
          event: {
            "action_status": null
          }
        }
      });
    });

    afterEach(function * () {
      runner.free();
      stub.restore();
    });

    it("creates new VPS", function * () {
      yield runner.runJob(5000, function * () {
        let clientId = "FAKE_CLIENT_ID";
        let apiKey = "FAKE_API_KEY";
        setTimeout(function() {
          stub.withArgs("events/eventId").returns({
            body: {
              event: {
                "action_status": "done"
              }
            }
          });
        }, 10000); // simulate 10 seconds to create VPS
        let result = yield digitalOcean.provision({
          credentials: {
            apiKey: apiKey,
            clientId: clientId
          },
          options: {
            name: "ServiceMakerTest",
            sizeSlug: "1gb",
            regionSlug: "nyc",
            imageSlug: "ubuntu"
          }
        });
        stub.args[0][1].should.eql({
          api_key: "FAKE_API_KEY",
          client_id: "FAKE_CLIENT_ID",
          name: "ServiceMakerTest",
          size_slug: "1gb",
          region_slug: "nyc",
          image_slug: "ubuntu"
        });
        let id = result.id;
        id.should.equal("id");
        (stub.args.length > 1).should.be.true;
        for (let i = 1; i <= stub.args.length; i++) {
          if (stub.args[i]) {
            stub.args[i][1].should.eql({
              api_key: "FAKE_API_KEY",
              client_id: "FAKE_CLIENT_ID"
            });
          }
        }
      });
    });

    it("throws timeout error if creating of VPS has not completed in 10 minutes", function * () {
      yield runner.runJob(60000, function * () {
        try {
          let clientId = "FAKE_CLIENT_ID";
          let apiKey = "FAKE_API_KEY";
          yield digitalOcean.provision({
            credentials: {
              apiKey: apiKey,
              clientId: clientId
            },
            options: {
              name: "ServiceMakerTest",
              sizeSlug: "1gb",
              regionSlug: "nyc",
              imageSlug: "ubuntu"
            }
          });
          throw new Error("It should throw timeout error");
        } catch (err) {
          err.message.should.equal("Timeout");
        }
      });
    });
  });
});

App = {
  web3Provider: null,
  contracts: {},

  /**
   * Initialize this app by initializing Web3 instance.
   */
  init: function () {
    return App.initWeb3();
  },

  /**
   * Initialize provider for Web3 instance.
   */
  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      // NOT SUITABLE FOR PRODUCTION!!!
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }

    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  /**
   * Pull contract artifact file and initialize it with truffle-contract.
   */
  initContract: function () {
    $.getJSON('Congress.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var CongressArtifact = data;
      App.contracts.Congress = TruffleContract(CongressArtifact);

      // Set the provider for our contract
      App.contracts.Congress.setProvider(App.web3Provider);
    });

    return App.bindEvents();
  },

  /**
   * Bind on-click events from HTML pages to JS functions.
   */
  bindEvents: function () {
    $(document).on('click', '.btn-create-congress', App.createCongress); // Bind Button "create_congress" on page "create_congress.html"
    $(document).on('click', '.btn-create-bmc', App.createBMC); // Bind Button "Create BMC" on page "create_bmc.html"
    $(document).on('click', '.btn-agree', App.votePositive); // Bind Buotton "Agree" on page "vote.html"
    $(document).on('click', '.btn-dismiss', App.voteNegative); // Bind Button "Dismiss" on page "vote.html" 
    $(document).on('click', '.btn-join-congress', App.joinCongress); // Bind Button "Join" on Page "join_congress.html"
  },

  /**
   * Create a new congress with given parameters and parse addresses.
   */
  createCongress: function (event) {
    event.preventDefault();

    var minimumQuorumForProposals = document.getElementById("votes");
    var minutesForDebate = document.getElementById("time");
    var marginOfVotesForMajority = document.getElementById("quorum");

    var allMembers = document.getElementById("adresses").value;
    var members = [];
    var member = "";

    for (var i = 0; i < allMembers.length; ++i) {
      if (allMembers[i] != ",") {
        member += allMembers[i];
      }
      else {
        members[members.length] = member;
        member = "";
      }
    }

    App.contracts.Congress.new(minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority).then(function (instance) {
      sessionStorage.setItem("instanceAddress", instance.address);

      window.alert("Your congress has been successfully created! The address of your contract is: " + instance.address);

      App.addMembers(instance, members);

      web3.eth.filter('latest', function (error, result) {
        if (!error) {
          sessionStorage.setItem("login", true);
          window.location.href = "create_bmc.html";
        } else {
          console.log(error.message);
        }
      });
    }).catch(function (err) {
      console.log(err.message); // There was an error! Handle it.
    });
  },

  /**
     * Add member addresses to contract as individual transactions.
     */
  addMembers: function (instance, members) {
    for (i = 0; i < members.length; ++i) {
      if (members[i] !== '0x0000000000000000000000000000000000000000') {
        instance.addMember(members[i]).catch(function (err) {
          console.log(err.message);
        });
      }
    }
  },

  /**
   * Add elements of BMC as individual proposals to contract.
   */
  createBMC: function (event) {
    var bmc = [document.getElementById("partners").value, document.getElementById("activities").value, document.getElementById("resources").value,
    document.getElementById("value").value, document.getElementById("cr").value, document.getElementById("channels").value,
    document.getElementById("cs").value, document.getElementById("cost").value, document.getElementById("revenue").value];

    App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
      instance.newProposal(bmc[0], "0x123").then(function (err, res) {
        instance.newProposal(bmc[1], "0x123").then(function (err, res) {
          instance.newProposal(bmc[2], "0x123").then(function (err, res) {
            instance.newProposal(bmc[3], "0x123").then(function (err, res) {
              instance.newProposal(bmc[4], "0x123").then(function (err, res) {
                instance.newProposal(bmc[5], "0x123").then(function (err, res) {
                  instance.newProposal(bmc[6], "0x123").then(function (err, res) {
                    instance.newProposal(bmc[7], "0x123").then(function (err, res) {
                      instance.newProposal(bmc[8], "0x123").then(function (err, res) {
                        window.location.href = "vote.html";
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    }).catch(function (err) {
      console.log(err.message);
    });

    //for (i = 0; i < 9; ++i) {
    //  instance.newProposal(bmc[i], "0x123").catch(function (err) { //does the transaction bytecode actually matter?
    //    console.log(err.message);
    //  });
    //}

    //web3.eth.filter('latest', function (error, result) {
    //  if (!error) {
    //    window.location.href = "vote.html";
    //  } else {
    //    console.log(error.message);
    //  }
    //});
  },

  /**
   * Vote positively on selected proposal. 
   */
  votePositive: function (event) {
    var proposalNumber = document.activeElement.id;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      } else {
        App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
          instance.memberExists.call(accounts[0]).then(function (res, err) {
            if (err) {
              console.log(err.message);
            } else {
              if (res) {
                instance.vote(proposalNumber, true);
              } else {
                window.alert("This account is not eligible to vote in this congress!");
              }
            }
          });
        }).catch(function (err) {
          console.log(err.message); // There was an error! Handle it.
        });
      }
    });
  },

  /**
   * Vote negatively on selected proposal. 
   */
  voteNegative: function (event) {
    var proposalNumber = document.activeElement.id;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      } else {
        App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
          instance.memberExists.call(accounts[0]).then(function (res, err) {
            if (err) {
              console.log(err.message);
            } else {
              if (res) {
                instance.vote(proposalNumber, false);
              } else {
                window.alert("This account is not eligible to vote in this congress!");
              }
            }
          });
        }).catch(function (err) {
          console.log(err.message); // There was an error! Handle it.
        });
      }
    });
  },

  /**
   * Join a contract at a specific address.
   */
  joinCongress: function (event) {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      } else {
        App.contracts.Congress.at(document.getElementById("addressField").value).then(function (instance) {
          sessionStorage.setItem("instanceAddress", instance.address);

          instance.memberExists.call(accounts[0]).then(function (res, err) {
            if (err) {
              console.log(err.message);
            } else {
              if (res) {
                sessionStorage.setItem("login", true);
                window.location.href = "vote.html";
              } else {
                window.alert("This account is not eligible to join this congress!");
              }
            }
          });
        }).catch(function (err) {
          console.log(err.message); // There was an error! Handle it.
        });
      }
    });
  },

  /**
   * Initialize the descriptions of the proposals.
   */
  getProposalDescriptions: function () {
    App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
      for (var i = 0; i < 9; ++i) {
        (function (cntr) {
          instance.getProposalDescription.call(cntr).then(function (res, err) {
            if (err) {
              console.log(err);
            } else {
              var parent = document.getElementById("body-" + cntr);
              parent.insertBefore(document.createTextNode(res), parent.firstChild);
            }
          });
        })(i);
      }
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();

    window.onbeforeunload = function () {
      if (window.location.pathname == "/create_bmc.html") {
        return "";
      }
    };

    window.setTimeout(function () {
      if (window.location.pathname == "/vote.html") {
        App.getProposalDescriptions();
      }
    }, 100);
  });
});

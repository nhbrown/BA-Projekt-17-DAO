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
   * Bind on-click events from HTML page to JS functions.
   */
  bindEvents: function () {
    //$("#create_button").click(App.createCongress);
    $(document).on('click', '.btn btn-primary', App.createCongress); // Bind Button "create_congress"
    $(document).on('click', '.join', App.joinCongress); // Bind Button "Join" 
    $(document).on('click', '.btn-success', App.votePositive); // Bind Button "Agree" 
    $(document).on('click', '.btn-danger', App.voteNegative); // Bind Button "Dismiss"
  },

  /**
   * Create a new congress with given parameters and parse addresses.
   */
  createCongress: function (event) {
    event.preventDefault();

    var congressName = App.sanitize(document.getElementById("congressname").value, "Congress Name");
    var minimumQuorumForProposals = App.checkNumerical(document.getElementById("numberofvotes").value, "Number of minimum required Votes");
    var minutesForDebate = App.checkNumerical(document.getElementById("votingtime").value, "Voting Time");
    var marginOfVotesForMajority = App.checkNumerical(document.getElementById("quorum").value, "Minimum required Quorum");

    var allMembers = document.getElementById("adresses").value;
    var members = [];
    var member = "";

    for (var i = 0; i < allMembers.length; ++i) {
      if (allMembers[i] != ",") {
        member += allMembers[i];
      }
      else {
        members[members.length] = App.checkAlphanumerical(member, "congress member addresses");
        member = "";
      }
    }

    App.contracts.Congress.new(congressName, minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority).then(function (instance) {
      sessionStorage.setItem("instanceAddress", instance.address);

      window.alert("Your congress has been successfully created! The address of your contract is: " + instance.address);

      App.addMembers(instance, members);

      web3.eth.filter('latest', function (error, result) {
        if (!error) {
          App.createBMC();
          document.getElementById("vote_proposal").style.visibility = 'visible';
          App.getProposalDescriptions();
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
  createBMC: function () {
    var bmc = [App.sanitize(document.getElementById("partners").value, "Key Partners"),
    App.sanitize(document.getElementById("activities").value, "Key Activities"),
    App.sanitize(document.getElementById("resources").value, "Key Resources"),
    App.sanitize(document.getElementById("value").value, "Value Proposition"),
    App.sanitize(document.getElementById("cr").value, "Customer Relationships"),
    App.sanitize(document.getElementById("channels").value, "Channels"),
    App.sanitize(document.getElementById("cs").value, "Customer Segments"),
    App.sanitize(document.getElementById("cost").value, "Cost Structure"),
    App.sanitize(document.getElementById("revenue").value, "Revenue Streams")];

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
                        //window.location.href = "vote.html";
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
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  /**
   * Check user input to contain only numeric characters.
   */
  checkNumerical: function (input, fieldName) {
    var re = /^[0-9]/; // regular expression to match only numeric characters
    if (input === "") {
      window.alert("Please enter a value for " + fieldName + "!");
      throw new Error("Incorrect user input! Cancelling all further execution.")
    } else {
      if (!re.test(input)) {
        window.alert(fieldName + " contains invalid charactes! Only numeric characters are allowed.");
        throw new Error("Incorrect user input! Cancelling all further execution.")
      } else {
        return input;
      }
    }
  },

  /**
   * Check user input to contain only alphanumeric characters.
   */
  checkAlphanumerical: function (input, fieldName) {
    var re = /^[\w ]+$/; // regular expression to match only alphanumeric characters and spaces
    if (input === "") {
      window.alert("Please enter a value for " + fieldName + "!");
      throw new Error("Incorrect user input! Cancelling all further execution.")
    } else {
      if (!re.test(input)) {
        window.alert(fieldName + " contains invalid charactes! Only alphanumeric characters are allowed.");
        throw new Error("Incorrect user input! Cancelling all further execution.")
      } else {
        return input;
      }
    }
  },

  /**
   * Sanitize user input to prevent HTML injection.
   */
  sanitize: function (input, fieldName) {
    if (input === "") {
      window.alert("Please enter a value for " + fieldName + "!");
      throw new Error("Incorrect user input! Cancelling all further execution.")
    } else {
      if (input.includes('<')) {
        input.replace(/</g, '&lt');
      }
      if (input.includes('>')) {
        input.replace(/>/g, '&gt');
      }
      if (input.includes('&')) {
        input.replace(/&/g, '&amp');
      }
      if (input.includes('"')) {
        input.replace(/"/g, '&quot');
      }
      if (input.includes("'")) {
        input.replace(/'/g, '&39');
      }

      return input;
    }
  }
};

$(function () {
  $(window).on('load', function () {

    App.init();

    //window.onbeforeunload = function () {
    //  if (window.location.pathname == "/create_bmc.html") {
    //    return "";
    //  } else if (window.location.pathname == "/vote.html") {
    //    return "";
    //  }
    //};

    //window.setTimeout(function () {
    //  if (window.location.pathname == "/vote.html") {
    //    App.getProposalDescriptions();
    //  }
    //}, 100);

  });
});
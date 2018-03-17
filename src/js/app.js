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
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
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
    $("#create_button").click(App.createCongress);              // Bind Button "create_congress"
    $("#join").click(App.joinCongress);                         // Bind Button "join"
    $("#addMemberBtn").click(App.additionalMember);             // Bind Button "addMemberBtn"
    $(document).on('click', '.btn-success', App.votePositive);  // Bind Button "Agree" 
    $(document).on('click', '.btn-danger', App.voteNegative);   // Bind Button "Dismiss"
  },

  /**
   * Create a new congress with given parameters and parse addresses.
   */
  createCongress: function (event) {
    event.preventDefault();

    try {
      var congressName = App.sanitize(document.getElementById("congressname").value, "Congress Name");
      var minimumQuorumForProposals = App.sanitize(document.getElementById("quorum").value, "Minimum Votes");
      var minutesForDebate = App.sanitize(document.getElementById("votingtime").value, "Voting Time");
      var marginOfVotesForMajority = App.sanitize(document.getElementById("margin").value, "Majority Margin");
    } catch (err) {
      console.log(err)
    }

    var members = document.getElementsByName("address-weight");
    var ownerWeight = document.getElementById("ownerWeight").value;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      } else {
        //temporary fix for MetaMask gas limit issue: hardcoding the gas limit
        App.contracts.Congress.new(congressName, ownerWeight, minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority, { from: accounts[0], gas: 3800000 }).then(function (instance) {
          sessionStorage.setItem("instanceAddress", instance.address);

          window.alert("Your congress has been successfully created! The address of the contract is: " + instance.address);

          App.addMembers(members);

          // event needs to be a variable for some reason, otherwise the filter triggers twice
          var event = instance.MembershipChanged(); // get the MembershipChanged event

          event.watch(function (err, response) {  // install listener to event
            var res = response.args.member;
            var last = members[members.length - 2].value;
            if (res.localeCompare(last.toLowerCase()) === 0) { // if the latest block contains the last member
              App.createBMC();                                 // than start creating the proposals
              event.stopWatching();                            // and uninstall the listener
            }
          });
        }).catch(function (err) {
          console.log(err.message);
        });
      }
    });
  },

  /**
   * Clones the existing input group for address and weight of a member,
   * assigns a unique Id to it and inserts it before the button in the same card.
   */
  additionalMember: function () {
    var clone = document.getElementById("input_group").cloneNode(true);

    $(clone).find('input').val(''); // clear all values

    clone.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now(); // create unique id

    document.getElementById("second_card").insertBefore(clone, document.getElementById("addMemberBtn"));
  },

  /**
   * Add member addresses to contract as individual transactions.
   */
  addMembers: function (members) {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      } else {
        App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
          for (var i = 0; i < members.length; i += 2) {
            if (members[i].value != '0x0000000000000000000000000000000000000000') {
              try {
                if (App.isAddress(members[i].value, "Member Address")) {
                  instance.addMember(members[i].value, members[i + 1].value, { from: accounts[0] });
                }
              } catch (err) {
                console.log(err);
              }
            }
          }
        }).catch(function (err) {
          console.log(err);
        });
      }
    });
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
    App.sanitize(document.getElementById("channel").value, "Channels"),
    App.sanitize(document.getElementById("cs").value, "Customer Segments"),
    App.sanitize(document.getElementById("cost").value, "Cost Structure"),
    App.sanitize(document.getElementById("revenue").value, "Revenue Streams")];

    App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
      instance.newProposal(bmc[0]).then(function (err, res) {
        instance.newProposal(bmc[1]).then(function (err, res) {
          instance.newProposal(bmc[2]).then(function (err, res) {
            instance.newProposal(bmc[3]).then(function (err, res) {
              instance.newProposal(bmc[4]).then(function (err, res) {
                instance.newProposal(bmc[5]).then(function (err, res) {
                  instance.newProposal(bmc[6]).then(function (err, res) {
                    instance.newProposal(bmc[7]).then(function (err, res) {
                      instance.newProposal(bmc[8]).then(function (err, res) {
                        App.getProposalDescriptions();
                        sessionStorage.setItem("proposalsAdded", "true");
                        document.getElementById("addMemberBtn").disabled = true;
                        document.getElementById("create_button").disabled = true;
                        document.getElementById("j_button").disabled = true;
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
   * Vote in favour of the selected proposal. 
   */
  votePositive: function (event) {
    var proposalNumber = document.activeElement.id.charAt(0);

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

                web3.eth.filter('latest', function (error, result) {
                  if (!error) {
                    document.getElementById(proposalNumber + "-a").disabled = true;
                    document.getElementById(proposalNumber + "-d").disabled = true;
                  } else {
                    console.log(error.message);
                  }
                });

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
   * Vote not in favour of the selected proposal. 
   */
  voteNegative: function (event) {
    var proposalNumber = document.activeElement.id.charAt(0);

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

                web3.eth.filter('latest', function (error, result) {
                  if (!error) {
                    document.getElementById(proposalNumber + "-a").disabled = true;
                    document.getElementById(proposalNumber + "-d").disabled = true;
                  } else {
                    console.log(error.message);
                  }
                });

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
        if (App.isAddress(document.getElementById("congressadress").value, "Congress Address")) {
          App.contracts.Congress.at(document.getElementById("congressadress").value).then(function (instance) {
            sessionStorage.setItem("instanceAddress", instance.address);

            instance.memberExists.call(accounts[0]).then(function (res, err) {
              if (err) {
                console.log(err.message);
              } else {
                if (res) {
                  App.getProposalDescriptions();
                  sessionStorage.setItem("proposalsAdded", "true");
                  document.getElementById("join").disabled = true;
                  document.getElementById("cc_button").disabled = true;
                } else {
                  window.alert("This account is not eligible to join this congress!");
                }
              }
            });
          }).catch(function (err) {
            console.log(err.message); // There was an error! Handle it.
          });
        }
      }
    });
  },

  /**
   * Initialize the descriptions of the proposals.
   */
  getProposalDescriptions: function () {
    App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
      document.getElementById("vote_proposal").style.visibility = 'visible';

      instance.congressName.call().then(function (res, err) {
        if (err) {
          console.log(err);
        } else {
          document.getElementById("cn_button").innerHTML = "Congress: " + res;
        }
      });

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
   * Displays the results of the proposals.
   */
  showResults: function (event) {
    App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
      document.getElementById("res1").hidden = false;
      document.getElementById("res2").hidden = false;
      document.getElementById("res3").hidden = false;

      for (var i = 0; i < 9; ++i) {
        (function (cntr) {
          instance.proposals.call(cntr).then(function (res, err) {
            if (err) {
              console.log(err);
            } else {
              var totalVotes = "Total Votes: " + res[4];
              var inFavour = "<br> Votes in favour: " + App.toPercentage(res[5], res[4]) + "%";
              var opposed = "<br> Votes opposed: " + App.toPercentage(res[6], res[4]) + "%";
              var result = "<br> Result: " + res[7] + " to " + res[8];

              var proposalButton = document.getElementById("btn-" + cntr);

              proposalButton.disabled = true;
              document.getElementById("prop-" + cntr).innerHTML = totalVotes + inFavour + opposed + result;

              if (res[3]) {
                proposalButton.style.backgroundColor = "#28a745";
                proposalButton.style.color = "#fff";
              } else {
                proposalButton.style.backgroundColor = "#dc3545";
                proposalButton.style.color = "#fff";
              }
            }
          });
        })(i);
      }
    });
  },

  /**
   * Returns percentage.
   */
  toPercentage: function (x, total) {
    if (total == 0) {
      return 0;
    } else {
      return x / total * 100;
    }
  },

  /**
   * Checks wether or not the votind deadline has been reached.
   */
  checkVotingDeadline: function (currentTime, callback) {
    App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
      instance.proposals.call(8).then(function (res, err) {
        if (err) {
          console.log(err);
        } else {
          if (currentTime >= res[1].c[0] && res[2] == false) {
            App.executeProposals();           // execute the proposals
            $('.modal').modal('hide');        // hide all open modals
            callback();                       // and execute the callback
          } else if (currentTime >= res[1].c[0] && res[2] == true) {
            App.showResults();
            callback();
          }
        }
      });
    });
  },


  /**
   * Executes the proposals.
   */
  executeProposals: function () {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      } else {
        App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
          for (var i = 0; i < 9; ++i) {
            (function (cntr) {
              instance.executeProposal(cntr, { from: accounts[0], gas: 80000 });
            })(i);
          }

          var event = instance.ProposalTallied();   // get the ProposalsTallied event

          event.watch(function (err, response) {    // install listener to event
            var res = response.args.proposalID.c[0];
            if (res === 8) {                        // if the latest block contains the last proposal
              App.showResults();                    // display the results
              event.stopWatching();                 // and uninstall the listener
            }
          });
        });
      }
    });
  },

  /**
   * Checks wether or not a given input is a valid Ethereum address.
   */
  isAddress: function (input, fieldName) {
    var re = /^0x[a-fA-F0-9]{40}$/;
    if (input === "") {
      window.alert("Please enter a value for " + fieldName + "!");
      throw new Error("Incorrect user input! Cancelling all further execution.")
    } else {
      if (!re.test(input)) {
        window.alert(input + " is not a valid Ethereum address!");
        throw new Error("Incorrect user input! Cancelling all further execution.")
      } else {
        return true;
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

    var timer = window.setInterval(timerFunc, 15000);

    function timerFunc() {
      if (sessionStorage.getItem("instanceAddress") && sessionStorage.getItem("proposalsAdded")) {
        var date = new Date();
        var secondsSinceEpoch = Math.round(date.getTime() / 1000);

        App.checkVotingDeadline(secondsSinceEpoch, function () {
          clearInterval(timer);
        });
      }
    }
  });

  window.onbeforeunload = function () {
    sessionStorage.clear();
  };
});
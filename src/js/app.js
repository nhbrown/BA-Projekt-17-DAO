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

    var minimumQuorumForProposals = App.checkNumerical(document.getElementById("votes").value, "Number of minimum required Votes");
    var minutesForDebate = App.checkNumerical(document.getElementById("time").value, "Voting Time");
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

    App.contracts.Congress.new(minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority).then(function (instance) {
      sessionStorage.setItem("instanceAddress", instance.address);

      window.alert("Your congress has been successfully created! The address of your contract is: " + instance.address);

      App.addMembers(instance, members);

      web3.eth.filter('latest', function (error, result) {
        if (!error) {
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
  },


  /**
   * Fetch the Voting Restults. (Statistik der Votes berechnen)
   */

   fetchResults: function() {
     var positiveCounts = [];
     var totalCounts = [];
     var overAllCounts = [];

    App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
      for (var i = 0; i < 9, ++i) {
      (function (i){
       positiveCounts[i] = [instance.Congress.proposals[i].currentResult.call()]; 
       totalCounts[i] = [instance.Congress.proposals[i].numberOfVotes.call()];
      })
      }
    overAllCounts[0] = positiveCounts;
    overAllCounts[1] = totalCounts;

    return overAllCounts;

    }).catch(function (err) {
      console.log(err.message);
    });

   },
   /**
   * Calculate the Voting Restults. (Statistik der Votes berechnen)
   */
   calculateResults: function(){
     var overAllCounts = App.fetchResults();
     var negativeVotes = [];
     var positiveRatios = [];
     var negativeRatios = [];
     var overallResults = [];
     // calculate negative votes
     for (var i; i < 9; ++i){
       negativeVotes[i] = overAllCounts[1][i] - overAllCounts[0][i];
     }
     // calculate positive and negative voting-% per BMC element
     for(var i; i < 9; ++i){
       positiveRatios[i] = overAllCounts[0][i] / overAllCounts[1][i] * 100;
       negativeRatios[i] = negativeVotes[i] / overAllCounts[1][i] * 100;
     }
     return overallResults[positiveRatios, negativeRatios]
   },

   showResults: function(event){
     var overallResults = App.calculateResults();

     document.getElementById('positivePartner').innerHTML = overallResults[0][0] + '% positive';
     document.getElementById('negativePartner').innerHTML = overallResults[1][0] + '% negative';
     document.getElementById('positiveActivities').innerHTML = overallResults[0][1] + '% positive';
     document.getElementById('negativeActivities').innerHTML = overallResults[1][1] + '% negative';
     document.getElementById('positiveResources').innerHTML = overallResults[0][2] + '% positive';
     document.getElementById('negativeResources').innerHTML = overallResults[1][2] + '% negative';
     document.getElementById('positiveValue').innerHTML = overallResults[0][3] + '% positive';
     document.getElementById('negativeValue').innerHTML = overallResults[1][3] + '% negative';
     document.getElementById('positiveRelation').innerHTML = overallResults[0][4] + '% positive';
     document.getElementById('negativeRelation').innerHTML = overallResults[1][4] + '% negative';
     document.getElementById('positiveChannel').innerHTML = overallResults[0][5] + '% positive';
     document.getElementById('negativeChannel').innerHTML = overallResults[1][5] + '% negative';
     document.getElementById('positiveSegment').innerHTML = overallResults[0][6] + '% positive';
     document.getElementById('negativeSegment').innerHTML = overallResults[1][6] + '% negative';
     document.getElementById('positiveCosts').innerHTML = overallResults[0][7] + '% positive';
     document.getElementById('negativeCosts').innerHTML = overallResults[1][7] + '% negative';
     document.getElementById('positiveRevenue').innerHTML = overallResults[0][8] + '% positive';
     document.getElementById('negativeRevenue').innerHTML = overallResults[1][8] + '% negative';
     

   }
  /**
   * Calculate Voting Restults. (Statistik der Votes berechnen)
   */
  calculateVotingResults: function (instance){
    //var votingCounts = [];
    var votingCounts = instance.getVotingInformation.call(); //Array "counts[] aus Back-End"
    //var ratios = []; //brauchen wir das Array überhaupt? 
    
    //Berechnungen der Statistiken der einzelnen Elemente des BMC. Hier Reihenfolge des "counts[] Arrays aus dem Backend beachten"
    var percentagePostivePartners = votingCounts[0] / votingCounts[2] * 100;
    var percentageNegativePartners = votingCounts[1] / votingCounts[2] * 100;
    var percentagePostiveActivities = votingCounts[3] / votingCounts[5] * 100;
    var percentageNegativeActivities = votingCounts[4] / votingCounts[5] * 100;
    var percentagePostiveResources = votingCounts[6] / votingCounts[8] * 100;
    var percentageNegativeResources = votingCounts[7] / votingCounts[8] * 100;
    var percentagePostiveValue = votingCounts[9] / votingCounts[11] * 100;
    var percentageNegativeValue = votingCounts[10] / votingCounts[11] * 100;
    var percentagePostiveRelation = votingCounts[12] / votingCounts[14] * 100;
    var percentageNegativeRelation = votingCounts[13] / votingCounts[14] * 100;
    var percentagePositiveChannels = votingCounts[15] / votingCounts[17] * 100;
    var percentageNegativeChannels = votingCounts[16] / votingCounts[17] * 100;
    var percentagePositiveSegments = votingCounts[18] / votingCounts[20] * 100;
    var percentageNegativeSegments = votingCounts[19] / votingCounts[20] * 100;
    var percentagePositiveCosts = votingCounts[21] / votingCounts[23] * 100;
    var percentageNegativeCosts = votingCounts[22] / votingCounts[23] * 100;
    var percentagePositiveRevenue = votingCounts[24] / votingCounts[26] * 100;
    var percentageNegativeRevenue = votingCounts[25] / votingCounts[26] * 100;
    /**ratio[0] = percentagePostivePartners;
    ratio[1] = percentageNegativePartners;
    ratio[2] = percentagePostiveActivities;
    ratio[3] = percentageNegativeActivities;
    ratio[4] = percentagePostiveResources;
    ratio[5] = percentageNegativeResources;
    ratio[6] = percentagePostiveValue;
    ratio[7] = percentageNegativeValue;
    ratio[8] = percentagePostiveRelation;
    ratio[9] = percentageNegativeRelation;
    ratio[10] = percentagePositiveChannels;
    ratio[11] = percentageNegativeChannels;
    ratio[12] = percentagePositiveSegments;
    ratio[13] = percentageNegativeSegments;
    ratio[14] = percentagePositiveCosts;
    ratio[15] = percentageNegativeCosts;
    ratio[16] = percentagePositiveRevenue;
    ratio[17] = percentageNegativeRevenue;
    */

    //Anzeige der Statistiken im Browser
    document.getElementById('positivePartner').innerHTML = percentagePositivePartners + '% positive';
    document.getElementById('negativePartner').innerHTML = percentageNegativePartners + '% negative';
    document.getElementById('positiveActivities').innerHTML = percentagePostiveActivities + '% positive';
    document.getElementById('negativeActivities').innerHTML = percentageNegativeActivities + '% negative';
    document.getElementById('positiveResources').innerHTML = percentagePostiveResources + '% positive';
    document.getElementById('negativeResources').innerHTML = percentageNegativeResources + '% negative';
    document.getElementById('positiveValue').innerHTML = percentagePostiveValue + '% positive';
    document.getElementById('negativeValue').innerHTML = percentageNegativeValue + '% negative';
    document.getElementById('positiveRelation').innerHTML = percentagePostiveRelation + '% positive';
    document.getElementById('negativeRelation').innerHTML = percentageNegativeRelation + '% negative';
    document.getElementById('positiveChannel').innerHTML = percentagePositiveChannels + '% positive';
    document.getElementById('negativeChannel').innerHTML = percentageNegativeChannels + '% negative';
    document.getElementById('positiveSegment').innerHTML = percentagePositiveSegments + '% positive';
    document.getElementById('negativeSegment').innerHTML = percentageNegativeSegments + '% negative';
    document.getElementById('positiveCosts').innerHTML = percentagePositiveCosts + '% positive';
    document.getElementById('negativeCosts').innerHTML = percentageNegativeCosts + '% negative';
    document.getElementById('positiveRevenue').innerHTML = percentagePositiveRevenue + '% positive';
    document.getElementById('negativeRevenue').innerHTML = percentageNegativeRevenue + '% negative';
    
  }
};

$(function () {
  $(window).load(function () {

    App.init();

    window.onbeforeunload = function () {
      if (window.location.pathname == "/create_bmc.html") {
        return "";
      } else if (window.location.pathname == "/vote.html") {
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
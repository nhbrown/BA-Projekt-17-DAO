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
    $(document).on('click', '.btn-success', App.votePositive); // Bind Buotton "Agree" on page "vote.html"
    $(document).on('click', '.btn-danger', App.voteNegative); // Bind Button "Dismiss" on page "vote.html" 
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
        instance.addMember(members[i]);
      }
    }
  },

  /**
   * Add elements of BMC as individual proposals to contract.
   */
  createBMC: function (event) {
    var bmc = [document.getElementById("partners").value, document.getElementById("activities").value, document.getElementById("ressources").value,
    document.getElementById("value").value, document.getElementById("cr").value, document.getElementById("channels").value,
    document.getElementById("cs").value, document.getElementById("cost").value, document.getElementById("revenue").value];

    App.contracts.Congress.at(sessionStorage.getItem("instanceAddress")).then(function (instance) {
      for (i = 0; i < 9; ++i) {
        instance.newProposal(bmc[i], "0x123");
      }

      web3.eth.filter('latest', function (error, result) {
        if (!error) {
          window.location.href = "vote.html";
        } else {
          console.log(error.message);
        }
      });
    }).catch(function (err) {
      console.log(err.message); // There was an error! Handle it.
    });
  },

  /**
   * Positiv wählen 
   */
  votePositive: function (event) {

  },

  /**
   * Negativ wählen 
   */
  voteNegative: function (event) {

  },

  /**
   * Congress beitreten
   */
  joinCongress: function (event) {
    var addressToJoin = document.getElementById("addressField").value;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      } else {
        App.contracts.Congress.at(addressToJoin).then(function (instance) {
          sessionStorage.setItem("instanceAddress", instance.address);

          if (instance.memberExists(accounts[0])) {
            window.location.href = "vote.html";
          } else {
            console.log("This account is not eligible to enter this congress!");
          }
        }).catch(function (err) {
          console.log(err.message); // There was an error! Handle it.
        });
      }
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});

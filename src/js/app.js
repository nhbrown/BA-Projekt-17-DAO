/**
   * Applikation mit Web3 instanziieren nach dem Pet-Shop Tuorial
   */
App = {
  web3Provider: null,
  contracts: {},

  /**
   * Initialisiere Web3
   */
  init: function () {
    return App.initWeb3();
  },

  /**
   * Initialisiere Web3
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
   * Initialisiere Contracts
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
   * Events binden.
   */
  bindEvents: function () {
    $(document).on('click', '.btn-create-congress', App.createCongress); // Bind Button "create_congress" on page "create_congress.html"
    $(document).on('click', '.btn-create-bmc', App.createBMC); // Bind Button "Create BMC" on page "create_bmc.html"
    $(document).on('click', '.btn-success', App.votePositive); // Bind Buotton "Agree" on page "vote.html"
    $(document).on('click', '.btn-danger', App.voteNegative); // Bind Button "Dismiss" on page "vote.html" 
    $(document).on('click', '.btn-join-congress', App.joinCongress); // Bind Button "Join" on Page "join_congress.html"
  },

  /**
   * Congress Erstellen 
   */
  createCongress: function (event) {
    event.preventDefault();

    var minimumQuorumForProposals = document.getElementById("formInput85");
    var minutesForDebate = document.getElementById("formInput93");
    var marginOfVotesForMajority = document.getElementById("formInput99");
    
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

    var congressInstance;

    //web3.eth.getAccounts(function(error, accounts) {
    // if (error) {
    //  console.log(error);
    //}

    App.contracts.Congress.deployed().then(function (instance) {
      congressInstance = instance;

      return congressInstance.Congress(minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority);
    }).then(function (result) {
      return App.addMembers(members); //members stehen für Adressen. Datentyp? Wie bekommen wir einzelne Adressen?
    }).catch(function (err) {
      console.log(errmessage);
    });
  },

  /**
     * Member hinzufügen 
     */
  addMembers: function (members) {
    for (i = 1; i < members.length; i++) { // Nullte Stelle nicht belegen
      if (members[i] !== '0x0000000000000000000000000000000000000000') {
        congressInstance.addMember(member[i]);
      }
    }
  },

  /**
   * BMC Erstellen 
   */
  createBMC: function (event) {
    // Wie bekommen wir die BMC Elemente in ein Arrray?
    //bmc[8] = 
    App.contracts.Congress.deployed().then(function (instance) {
      congressInstance = instance;

      for (i = 0; i < 9; i++) {
        congressInstance.newProposal(bmc[i], transactionBytecode);
      }
    });
  },

  /**
   * Positiv wählen 
   */
  votePositive: function (event) {

    App.contracts.Congress.deployed().then(function (instance) {
      congressInstance = instance;

      congressInstance.vote(proposalnumber, true);
    })
  },

  /**
   * Negativ wählen 
   */
  voteNegative: function (event) {

    App.contracts.Congress.deployed().then(function (instance) {
      congressInstance = instance;

      congressInstance.vote(proposalnumber, false);

    });
  },

  /**
   * Congress beitreten
   */
  joinCongress: function (event) {},

  /**
   * Funktion, um eine Instance zu bekommen (Vielleicht geht das so auch, ansonsten benötigt jede function scheinbar:
   *  App.contracts.Congress.deployed().then(function(instance){
          congressInstance = instance;
      ) siehe Pet-Shop
  */
  getInstance: function () {
    var congressInstance;

    App.contracts.Congress.deployed().then(function (instance) {
      congressInstance = instance;
      return congressInstance;
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

 /**
   * Applikation mit Web3 instanziieren nach dem Pet-Shop Tuorial
   */
App = {
    web3Provider: null,
    contracts: {},
    /**
     * Initialisiere Web3
     */
    init: function() {
        return App.initWeb3();
    },
    /**
     * Initialisiere Web3
     */
    initWeb3: function()
    {
      // Is there is an injected web3 instance?
      if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider;
      } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      }

      web3 = new Web3(App.web3Provider);
  
      return App.initContract();
    },
    /**
     * Initialisiere Contracts
     */
    initContract: function() {

      $.getJSON('Congress.json', function(data) {
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
         $(document).on('click', '.btn-join-congress', App.joinCongress); // Bind Button "Join" on Page "join_congress.html"
         $(document).on('click', '.btn-success0', App.votePositive0); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger0', App.voteNegative0); // Bind Button "Dismiss" on page "vote.html" 
         $(document).on('click', '.btn-success1', App.votePositive1); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger1', App.voteNegative1); // Bind Button "Dismiss" on page "vote.html" 
         $(document).on('click', '.btn-success2', App.votePositive2); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger2', App.voteNegative2); // Bind Button "Dismiss" on page "vote.html" 
         $(document).on('click', '.btn-success3', App.votePositive3); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger3', App.voteNegative3); // Bind Button "Dismiss" on page "vote.html" 
         $(document).on('click', '.btn-success4', App.votePositive4); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger4', App.voteNegative4); // Bind Button "Dismiss" on page "vote.html" 
         $(document).on('click', '.btn-success5', App.votePositive5); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger5', App.voteNegative5); // Bind Button "Dismiss" on page "vote.html" 
         $(document).on('click', '.btn-success6', App.votePositive6); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger6', App.voteNegative6); // Bind Button "Dismiss" on page "vote.html" 
         $(document).on('click', '.btn-success7', App.votePositive7); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger7', App.voteNegative7); // Bind Button "Dismiss" on page "vote.html" 
         $(document).on('click', '.btn-success8', App.votePositive8); // Bind Buotton "Agree" on page "vote.html"
         $(document).on('click', '.btn-danger8', App.voteNegative8); // Bind Button "Dismiss" on page "vote.html" 
     },
     
     /**
     * Congress Erstellen 
     */
     createCongress: function (event) {
      event.preventDefault();

      var minimumQuorumForProposals = document.getElementById("formInput85"); 
      var minutesForDebate = document.getElementById("formInput93");
      var marginOfVotesForMajority = document.getElementById("formInput99");
      var allMembers = document.getElementById("adresses");
      var allMembersCorrectString = allMembers.replace(/\s/g, "").replace(", ", "").replace("; ", ""); // geht das eleganter?
      var numberOfMembers = allMembersCorrectString.length / 42; //42 Chars für eine Adresse
      var members = [];

      for (i = 1; i < numberOfMembers; i++){ // Nulte Stelle nicht belegen im Array wegen der member[] Struktur im Dao
      
           members[i] = allMembers.slice(0, 42); //liefert erste Adresse
           allMembers = allMembers.substring(42, allMembers.lenght);    
        }

      var congressInstance;

        App.contracts.Congress.deployed().then(function(instance) {
         congressInstance = instance;

         return congressInstance.Congress(minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority); 
        }).then(function(result){
          return App.addMembers(members); 
        }).catch(function(err) {
          console.log(errmessage);
        });
      },
    
   /**
     * Member hinzufügen 
     */
    addMembers: function(members) {
      for (i = 1; i < members.length; i++){ // Nullte Stelle nicht belegen im Dao
       if (members[i] !== '0x0000000000000000000000000000000000000000') {
         congressInstance.addMember(member[i]);
       }
      }
    },

    /**
     * BMC Erstellen 
     */
    createBMC: function(event){
      var keyPartners = document.getElementById("partners");
      var keyActivities = document.getElementById("activities");
      var keyRessources = document.getElementById("ressources");
      var valueProposition = document.getElementById("value");
      var customerRelationship = document.getElementById("cr");
      var channels = document.getElementById("channels");
      var customerSegments = document.getElementById("cs"); 
      var costStructure = document.getElementById("cost");
      var revenueStream = document.getElementById("revenue");
      var bmc = [keyPartners, keyActivities, keyRessources, valueProposition, customerRelationship, channels, customerSegments, costStructure, revenueStream];
      // Zuordnung an stellen im Array bedingt die Struktur der Votingfunktionen
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
      
        for (i = 0; i < 9; i++){ 
        congressInstance.newProposal(bmc[i], transactionBytecode); //transactionbytecode?
        }
      }
    }, // hier verbirgt sich irgendwo oberhalb ein Komma- oder Semikolon-Fehler

    /**
     * Positiv wählen für Element Key-Partners. 
     */
    votePositive0: function(event){
      var proposalNumber = 0;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Key-Partners. 
     */
    voteNegative0: function(event){
      var proposalNumber = 0;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },
     /**
     * Positiv wählen für Element Key-Activities. 
     */
    votePositive1: function(event){
      var proposalNumber = 1;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Key-Activities. 
     */
    voteNegative1: function(event){
      var proposalNumber = 1;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },
     /**
     * Positiv wählen für Element Key-Ressources. 
     */
    votePositive2: function(event){
      var proposalNumber = 2;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Key-Ressources. 
     */
    voteNegative2: function(event){
      var proposalNumber = 2;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },
     /**
     * Positiv wählen für Element Valueproposition. 
     */
    votePositive3: function(event){
      var proposalNumber = 3;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Valueproposotion. 
     */
    voteNegative3: function(event){
      var proposalNumber = 3;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },
     /**
     * Positiv wählen für Element Customer Relationship. 
     */
    votePositive4: function(event){
      var proposalNumber = 4;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Customer Relationship. 
     */
    voteNegative4: function(event){
      var proposalNumber = 4;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },
     /**
     * Positiv wählen für Element Channels. 
     */
    votePositive5: function(event){
      var proposalNumber = 5;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Channels. 
     */
    voteNegative5: function(event){
      var proposalNumber = 5;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },
     /**
     * Positiv wählen für Element Customer Segments. 
     */
    votePositive6: function(event){
      var proposalNumber = 6;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Customer Segments. 
     */
    voteNegative6: function(event){
      var proposalNumber = 6;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },
     /**
     * Positiv wählen für Element Cost Structure. 
     */
    votePositive7: function(event){
      var proposalNumber = 7;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Cost Structure. 
     */
    voteNegative7: function(event){
      var proposalNumber = 7;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },
     /**
     * Positiv wählen für Element Revenue Stream. 
     */
    votePositive8: function(event){
      var proposalNumber = 8;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, true);
      }
    },
    /**
     * Negativ wählen für Element Revenue Stream. 
     */
    voteNegative8: function(event){
      var proposalNumber = 8;
      App.contracts.Congress.deployed().then(function(instance) {
        congressInstance = instance;
        congressInstance.vote(proposalNumber, false);
      }
    },

    

    /**
     * Congress beitreten
     */
    joinCongress: function(event){
      var adress = document.getElementById("formInput218"); // und ab hier?
      var adressCorrectString = adress.replace(/\s/g, "").replace(", ", "").replace("; ", "");
        
    },
    /**
     * Funktion, um eine Instance zu bekommen (Vielleicht geht das so auch, ansonsten benötigt jede function scheinbar:
     *  App.contracts.Congress.deployed().then(function(instance){
            congressInstance = instance;
        ) siehe Pet-Shop
     */
    getInstance: function() {
        var congressInstance;

        App.contracts.Congress.deployed().then(function(instance){
            congressInstance = instance;
            return congressInstance;
        })
    },
    
};

  /**
     * ? (Aus Pet-Shop)
     */
    $(function() {
      $(window).load(function() {
        App.init();
      });
    });
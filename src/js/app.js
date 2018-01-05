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
    // Get the necessary contract artifact file and instantiate it with truffle-contract
      var CongressArtifact = data;
      App.contracts.Congress = TruffleContract(CongressArtifact);

    // Set the provider for our contract
    App.contracts.Congress.setProvider(App.web3Provider);

      return App.bindEvents();
    },

     /**
     * Ab hier Applikationsfunktionalitäten
     */


     //bindEvents: function () {
     //    $(document).on('click', Buttonidentifier , App.eineFunktion);
     //}

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
    }
};
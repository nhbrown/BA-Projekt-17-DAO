var Congress = artifacts.require("Congress");

module.exports = function(deployer){
    deployer.deploy(Congress, 1, 5, 0);
};

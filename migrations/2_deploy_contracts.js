var Congress = artifacts.require("Congress");

module.exports = function(deployer){
    deployer.deploy(Congress, "Initial Deployment", 1, 5, 0);
};

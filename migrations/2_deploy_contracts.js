var Congress = artifacts.require("Congress");

module.exports = function(deployer){
    deployer.deploy(Congress, "Initial Deployment", 0, 1, 1, 1);
};

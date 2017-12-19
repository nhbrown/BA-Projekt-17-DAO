pragma solidity ^0.4.16;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Congress.sol";

/**
  * DAO Tests 
  */

contract TestCongress {
  Congress congress = Congress(DeployedAddresses.Congress());

  function testNewProposalAdded() {

  }

  function testAddNewMember() {

  } 

  function testDeleteMember() {

  } 

  function testChangeOwner() {

  }

  function testChangeOfVotingRules() {

  }

  function testAmountOfReceivedVoteTokens() {

  }

  function testCongressInitialised() {

  }

  function testVoteSuccessful() {

  }

}
pragma solidity ^0.4.11;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Congress.sol";

contract TestCongress {
  Congress congress = Congress(DeployedAddresses.Congress());

  address memberOne = 0x123;
  bool expectedTrue = true;
  bool expectedFalse = false;

  function testInitialMemberExists() public {
    Assert.equal(expectedTrue, congress.memberExists(0), "Member with address zero should exist.");
  }

  function testAddedMemberExists() public {
    congress.addMember(memberOne);

    Assert.equal(expectedTrue, congress.memberExists(memberOne), "Member with the address 0x123 should exist.");
  }

  function testGetContractAddress() public {
    Assert.equal(congress, congress.getContractAddress(), "The function getContractAddress should return the proper address of the contract");
  }
}

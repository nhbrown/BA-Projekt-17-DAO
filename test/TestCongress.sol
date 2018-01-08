pragma solidity ^0.4.11;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Congress.sol";

contract TestCongress {
  Congress congress = new Congress(1, 5, 0);

  address memberOne = 0x123;
  address memberTwo = 0x456;

  bool expectedTrue = true;
  bool expectedFalse = false;

  function testInitialMemberExists() public {
    Assert.equal(expectedTrue, congress.memberExists(0), "Member with address zero should exist.");
  }

  function testThisContractExistsAsMember() public {
    Assert.equal(expectedTrue, congress.memberExists(this), "This contracts address should exist as a member.");
  }

  function testAddedMemberExists() public {
    congress.addMember(memberOne);

    Assert.equal(expectedTrue, congress.memberExists(memberOne), "Member with the address 0x123 should exist.");
  }

  function testNotAddedMemberDoesNotExist() public {
    Assert.equal(expectedFalse, congress.memberExists(memberTwo), "Member with the address 0x456 should not exist.");
  }

  function testRemovedMemberDoesNotExist() public {
    congress.addMember(memberTwo);

    Assert.equal(expectedTrue, congress.memberExists(memberTwo), "Member with the address 0x456 should exist.");

    congress.removeMember(memberTwo);

    Assert.equal(expectedFalse, congress.memberExists(memberTwo), "Member with the address 0x456 should not exist.");
  }

  function testGetProperAddressOfContract() public {
    Assert.equal(congress, congress.getContractAddress(), "The proper address of the contract should be returned.");
  }

  function testOwnerOfCongressIsThisContract() public {
    Assert.equal(this, congress.owner(), "This contract should be the owner of the contract.");
  }
}

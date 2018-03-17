pragma solidity ^0.4.11;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Congress.sol";

// @dev Might not pass anymore, since we changed a lot in the contract
//      since we wrote this test cases. Needs to be rewritten if the
//      contract need to be tested.

contract TestCongress {
  Congress congress = new Congress(1, 5, 0);

  address memberOne = 0x123;
  address memberTwo = 0x456;

  function testInitialMemberExists() public {
    Assert.equal(true, congress.memberExists(0), "Member with address zero should exist.");
  }

  function testThisContractExistsAsMember() public {
    Assert.equal(true, congress.memberExists(this), "This contracts address should exist as a member.");
  }

  function testAddedMemberExists() public {
    congress.addMember(memberOne);

    Assert.equal(true, congress.memberExists(memberOne), "Member with the address 0x123 should exist.");
  }

  function testNotAddedMemberDoesNotExist() public {
    Assert.equal(false, congress.memberExists(memberTwo), "Member with the address 0x456 should not exist.");
  }

  function testRemovedMemberDoesNotExist() public {
    congress.addMember(memberTwo);

    Assert.equal(true, congress.memberExists(memberTwo), "Member with the address 0x456 should exist.");

    congress.removeMember(memberTwo);

    Assert.equal(false, congress.memberExists(memberTwo), "Member with the address 0x456 should not exist.");
  }

  /**
   * @dev This is unnecessary.
   */
  //function testGetProperAddressOfContract() public {
  //  Assert.equal(congress, congress.getContractAddress(), "The proper address of the contract should be returned.");
  //}

  function testOwnerOfCongressIsThisContract() public {
    Assert.equal(this, congress.owner(), "This contract should be the owner of the contract.");
  }

  function testVotingRulesAreSetProperly() public {
    Assert.equal(1, congress.minimumQuorum(), "The variable minimumQuorum should be 1.");
    Assert.equal(5, congress.debatingPeriodInMinutes(), "The variable debatingPeriodInMinutes should be 5.");
    Assert.equal(0, congress.majorityMargin(), "The variable majorityMargin should be 0.");
  }

  function testVotingRulesAreChangedProperly() public {
    congress.changeVotingRules(2, 10, 1);

    Assert.equal(2, congress.minimumQuorum(), "The variable minimumQuorum should be 2.");
    Assert.equal(10, congress.debatingPeriodInMinutes(), "The variable debatingPeriodInMinutes should be 10.");
    Assert.equal(1, congress.majorityMargin(), "The variable majorityMargin should be 1.");
  }

  function testCreatedProposalsExist() public {
    uint proposalID1 = congress.newProposal("This is the first test proposal.", "0x123"); //equal to 0, length is 1
    uint proposalID2 = congress.newProposal("This is the second test proposal.", "0x456"); //equal to 1, length is 2

    Assert.equal(true, congress.proposalExists(proposalID1), "The proposal with the ID 0 should exist.");
    Assert.equal(true, congress.proposalExists(proposalID2), "The proposal with the ID 1 should exist.");
  }

  function testNotCreatedProposalsDoNotExist() public {
    Assert.equal(false, congress.proposalExists(2), "The proposal with the ID 2 should not exist.");
    Assert.equal(false, congress.proposalExists(3), "The proposal with the ID 3 should not exist.");
  }

  function testMemberHasVoted() public {
    uint proposalID = congress.newProposal("This is the third test proposal.", "0x789"); //equal to 2, length is 3

    Assert.equal(true, congress.proposalExists(proposalID), "The proposal with the ID 2 should exist.");

    congress.vote(proposalID, true);

    Assert.equal(true, congress.memberHasVoted(this, proposalID), "This address should have voted.");
    Assert.equal(false, congress.memberHasVoted(memberOne, proposalID), "The member with the address 0x123 should not have voted.");
  }
}

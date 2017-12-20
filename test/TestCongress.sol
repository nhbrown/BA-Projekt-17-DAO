pragma solidity ^0.4.16;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Congress.sol";

/**
  * DAO Tests 
  */

contract TestCongress {
  Congress congress = Congress(DeployedAddresses.Congress());
  /**
    *  Testet, ob ProposalID´s übereinstimmen.
    */
  function testNewProposalAdded() {
    uint firstExpectedId = congress.newProposal(beneficiary, weiAmount, jobDescription, transactionByteCode);
    uint secondExpectedId = congress.newProposal(beneficiary, weiAmount, jobDescription, transactionByteCode);
    Assert.notEqual(firstExpectedId, secondExpectedId, "Id´s müssen sich unterscheiden");
  }
  /**
    *  Testet, ob ein neuer Member hinzugefügt wurde.
    */
  function testAddNewMember() {
    congress.addMember(tragetMember, membername);
    Member expectedAddedMember = Member[targetmember];
    Assert.equal(Member[targetMember], expectedAddedMember,"Member sollte in Member[] aufgenommen worden sein");
  } 
  /**
    *  Testet, ob ein spezifischer Member gelöscht wurde.
    */ 
  function testDeleteMember() {
    Member expectDeleted = congress.Member[targetmember];
    congress.removeMember(targetmember);
    Assert.notEqual(congress.Member[targetmember].member, expecteDeleted.member, "Member unterscheiden sich")
  } 
  /**
    *  Testet, ob der Owner geändert wurde.
    */
  function testChangeOwner() {
    address oldOwner = congress.owner;
    congress.transferOwnership(newOwner);
    address expectedOwner = congress.owner;
    Assert.notEqual(oldOwner, expectedOwner, "Adressen müssen sich unterscheiden.");
  }
  /**
    *  Testet, ob Wahlregeln verändert wurden .
    */
  function testChangeOfVotingRules() {
    uint oldMinimumQuorumForProposals = conress.minimumQuorumForProposals;
    uint oldMinutesForDebate = congress.minutesForDebate;
    int oldMarginOfVotesForMajority = congress.marginOfVotesForMajority;
    congress.changeVotingRules(minimumQuorumForProposals,minutesForDebate, marginOfVotesForMajority);
    Assert.notEqual(oldMinimumQuorumForProposals,conress.minimumQuorumForProposals, "Minimum Quorum soll verändert sein."); 
    Assert.notEqual(oldMinutesForDebate,congress.minutesForDebate, "Minuten sollen verändert sein."); 
    Assert.notEqual(oldMarginOfVotesForMajority, congress.marginOfVotesForMajority, "Margin soll verändert sein.");
  }
  /**
    *  Testet, . ???
    *  function testAmountOfReceivedVoteTokens() {}
    */

  /**
    *  Testet, .
    * function testCongressInitialised() {}
    * Konstruktor kann wohl nicht direkt gerufen werden.
    */
  
  /**
    *  Testet, ob gevoted wurde.
    */
  function testVoteSuccessful() {
    uint firstExpectedVoteId = congress.vote(proposalNumber, supportsProposal, justificationText);
    uint secondExpectedVoteId = congress.vote(proposalNumber, supportsProposal; justificationText);
    Assert.notEqual(firstExpectedVoteId, secondExpectedVoteId, "Zwei Abstimmungen sollen unterschiedliche ID´s haben.");
  }

}
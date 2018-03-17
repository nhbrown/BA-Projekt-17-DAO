pragma solidity ^0.4.16;

contract Owned {
    address public owner;

    function owned()  public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) onlyOwner  public {
        owner = newOwner;
    }
}

contract Congress is Owned {
    // Global variables of this contract
    string public congressName;                     // user defined name of this contract
    uint public minimumQuorum;                      // minimum amount of votes needed for a proposal to pass
    uint public debatingPeriodInMinutes;            // time to vote on every proposal of this contract
    uint public majorityMargin;                     // minimun amount of weighted votes in favour needed for a proposal to pass
    Proposal[] public proposals;                    // all proposals of this contract
    uint public numProposals;                       // amount of proposals this contract has
    mapping (address => uint) public memberId;      // maps an ethereum address to an unsigned integer
    Member[] public members;                        // all members of this contract

    // Events of this contract 
    event ProposalAdded(uint proposalID, string description);                                               // a proposal has been added
    event Voted(uint proposalID, bool position, address voter);                                             // a vote has occured
    event ProposalTallied(uint proposalID, uint result, uint quorum, bool active);                          // a proposal has been executed
    event MembershipChanged(address member, bool isMember);                                                 // the membership status of an address has changed
    event ChangeOfRules(uint newMinimumQuorum, uint newDebatingPeriodInMinutes, uint newMajorityMargin);    // the rules have been changed
    event VotingWeightChanged(address member, uint newWeight);                                                 // the voting weight of a member has changed

    // A single proposal
    struct Proposal {
        string description;                 // the description of this proposal     
        uint votingDeadline;                // the voting deadline for this proposal
        bool executed;                      // wether or not this proposal has been executed
        bool proposalPassed;                // wether or not this proposal passed
        uint numberOfVotes;                 // the amount of votes on this proposal
        uint inFavour;                      // the amount of votes in favour of this proposal
        uint opposedTo;                     // the amount of votes opposed to this proposal
        uint weightedInFavour;              // the accumulation of the weight of the votes in favour
        uint weightedOpposedTo;             // the accumulation of the weight of the votes opposed to
        uint currentResult;                 // the current result of this proposal
        Vote[] votes;                       // all votes which occured on this proposal
        mapping (address => bool) voted;    // maps an ethereum addres to a boolean
        bool isValid;                       // wether or not this proposal has had data added to it
    }

    // A single member
    struct Member {
        address memberAddress;              // address of this member
        uint weight;                        // vote weight of this member
    }

    // A single vote
    struct Vote {
        bool inSupport;                     // wether or not the vote was in favour
        address voter;                      // the address of the member who commited the vote
    }

    // Modifier that allows only members to execute a specific function.
    modifier onlyMembers {
        require(memberId[msg.sender] != 0);
        _;
    }

    /**
     * Constructor function
     *
     * Creates a new instance of this contract.
     *
     * @param name The name of this Congress.
     * @param weight The voting weight of the owner of this Congress.
     * @param minimumQuorumForProposals The minimum amount of votes needed for a proposal to pass.
     * @param minutesForDebate The amount of time in minutes to vote on every proposal of this contract.
     * @param marginOfVotesForMajority The minimun amount of weighted votes in favour needed for a proposal to pass.
     */
    function Congress (string name, uint weight, uint minimumQuorumForProposals, uint minutesForDebate, uint marginOfVotesForMajority) payable public {
        congressName = name; 

        changeVotingRules(minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority);
        
        addMember(0, 0); // it’s necessary to add an empty first member

        addMember(owner, weight);
    }

    /**
     * Add member
     *
     * Make a specific address a member of this contract.
     *
     * @param targetMember Ethereum address to be added.
     * @param voteWeight The weight the vote of this member has.
     */
    function addMember(address targetMember, uint voteWeight) onlyOwner public {
        uint id = memberId[targetMember];

        if (id == 0) {
            memberId[targetMember] = members.length;
            id = members.length++;
        }

        members[id].memberAddress = targetMember;
        members[id].weight = voteWeight;

        MembershipChanged(targetMember, false); // create a log of this event
    }

    /**
     * Remove member
     *
     * Remove the membership status of a specific address.
     *
     * @param targetMember Ethereum address to be removed.
     */
    function removeMember(address targetMember) onlyOwner public {
        require(memberId[targetMember] != 0);

        for (uint i = memberId[targetMember]; i<members.length-1; i++) {
            members[i] = members[i+1];
        }

        delete members[members.length-1];
        members.length--;

        MembershipChanged(targetMember, true);
    }

    /**
     * Change voting Weight
     *
     * Changes the voting weight of the specified member.
     *
     * @param targetMember Ethereum address of the member whose voting weight should be changed.
     * @param newWeight The new voting weight.
     */
    function changeVoteWeight(address targetMember, uint newWeight) onlyOwner public {
        require(memberId[targetMember] != 0);

        members[memberId[targetMember]].weight = newWeight;

        VotingWeightChanged(targetMember, newWeight);
    }

    /**
     * Change voting rules
     *
     * Changes the voting rules of this contract.
     *
     * @param minimumQuorumForProposals How many members must vote on a proposal for it to pass.
     * @param minutesForDebate The minimum amount of delay between when a proposal is made and when it can be executed.
     * @param marginOfVotesForMajority What the end result of weighted votes has to be in order for a proposal to pass.
     */
    function changeVotingRules(uint minimumQuorumForProposals, uint minutesForDebate, uint marginOfVotesForMajority) onlyOwner public {
        minimumQuorum = minimumQuorumForProposals;
        debatingPeriodInMinutes = minutesForDebate;
        majorityMargin = marginOfVotesForMajority;

        ChangeOfRules(minimumQuorum, debatingPeriodInMinutes, majorityMargin); // create a log of this event
    }

    /**
     * Add Proposal
     *
     * Propose a new element of the BMC.
     *
     * @param jobDescription Description of the specific element of the BMC.
     */
    function newProposal(
        string jobDescription
    )
        onlyOwner public
        returns (uint proposalID)
    {
        proposalID = proposals.length++;
        Proposal storage p = proposals[proposalID];
        p.description = jobDescription;
        p.votingDeadline = now + debatingPeriodInMinutes * 1 minutes;
        p.executed = false;
        p.proposalPassed = false;
        p.numberOfVotes = 0;
        p.inFavour = 0;
        p.opposedTo = 0;
        p.weightedInFavour = 0;
        p.weightedOpposedTo = 0;
        ProposalAdded(proposalID, jobDescription); // create a log of this event
        numProposals = proposalID+1;

        p.isValid = true; // data has been added

        return proposalID;
    }

    /**
     * Vote for a Proposal
     *
     * Logs a vote for a specific proposal.
     *
     * @param proposalNumber number of proposal
     * @param supportsProposal either in favor or against it
     */
    function vote(
        uint proposalNumber,
        bool supportsProposal
    )
        onlyMembers public
        returns (uint voteID)
    {
        Proposal storage p = proposals[proposalNumber]; // Get the proposal

        require(!p.voted[msg.sender]);                  // If this member has already voted, cancel
        p.voted[msg.sender] = true;                     // Set this voter as having voted
        p.numberOfVotes++;                              // Increase the number of votes

        uint voteWeight = members[memberId[msg.sender]].weight;

        if (supportsProposal) {                         // If they support the proposal
            p.inFavour += 1;                            // increase in favour votes by one and
            p.currentResult += voteWeight;              // increase score by vote weight and
            p.weightedInFavour += voteWeight;           // increase weighted in favour votes by vote weight.
        } else {                                        // If they don't
            p.opposedTo += 1;                           // increase opposed to votes by one and
            p.weightedOpposedTo += voteWeight;          // increase weighted opposed to and
            if (voteWeight > p.currentResult) {         // if the weight is bigger than the current result
                p.currentResult = 0;                    // set the current result to zero
            } else {                                    // otherweise
                p.currentResult -= voteWeight;          // decrease the score by vote weight.
            }
        }

        Voted(proposalNumber, supportsProposal, msg.sender); // create a log of this event
        return p.numberOfVotes;
    }

    /**
     * Finish vote
     *
     * Check wether or not this proposal has passed and execute it, if all conditions are met.
     *
     * @param proposalNumber The number of this proposal.
     */
    function executeProposal(uint proposalNumber) onlyOwner payable public {
        Proposal storage p = proposals[proposalNumber];

        // If it is past the voting deadline and it has not already been executed
        require(now >= p.votingDeadline);
        require(!p.executed);                                  

        // then execute this proposal
        if (p.currentResult >= majorityMargin && p.numberOfVotes >= minimumQuorum) {
            // Proposal passed
            p.executed = true;
            p.proposalPassed = true;
        } else {
            // Proposal failed
            p.executed = true;
            p.proposalPassed = false;
        }

        // Fire Events
        ProposalTallied(proposalNumber, p.currentResult, p.numberOfVotes, p.proposalPassed);
    }

    /**
     * Member exists
     * 
     * Check wether or not a given address is a member of this contract.
     * 
     * @param targetMember The address to be checked for member status.
     *
     * @return A boolean representing wether or not the given address is a member of this contract.
     */
    function memberExists(address targetMember) external view returns (bool) {
        uint id = memberId[targetMember];

        if (id >= members.length) {
            return false;
        }

        return members[id].memberAddress == targetMember;
    }

    /**
     * Proposal exists
     *
     * Check wether or not a proposal corresponding to the given proposalID exists.
     *
     * @param proposalID The ID of the proposal to be checked.
     * 
     * @return A boolean representing wether or not a proposal with the given ID was created.
     */
    function proposalExists(uint proposalID) external view returns (bool) {
        if (proposalID >= proposals.length) {
            return false;
        }

        return proposals[proposalID].isValid;
    }

    /**
     * Get proposal description
     * 
     * Return the description of a given proposal.
     *
     * @param proposalID The ID of the proposal.
     *
     * @return A string representing the description of the proposal.
     */
    function getProposalDescription(uint proposalID) public constant returns (string) {
        return proposals[proposalID].description;
    }

    /**
     * Check wether or not a member has successfully voted on a specific proposal.
     *
     * @dev This method really only exists for testing purposes. 
     *      Can probably be deprecated for production.
     *
     * @param targetMember The address of the member to be checked.
     * @param proposalID The ID of the proposal to be checked.
     * @return A boolean representing wether or not the specified member has successfully voted.
     */
    //function memberHasVoted(address targetMember, uint proposalID) external view returns (bool) {
    //    return proposals[proposalID].voted[targetMember];
    //}
}
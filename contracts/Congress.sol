pragma solidity ^0.4.16;

contract owned {
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

contract tokenRecipient {
    event receivedEther(address sender, uint amount);
    event receivedTokens(address _from, uint256 _value, address _token, bytes _extraData);

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) public {
        Token t = Token(_token);
        require(t.transferFrom(_from, this, _value));
        receivedTokens(_from, _value, _token, _extraData);
    }

    function () payable  public {
        receivedEther(msg.sender, msg.value);
    }
}

interface Token {
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success);
}

contract Congress is owned, tokenRecipient {
    // Contract Variables and events
    uint public minimumQuorum;
    uint public debatingPeriodInMinutes;
    int public majorityMargin;
    Proposal[] public proposals;
    uint public numProposals;
    mapping (address => uint) public memberId;
    address[] public members;

    event ProposalAdded(uint proposalID, string description);
    event Voted(uint proposalID, bool position, address voter);
    event ProposalTallied(uint proposalID, int result, uint quorum, bool active);
    event MembershipChanged(address member, bool isMember);
    event ChangeOfRules(uint newMinimumQuorum, uint newDebatingPeriodInMinutes, int newMajorityMargin);

    struct Proposal {
        string description;
        uint votingDeadline;
        bool executed;
        bool proposalPassed;
        uint numberOfVotes;
        int currentResult;
        bytes32 proposalHash;
        Vote[] votes;
        mapping (address => bool) voted;
        bool isValid; //set to true when data is added
    }

    struct Vote {
        bool inSupport;
        address voter;
    }

    // Modifier that allows only shareholders to vote and create new proposals
    modifier onlyMembers {
        require(memberId[msg.sender] != 0);
        _;
    }

    /**
     * Constructor function
     */
    function Congress (uint minimumQuorumForProposals, uint minutesForDebate, int marginOfVotesForMajority)  payable public {
        changeVotingRules(minimumQuorumForProposals, minutesForDebate, marginOfVotesForMajority);
        // It’s necessary to add an empty first member
        addMember(0);
        // and let's add the founder, to save a step later
        addMember(owner);
    }

    /**
     * Add member
     *
     * Make `targetMember` a member.
     *
     * @param targetMember ethereum address to be added
     */
    function addMember(address targetMember) onlyOwner public {
        uint id = memberId[targetMember];

        if (id == 0) {
            memberId[targetMember] = members.length;
            id = members.length++;
        }

        members[id] = targetMember;
        MembershipChanged(targetMember, true);
    }

    /**
     * Remove member
     *
     * @notice Remove membership from `targetMember`
     *
     * @param targetMember ethereum address to be removed
     */
    function removeMember(address targetMember) onlyOwner public {
        require(memberId[targetMember] != 0);

        for (uint i = memberId[targetMember]; i<members.length-1; i++) {
            members[i] = members[i+1];
        }
        delete members[members.length-1];
        members.length--;
    }

    /**
     * Change voting rules
     *
     * Make so that proposals need tobe discussed for at least `minutesForDebate/60` hours,
     * have at least `minimumQuorumForProposals` votes, and have 50% + `marginOfVotesForMajority` votes to be executed
     *
     * @param minimumQuorumForProposals how many members must vote on a proposal for it to be executed
     * @param minutesForDebate the minimum amount of delay between when a proposal is made and when it can be executed
     * @param marginOfVotesForMajority the proposal needs to have 50% plus this number
     */
    function changeVotingRules(uint minimumQuorumForProposals, uint minutesForDebate, int marginOfVotesForMajority) onlyOwner public {
        minimumQuorum = minimumQuorumForProposals;
        debatingPeriodInMinutes = minutesForDebate;
        majorityMargin = marginOfVotesForMajority;

        ChangeOfRules(minimumQuorum, debatingPeriodInMinutes, majorityMargin);
    }

    /**
     * Add Proposal
     *
     * Propose to send `weiAmount / 1e18` ether to `beneficiary` for `jobDescription`. `transactionBytecode ? Contains : Does not contain` code.
     *
     * @param jobDescription Description of job
     * @param transactionBytecode bytecode of transaction
     */
    function newProposal(
        string jobDescription,
        bytes transactionBytecode
    )
        onlyOwner public
        returns (uint proposalID)
    {
        proposalID = proposals.length++;
        Proposal storage p = proposals[proposalID];
        p.description = jobDescription;
        p.proposalHash = keccak256(transactionBytecode);
        p.votingDeadline = now + debatingPeriodInMinutes * 1 minutes;
        p.executed = false;
        p.proposalPassed = false;
        p.numberOfVotes = 0;
        ProposalAdded(proposalID, jobDescription);
        numProposals = proposalID+1;

        p.isValid = true; //data has been added

        return proposalID;
    }
    
    /**
     * Check if a proposal code matches
     *
     * @param proposalNumber ID number of the proposal to query
     * @param transactionBytecode bytecode of transaction
     */
    function checkProposalCode(
        uint proposalNumber,
        bytes transactionBytecode
    )
        constant public
        returns (bool codeChecksOut)
    {
        Proposal storage p = proposals[proposalNumber];
        return p.proposalHash == keccak256(transactionBytecode);
    }

    /**
     * Log a vote for a proposal
     *
     * Vote `supportsProposal? in support of : against` proposal #`proposalNumber`
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
        Proposal storage p = proposals[proposalNumber];         // Get the proposal
        require(!p.voted[msg.sender]);         // If has already voted, cancel
        p.voted[msg.sender] = true;                     // Set this voter as having voted
        p.numberOfVotes++;                              // Increase the number of votes
        if (supportsProposal) {                         // If they support the proposal
            p.currentResult++;                          // Increase score
        } else {                                        // If they don't
            p.currentResult--;                          // Decrease the score
        }

        // Create a log of this event
        Voted(proposalNumber,  supportsProposal, msg.sender);
        return p.numberOfVotes;
    }

    /**
     * Finish vote
     *
     * Count the votes proposal #`proposalNumber` and execute it if approved
     *
     * @param proposalNumber proposal number
     * @param transactionBytecode optional: if the transaction contained a bytecode, you need to send it
     */
    function executeProposal(uint proposalNumber, bytes transactionBytecode) public {
        Proposal storage p = proposals[proposalNumber];

        // If it is past the voting deadline and it has not already been executed
        // and the supplied code matches the proposal and a minimum quorum has been reached...
        require(now > p.votingDeadline && !p.executed && p.proposalHash == keccak256(transactionBytecode) && p.numberOfVotes >= minimumQuorum);                                  

        // ...then execute result
        if (p.currentResult > majorityMargin) {
            // Proposal passed; execute the transaction

            p.executed = true; // Avoid recursive calling
            //require(p.recipient.call.value(p.amount)(transactionBytecode));

            p.proposalPassed = true;
        } else {
            // Proposal failed
            p.proposalPassed = false;
        }

        // Fire Events
        ProposalTallied(proposalNumber, p.currentResult, p.numberOfVotes, p.proposalPassed);
    }

    /**
     * Check wether or not a given address exists as a member of this contract.
     * 
     * @param targetMember The address to be checked for member status.
     * @return A boolean representing wether or not the given address is a member of this contract.
     */
    function memberExists(address targetMember) external view returns (bool) {
        uint id = memberId[targetMember];

        if (id >= members.length) {
            return false;
        }

        return members[id] == targetMember;
    }

    /**
     * Check wether or not a proposal corresponding to the given proposalID exists.
     *
     * @param proposalID The ID of the proposal to be checked.
     * @return A boolean representing wether or not a proposal with the given ID was created.
     */
    function proposalExists(uint proposalID) external view returns (bool) {
        if (proposalID >= proposals.length) {
            return false;
        }

        return proposals[proposalID].isValid;
    }

    /**
     * Check wether or not a member has successfully voted on a specific proposal.
     *
     * @dev This method really only exists for testing purposes. 
            Can probably be disabled for production.
     *
     * @param targetMember The address of the member to be checked.
     * @param proposalID The ID of the proposal to be checked.
     * @return A boolean representing wether or not the specified member has successfully voted.
     */
    function memberHasVoted(address targetMember, uint proposalID) external view returns (bool) {
        return proposals[proposalID].voted[targetMember];
    }

    /**
     * Return the description of a given proposal.
     *
     * @param proposalID The ID of the proposal.
     * @return A string representing the description of the proposal.
     */
    function getProposalDescription(uint proposalID) public constant returns (string) {
        return proposals[proposalID].description;
    }
    /**
     * Returns the address of this contract.
     *
     * @dev Disabled because it is not useful. The address of a contract is public
            and therefore has an automatic getter method.
     * @return An address representing this contract.
     */
    //function getContractAddress() external view returns (address) {
    //    return this;
    //}

    /**
     * Getter for the array which holds the addresses of the members of this contract.
     * 
     * @dev Not really useful, because indexes are based on a mapping of the addresses 
            to unsigned integers, which could make accesing them outside of this contract
            potentially harder. The function memberExists is way more useful.
     * @return An array of addresses.
     */
    //function getMembers() external view returns (address[]) {
    //    return members;
    //}

    /**
     * Calculate Voting Information
     */

     function getVotingInformation() onlyowner public returns (uint[] counts) {

         //Proposal[] proposals = proposals; // contains all proposals
         Votes[] votesPartners = proposals[0].votes;
         Votes[] votesActivities = proposals[1].votes;
         Votes[] votesResources = proposals[2].votes;
         Votes[] votesValue = proposals[3].votes;
         Votes[] votesCustomerRelation = proposals[4].votes;
         Votes[] votesChannels = proposals[5].votes;
         Votes[] votesCustomerSegments = proposals[6].votes;
         Votes[] votesCosts = proposals[7].votes;
         Votes[] votesRevenueStream = proposals[8].votes;

         uint counterPositivePartners = 0;
         uint counterNegativePartners = 0;
         uint sumPartners = 0;
         uint counterPositiveActivities = 0;
         uint counterNegativeActivities = 0;
         uint sumActivities = 0;
         uint counterPositiveResources = 0;
         uint counterNegativeResources = 0;
         uint sumResources = 0;
         uint counterPositiveValue = 0;
         uint counterNegativeValue = 0;
         uint sumValue = 0;
         uint counterPositiveCustomerRelation = 0;
         uint counterNegativeCustomerRelation = 0;
         uint sumCustomerRelation = 0;
         uint counterPositiveChannels = 0;
         uint counterNegativeChannels = 0;
         uint sumChannels = 0;
         uint counterPositiveSegments = 0;
         uint counterNegativeSegments = 0;
         uint sumSegments = 0; 
         uint counterPositiveCosts = 0;
         uint counterNegativeCosts = 0;
         uint sumCosts = 0;
         uint counterPositiveRevenueStream = 0;
         uint counterNegativeRevenueStream = 0;
         uint sumRevenueStream = 0;
         uint[27] counts; 


         for (uint i = 0; i < votesPartners.length; i++)
         {
             if (votesPartners[i].inSupport) 
             {
                 counterPositivePartners = counterPositivePartners + 1;
             }
             else
             {
                 counterNegativePartners = counterNegativePartners + 1;
             }

         }
         sumPartners = counterPositivePartners + counterNegativePartners;
         counts[0] = counterPositivePartners;
         counts[1] = counterNegativePartners;
         counts[2] = sumPartners;

         for (uint i = 0; i < votesActivities.length; i++)
         {
             if (votesActivities[i].inSupport) 
             {
                 counterPositiveActivities = counterPositiveActivities + 1;
             }
             else
             {
                 counterNegativeActivities = counterNegativeActivities + 1;
             }

         }
         sumActivities = counterPositiveActivities + counterNegativeActivities;
         counts[3] = counterPositiveActivities;
         counts[4] = counterNegativeActivities;
         coutns[5] = sumActivities; 

         for (uint i = 0; i < votesResources.length; i++)
         {
             if (votesResources[i].inSupport) 
             {
                 counterPositiveResources = counterPositiveResources + 1;
             }
             else
             {
                 counterNegativeResources = counterNegativeResources + 1;
             }

         }
         sumResources = counterPositiveResources + counterNegativeResources;
         counts[6] = counterPositiveResources;
         counts[7] = counterNegativeResources;
         counts[8] = sumResources;

         for (uint i = 0; i < votesValue.length; i++)
         {
             if (votesValue[i].inSupport) 
             {
                 counterPositiveValue = counterPositiveValue + 1;
             }
             else
             {
                 counterNegativeValue = counterNegativeValue + 1;
             }

         }
         sumValue = counterPositiveValue + counterNegativeValue;
         counts[9] = counterPositiveValue;
         counts[10] = counterNegativeValue;
         counts[11] = sumValue;

         for (uint i = 0; i < votesCustomerRelation.length; i++)
         {
             if (votesCustomerRelation[i].inSupport) 
             {
                 counterPositiveCustomerRelation = counterPositiveCustomerRelation + 1;
             }
             else
             {
                 counterNegativeCustomerRelation = counterNegativeCustomerRelation + 1;
             }

         }
         sumCustomerRelation = counterPositiveCustomerRelation + counterNegativeCustomerRelation;
         counts[12] = counterPositiveCustomerRelation;
         counts[13] = counterNegativeCustomerRelation;
         coutns[14] = sumCustomerRelation;

         for (uint i = 0; i < votesChannels.length; i++)
         {
             if (votesChannels[i].inSupport) 
             {
                 counterPositiveChannels = counterPositiveChannels + 1;
             }
             else
             {
                 counterNegativeChannels = counterNegativeChannels + 1;
             }

         }
         sumChannels = counterPositiveChannels + counterNegativeChannels;
         counts[15] = counterPositiveChannels;
         counts[16] = counterNegativeChannels;
         counts[17] = sumChannels;

         for (uint i = 0; i < votesCustomerSegments.length; i++)
         {
             if (votesCustomerSegments[i].inSupport) 
             {
                 counterPositiveSegments = counterPositiveSegments + 1;
             }
             else
             {
                 counterNegativeSegments = counterNegativeSegments + 1;
             }

         }
         sumSegments = counterPositiveSegments + counterNegativeSegments;
         counts[18] = counterPositiveSegments;
         counts[19] = counterNegativeSegments;
         counts[20] = sumSegments;

         for (uint i = 0; i < votesCosts.length; i++)
         {
             if (votesCost[i].inSupport) 
             {
                 counterPositiveCosts = counterPositiveCosts + 1;
             }
             else
             {
                 counterNegativeCosts = counterNegativeCosts + 1;
             }

         }
         sumCosts = counterPositiveCosts + counterNegativeCosts;
         counts[21] = counterPositiveCosts;
         counts[22] = counterNegativeCosts;
         counts[23] = sumcosts;

         for (uint i = 0; i < votesRevenueStream.length; i++)
         {
             if (votesRevenueStream[i].inSupport) 
             {
                 counterPositiveRevenueStream = counterPositiveRevenueStream + 1;
             }
             else
             {
                 counterNegativeRevenueStream = counterNegativeRevenueStream + 1;
             }

         }
         sumRevenueStream = counterPositiveRevenueStream + counterNegativeRevenueStream;
         counts[24] = counterPositiveRevenueStream;
         counts[25] = counterNegativeRevenueStream;
         counts[26] = sumRevenueStream;

         return counts;


     }


}
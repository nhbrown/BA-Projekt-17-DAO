import "./Congress.sol";
pragma solidity ^0.4.16;


/**
* Disclaimer: This contract contains only ideas for a contract that manages all BMC-Congresses.
*             This contract is not finished and therefore not executable at this stage of development.
*/

/**
* A contract wich is managing all BMC-Voting Congresses
*/

/**
* Besitzer-Adresse
*/
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

contract ManageCongress is owned, tokenRecipient{
    //Congress[] public congresses;
    address[] public members;
    uint public numCongresses;
    mapping (address => uint) public memberId;
    Congress[] public congresses;
    //uint overAllCongresses;

    event CongressAdded(uint congressID, string name);
    
    //Congresse in denen noch abgestimmt werden kann
    struct openCongresses{
        Congress[] openCGR;
        uint counter;
    
    }

    //Congresse in denen nicht mehr abgestimmt werden kann
    struct closedCongresses{
        Congress[] closedCGR;
        uint counter;

    }
    
    /**
     * Constructor function
     */

    function ManageCongress() payable public {
        addMember(0);
        addMember(owner);
    }

      /**
     * Add member
     *
     * Make `targetMember` a member.
     *
     * @param targetMember ethereum address to be added
     */
    function addMember(address targetMemberCongress) onlyOwner public {
        uint id = memberId[targetMemberCongress];

        if (id == 0) {
            memberId[targetMemberCongress] = members.length;
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
    function removeMember(address targetMemberCongress) onlyOwner public {
        require(memberId[targetMemberCongress] != 0);

        for (uint i = memberId[targetMemberCongress]; i<members.length-1; i++) {
            members[i] = members[i+1];
        }
        delete members[members.length-1];
        members.length--;
    }

     /**
     * Add a new Congress to Struct Open Congresses
     */
     function addCongress(address targerMemberCongress) onlyOwner public returns (bool) {
       //Congress cgr = Congress(int minimumQuorumForProposals, uint minutesForDebate, int marginOfVotesForMajority); //?
       
       congressID = congresses.length++;
       openCGRID = openCongresses.openCGR.length++;
       Congress storage cgr = congresses[congressID]; //alle CGR
       Congress storage cgr = openCongresses.openCGR[openCGRID]; //open CGR
       openCongresses.counter = openCongresses.counter++;
       overAllCongresses = overAllCongresses++;
     }

     function moveToClosedCongresses(Congress cgr) onlyOwner public returns(bool){
        closedCongressID = closedCongresses.closedCGR.length++;
        Congress storage cgr = closedCongresses.closedCGR[closedCongressID];
        closedCongresses.counter = closedCongresses.counter++;
        openCongresses.counter = openCongresses.counter--;
        openCongresses.openCGR[cgr.ID] = 0xabc; 
     }

     function openCongress(address cgr) onlyOwner public returns(Congress){
         
         for (uint i = 0; i < openCongresses.openCGR.length; i++ ){
             if(openCongresses.openCGR[i].this == cgr){
             return openCongresses.openCGR[i];
             }
         }

        for (uint i = 0; i < closedCongresses.closedCGR.length; i++ ){
             if(closedCongresses.closedCGR[i].this == cgr){
             return closedCongresses.closedCGR[i];
             }
         }
     }

     
}
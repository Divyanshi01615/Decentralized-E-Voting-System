//import "../css/style.css"

const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts);

window.App = {
  eventStart: async function() {
    // Request account access if needed
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('MetaMask account access granted.');
    } catch (error) {
      console.error('MetaMask account access denied:', error);
      return;
    }

    VotingContract.setProvider(window.ethereum);
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    VotingContract.defaults({ from: accounts[0], gas: 6654755 });

    // Load account data
    App.account = accounts[0];
    $("#accountAddress").html("Your Account: " + accounts[0]);

    try {
      const instance = await VotingContract.deployed();
      const countCandidates = await instance.getCountCandidates();

      // Wrap DOM-related code inside document.ready
      $(document).ready(async function() {
        $('#addCandidate').click(async function() {
          var nameCandidate = $('#name').val();
          var partyCandidate = $('#party').val();
          try {
            await instance.addCandidate(nameCandidate, partyCandidate);
            console.log('Candidate added successfully.');
          } catch (error) {
            console.error('Error adding candidate:', error);
          }
        });

        $('#addDate').click(async function() {
          var startDate = Date.parse(document.getElementById("startDate").value) / 1000;
          var endDate = Date.parse(document.getElementById("endDate").value) / 1000;
          try {
            await instance.setDates(startDate, endDate);
            console.log('Dates set successfully.');
          } catch (error) {
            console.error('Error setting dates:', error);
          }
        });

        try {
          const dates = await instance.getDates();
          var startDate = new Date(dates[0] * 1000);
          var endDate = new Date(dates[1] * 1000);
          $("#dates").text(startDate.toDateString() + " - " + endDate.toDateString());
        } catch (error) {
          console.error('Error getting dates:', error);
        }

        for (var i = 0; i < countCandidates; i++) {
          try {
            const data = await instance.getCandidate(i + 1);
            var id = data[0];
            var name = data[1];
            var party = data[2];
            var voteCount = data[3];
            var viewCandidates = `<tr><td> <input class="form-check-input" type="radio" name="candidate" value="${id}" id="${id}">` + name + `</td><td>` + party + `</td><td>` + voteCount + `</td></tr>`;
            $("#boxCandidate").append(viewCandidates);
          } catch (error) {
            console.error('Error getting candidate:', error);
          }
        }

        window.countCandidates = countCandidates;

        try {
          const voted = await instance.checkVote();
          console.log('Voted:', voted);
          if (!voted) {
            $("#voteButton").attr("disabled", false);
          }
        } catch (error) {
          console.error('Error checking vote:', error);
        }
      });
    } catch (error) {
      console.error('Contract deployment or interaction error:', error);
    }
  },

  vote: async function() {
    var candidateID = $("input[name='candidate']:checked").val();
    if (!candidateID) {
      $("#msg").html("<p>Please vote for a candidate.</p>");
      return;
    }

    try {
      const instance = await VotingContract.deployed();
      await instance.vote(parseInt(candidateID));
      $("#voteButton").attr("disabled", true);
      $("#msg").html("<p>Voted</p>");
      window.location.reload(1);
    } catch (error) {
      console.error('Voting error:', error);
    }
  }
};

$(document).ready(async function() {
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source like MetaMask.");
    window.eth = new Web3(window.ethereum);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to MetaMask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }
  window.App.eventStart();
});

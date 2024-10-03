// Elements
const pollQuestionInput = document.getElementById('poll-question');
const optionsContainer = document.getElementById('options-container');
const createPollButton = document.getElementById('create-poll');
const addOptionButton = document.getElementById('add-option');
const pollDisplay = document.getElementById('poll-display');
const finishPollButton = document.getElementById('finish-poll');
const resultsChartCanvas = document.getElementById('resultsChart').getContext('2d');
const historyContainer = document.getElementById('history-container');
const clearHistoryButton = document.getElementById('clear-history');
const voteSection = document.getElementById('vote-section');

// Global Variables
let pollData = {};
let pollOptions = [];
let pollHistory = JSON.parse(localStorage.getItem('pollHistory')) || [];

// Add new poll option field
addOptionButton.addEventListener('click', () => {
    if (optionsContainer.children.length < 10) {
        const newOption = document.createElement('input');
        newOption.type = 'text';
        newOption.classList.add('poll-option');
        newOption.placeholder = `Enter option ${optionsContainer.children.length + 1}`;
        optionsContainer.appendChild(newOption);
    } else {
        alert('You can add a maximum of 10 options!');
    }
});

// Create Poll
function createPoll() {
    console.log('Create Poll function called'); // Debugging log
    const question = pollQuestionInput.value;
    pollOptions = Array.from(document.querySelectorAll('.poll-option')).map(input => input.value).filter(Boolean);
    
    console.log('Question:', question); // Debugging log
    console.log('Options:', pollOptions); // Debugging log
    
    if (question && pollOptions.length >= 2) {
        pollData = {
            question,
            options: pollOptions,
            votes: Array(pollOptions.length).fill(0),
            totalVotes: 0
        };
        console.log('Poll Data:', pollData); // Debugging log
        savePollToHistory(pollData);
        displayPoll();
        finishPollButton.style.display = 'block';
        
        // Clear input fields after creating poll
        pollQuestionInput.value = '';
        document.querySelectorAll('.poll-option').forEach(input => input.value = '');
        
        // Show the vote section
        voteSection.style.display = 'block';
        
        // Scroll to the voting section
        voteSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('Please enter a valid question and at least two options.');
    }
}

// Ensure the create poll button is properly connected
createPollButton.addEventListener('click', createPoll);

// Display Poll
function displayPoll() {
    console.log('Displaying poll:', pollData); // Debugging log
    pollDisplay.innerHTML = `<h3>${pollData.question}</h3>`;
    pollData.options.forEach((option, index) => {
        const voteButton = document.createElement('button');
        voteButton.textContent = option;
        voteButton.addEventListener('click', () => handleVote(index));
        pollDisplay.appendChild(voteButton);
    });
    console.log('Poll display updated'); // Debugging log
    
    // Make sure the vote section is visible
    voteSection.style.display = 'block';
}

// Handle Voting
function handleVote(index) {
    pollData.votes[index]++;
    pollData.totalVotes = (pollData.totalVotes || 0) + 1; // Update total votes
    localStorage.setItem('pollData', JSON.stringify(pollData));
    updateResultsChart();
    // Update the current poll in history
    const currentPollIndex = pollHistory.findIndex(p => p.question === pollData.question);
    if (currentPollIndex !== -1) {
        pollHistory[currentPollIndex] = pollData;
        localStorage.setItem('pollHistory', JSON.stringify(pollHistory));
    }
    displayPollHistory(); // Refresh the history display
}

// Update Chart with Poll Data
function updateResultsChart() {
    resultsChart.data.labels = pollData.options;
    resultsChart.data.datasets[0].data = pollData.votes;
    resultsChart.data.datasets[0].backgroundColor = '#4caf50'; // Updated chart color
    resultsChart.update();
}

// Initialize Chart
let resultsChart = new Chart(resultsChartCanvas, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Votes',
            data: [],
            backgroundColor: '#ff7e5f' // Initial chart color
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Save Poll to History
function savePollToHistory(poll) {
    console.log('Saving poll to history:', poll); // Debugging log
    // Calculate total votes before saving
    const totalVotes = poll.votes.reduce((sum, current) => sum + current, 0);
    poll.totalVotes = totalVotes; // Add totalVotes to the poll object
    
    // Check if the poll already exists in history
    const existingPollIndex = pollHistory.findIndex(p => p.question === poll.question);
    if (existingPollIndex !== -1) {
        // Update existing poll
        pollHistory[existingPollIndex] = poll;
    } else {
        // Add new poll
        pollHistory.push(poll);
    }
    
    localStorage.setItem('pollHistory', JSON.stringify(pollHistory));
    displayPollHistory();
}

// Display Poll History
function displayPollHistory() {
    historyContainer.innerHTML = '';
    pollHistory.forEach((poll, index) => {
        const pollElement = document.createElement('div');
        pollElement.classList.add('poll-history-item');
        
        pollElement.innerHTML = `
            <h3>${poll.question}</h3>
            <p class="total-votes">Total Votes: ${poll.totalVotes || 0}</p>
        `;
        
        if (poll.finished && poll.winner) {
            pollElement.innerHTML += `<p class="winner">Winner: ${poll.winner}</p>`;
        }
        
        poll.options.forEach((option, i) => {
            const votes = poll.votes[i] || 0;
            const percentage = poll.totalVotes > 0 ? ((votes / poll.totalVotes) * 100).toFixed(1) : 0;
            const ranking = poll.rankings ? poll.rankings[i] : '-';
            pollElement.innerHTML += `
                <p class="${ranking === 1 ? 'winner' : ''}">
                    ${option}: ${votes} votes (${percentage}%)
                    ${ranking === 1 ? '<span class="crown">👑</span>' : ''}
                    ${poll.rankings ? `<span class="ranking">Rank: ${ranking}</span>` : ''}
                </p>
            `;
        });
        
        historyContainer.appendChild(pollElement);
    });
}

// Clear Poll History
clearHistoryButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all poll history?')) {
        pollHistory = [];
        localStorage.removeItem('pollHistory');
        displayPollHistory();
        alert('Poll history has been cleared.');
    }
});

// Finish Poll
finishPollButton.addEventListener('click', () => {
    finishPollButton.style.display = 'none';
    pollDisplay.innerHTML = '';
    pollQuestionInput.value = '';
    optionsContainer.innerHTML = `
        <input type="text" class="poll-option" placeholder="Enter option 1">
        <input type="text" class="poll-option" placeholder="Enter option 2">
    `;
    updateResultsChart();

    // Calculate rankings and determine the winner
    const sortedOptions = pollData.options
        .map((option, index) => ({ option, votes: pollData.votes[index] }))
        .sort((a, b) => b.votes - a.votes);

    pollData.rankings = pollData.options.map(option => 
        sortedOptions.findIndex(item => item.option === option) + 1
    );

    pollData.winner = sortedOptions[0].option;
    pollData.finished = true;

    // Update the current poll in history
    const currentPollIndex = pollHistory.findIndex(p => p.question === pollData.question);
    if (currentPollIndex !== -1) {
        pollHistory[currentPollIndex] = pollData;
    } else {
        pollHistory.push(pollData);
    }
    localStorage.setItem('pollHistory', JSON.stringify(pollHistory));

    displayPollHistory();
    pollData = {}; // Reset current poll data
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    voteSection.style.display = 'none';
    displayPollHistory();
    console.log('Create Poll Button:', createPollButton); // Debugging log
});

// Debugging: Log when create poll button is clicked
createPollButton.addEventListener('click', () => {
    console.log('Create Poll button clicked');
});
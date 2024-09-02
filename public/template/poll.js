async function loadPoll(pollId) {
    try {
        const response = await fetch(`/api/polls/${pollId}`);
        if (!response.ok) throw new Error("Failed to load poll data");
        const poll = await response.json();
        renderPoll(poll);
    } catch (error) {
        console.error(error);
        alert("Could not load poll data.");
    }
}

async function submitVote(pollId, selectedOption) {
    try {
        const response = await fetch(`/api/polls/vote/${pollId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedOption })
        });
        if (!response.ok) throw new Error("Failed to submit vote");
        const updatedPoll = await response.json();
        renderPoll(updatedPoll); // Update UI with new poll data
    } catch (error) {
        console.error(error);
        alert("Could not submit vote.");
    }
}

function renderCreatePollForm() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <h2 class="text-xl font-bold mb-4">Create a New Poll</h2>
        <form id="create-poll-form" class="space-y-4">
            <div>
                <label class="block">Question:</label>
                <input type="text" id="poll-question" class="w-full p-2 border rounded">
            </div>
            <div id="options-container">
                <label class="block">Options:</label>
                <input type="text" class="poll-option w-full p-2 border rounded mb-2">
                <input type="text" class="poll-option w-full p-2 border rounded mb-2">
            </div>
            <button type="button" id="add-option" class="bg-blue-500 text-white py-2 px-4 rounded">Add Option</button>
            <div>
                <label class="block">Duration (minutes):</label>
                <input type="number" id="poll-duration" class="w-full p-2 border rounded" min="1" max="1440" value="5">
            </div>
            <button type="submit" class="bg-green-500 text-white py-2 px-4 rounded">Create Poll</button>
        </form>
    `;

    document.getElementById('add-option').addEventListener('click', addOptionField);
    document.getElementById('create-poll-form').addEventListener('submit', createPoll);
}

function addOptionField() {
    const container = document.getElementById('options-container');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'poll-option w-full p-2 border rounded mb-2';
    container.appendChild(input);
}

async function createPoll(event) {
    event.preventDefault();

    const question = document.getElementById('poll-question').value;
    const options = Array.from(document.querySelectorAll('.poll-option')).map(input => input.value).filter(val => val.trim() !== '');
    const duration = document.getElementById('poll-duration').value;

    if (question.trim() === '' || options.length < 2) {
        alert("Please provide a question and at least two options.");
        return;
    }

    try {
        const response = await fetch('/api/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, options, duration })
        });
        if (!response.ok) throw new Error("Failed to create poll");
        const poll = await response.json();
        window.location.href = `?poll=${poll._id}`;
    } catch (error) {
        console.error(error);
        alert("Could not create poll.");
    }
}

function renderPoll(poll) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <h2 class="text-xl font-bold mb-4">${poll.question}</h2>
        <ul class="space-y-2">
            ${poll.options.map((option, index) => `
                <li>
                    <label>
                        <input type="radio" name="poll-option" value="${index}">
                        ${option.text}
                    </label>
                </li>
            `).join('')}
        </ul>
        <button id="vote-button" class="bg-green-500 text-white py-2 px-4 rounded mt-4">Vote</button>
        <div id="analytics" class="mt-6"></div>
    `;

    document.getElementById('vote-button').addEventListener('click', () => {
        const selectedOption = document.querySelector('input[name="poll-option"]:checked');
        if (selectedOption) {
            submitVote(poll._id, selectedOption.value);
        } else {
            alert("Please select an option.");
        }
    });

    renderAnalytics(poll);
}

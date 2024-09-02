function renderAnalytics(poll) {
    const analyticsContainer = document.getElementById('analytics');
    const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

    analyticsContainer.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Analytics</h3>
        <p>Total Votes: ${totalVotes}</p>
        <canvas id="pollChart" width="400" height="400"></canvas>
    `;

    const ctx = document.getElementById('pollChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: poll.options.map(option => option.text),
            datasets: [{
                data: poll.options.map(option => option.votes),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                                legend: {
                    position: 'top',
                    labels: {
                        color: '#000',
                        font: {
                            family: 'Courier New',
                            size: 14,
                        },
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const label = poll.options[tooltipItem.dataIndex].text;
                            const votes = poll.options[tooltipItem.dataIndex].votes;
                            const percentage = ((votes / totalVotes) * 100).toFixed(2);
                            return `${label}: ${votes} votes (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}


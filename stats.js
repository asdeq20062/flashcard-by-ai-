document.getElementById('statsFileInput').addEventListener('change', handleStatsFile);

function handleStatsFile(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        displayStats(content);
    };
    reader.readAsText(file);
}

function displayStats(content) {
    const lines = content.split('\n');
    lines.shift(); // Remove header line

    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = ''; // Clear previous content

    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Vocabulary</th>
            <th>Know Count</th>
            <th>Don't Know Count</th>
        </tr>
    `;

    lines.forEach(line => {
        if (line.trim() !== '') {
            const lastSpaceIndex = line.lastIndexOf(' ');
            const secondLastSpaceIndex = line.lastIndexOf(' ', lastSpaceIndex - 1);
            
            const vocab = line.substring(0, secondLastSpaceIndex).trim();
            const knowCount = line.substring(secondLastSpaceIndex, lastSpaceIndex).trim();
            const notKnowCount = line.substring(lastSpaceIndex).trim();

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vocab}</td>
                <td>${knowCount}</td>
                <td>${notKnowCount}</td>
            `;
            table.appendChild(row);
        }
    });

    statsContainer.appendChild(table);
}
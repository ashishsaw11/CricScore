import { MatchState, PlayerStats, Team } from '../../types';

const calculateSR = (runs: number, balls: number): string => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 100).toFixed(2);
};

const calculateEcon = (runs: number, overs: number, balls: number): string => {
    const totalBalls = overs * 6 + balls;
    if (totalBalls === 0) return '0.00';
    return ((runs / totalBalls) * 6).toFixed(2);
};

const getPlayerStatus = (player: PlayerStats): string => {
    if (player.isOut) return "Out";
    if (player.ballsFaced > 0 || player.runs > 0) return "Not Out";
    return "Did not bat";
}


const generateTeamCSV = (team: Team, opponentTeam: Team): string => {
    let csv = `\n"${team.name} Batting"\n`;
    csv += "Batsman,Status,Runs,Balls,SR\n";
    team.players.forEach(p => {
        if (p.runs > 0 || p.ballsFaced > 0 || p.isOut) {
            csv += `"${p.name}","${getPlayerStatus(p)}",${p.runs},${p.ballsFaced},${calculateSR(p.runs, p.ballsFaced)}\n`;
        }
    });

    csv += `\n"${opponentTeam.name} Bowling"\n`;
    csv += "Bowler,Overs,Runs,Wickets,Econ\n";
    opponentTeam.players.forEach(p => {
        if (p.oversBowled > 0 || p.ballsBowled > 0) {
            const overs = `${p.oversBowled}.${p.ballsBowled}`;
            csv += `"${p.name}",${overs},${p.runsConceded},${p.wicketsTaken},${calculateEcon(p.runsConceded, p.oversBowled, p.ballsBowled)}\n`;
        }
    });
    return csv;
};


export const exportMatchStateToCsv = (match: MatchState) => {
    const { teamA, teamB, resultMessage, scheduledTime } = match;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Match Scorecard\n`;
    csvContent += `"${teamA.name} vs ${teamB.name}"\n`;
    csvContent += `Date,"${new Date(scheduledTime).toLocaleDateString()}"\n`;
    csvContent += `Result,"${resultMessage || 'N/A'}"\n`;

    csvContent += `\n"${teamA.name} Score",${teamA.score}/${teamA.wickets}\n`;
    csvContent += `Overs,${teamA.overs}.${teamA.balls}\n`;
    csvContent += `"${teamB.name} Score",${teamB.score}/${teamB.wickets}\n`;
    csvContent += `Overs,${teamB.overs}.${teamB.balls}\n`;

    csvContent += generateTeamCSV(teamA, teamB);
    csvContent += generateTeamCSV(teamB, teamA);

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `${teamA.name}_vs_${teamB.name}_${new Date(scheduledTime).toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- New HTML Export Logic ---

const generateHtml = (match: MatchState): string => {
    const { teamA, teamB, resultMessage, scheduledTime, status } = match;

    const themeStyles = `
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 2rem;
                background-color: #f0f2f5;
                color: #374151;
                line-height: 1.5;
            }
            .container { 
                max-width: 800px;
                margin: auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                border: 1px solid #d1d5db;
                overflow: hidden;
            }
            .header {
                background-color: #228B22;
                color: white;
                padding: 1.5rem;
                text-align: center;
            }
            .header h1 { margin: 0; font-size: 2rem; }
            .header p { margin: 0.25rem 0 0; font-size: 1rem; opacity: 0.9; }
            .content { padding: 1.5rem; }
            .match-summary {
                text-align: center;
                padding: 1rem;
                background-color: #f9fafb;
                border-bottom: 1px solid #d1d5db;
            }
            .match-summary h2 { font-size: 1.5rem; margin: 0 0 0.5rem; color: #006400; }
            .match-summary p { margin: 0.25rem 0; color: #4b5563; font-size: 1.1rem; }
            .scorecard { margin-top: 2rem; }
            .scorecard h3 { 
                font-size: 1.25rem;
                border-bottom: 2px solid #228B22;
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }
            th, td {
                padding: 0.75rem;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
            }
            th {
                background-color: #f3f4f6;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #4b5563;
            }
            td.center, th.center { text-align: center; }
            tr:last-child td { border-bottom: none; }
            .bold { font-weight: 700; color: #111827; }

            @media (prefers-color-scheme: dark) {
                body { background-color: #111827; color: #d1d5db; }
                .container { background-color: #1f2937; border-color: #4b5563; }
                .header { background-color: #006400; }
                .match-summary { background-color: #374151; border-color: #4b5563; }
                .match-summary h2 { color: #22c55e; }
                .match-summary p { color: #9ca3af; }
                .scorecard h3 { border-color: #006400; }
                th { background-color: #374151; color: #9ca3af; }
                th, td { border-color: #4b5563; }
                .bold { color: #f9fafb; }
            }
        </style>
    `;

    const battingTable = (team: Team) => `
        <div class="scorecard">
            <h3>${team.name} Batting</h3>
            <table>
                <thead>
                    <tr>
                        <th>Batsman</th>
                        <th>Status</th>
                        <th class="center">R</th>
                        <th class="center">B</th>
                        <th class="center">SR</th>
                    </tr>
                </thead>
                <tbody>
                    ${team.players.filter(p => p.runs > 0 || p.ballsFaced > 0 || p.isOut).map(p => `
                        <tr>
                            <td class="bold">${p.name}</td>
                            <td>${getPlayerStatus(p)}</td>
                            <td class="center bold">${p.runs}</td>
                            <td class="center">${p.ballsFaced}</td>
                            <td class="center">${calculateSR(p.runs, p.ballsFaced)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    const bowlingTable = (team: Team) => `
        <div class="scorecard">
            <h3>${team.name} Bowling</h3>
            <table>
                <thead>
                    <tr>
                        <th>Bowler</th>
                        <th class="center">O</th>
                        <th class="center">R</th>
                        <th class="center">W</th>
                        <th class="center">Econ</th>
                    </tr>
                </thead>
                <tbody>
                    ${team.players.filter(p => p.oversBowled > 0 || p.ballsBowled > 0).map(p => `
                        <tr>
                            <td class="bold">${p.name}</td>
                            <td class="center">${p.oversBowled}.${p.ballsBowled}</td>
                            <td class="center">${p.runsConceded}</td>
                            <td class="center bold">${p.wicketsTaken}</td>
                            <td class="center">${calculateEcon(p.runsConceded, p.oversBowled, p.ballsBowled)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Scorecard: ${teamA.name} vs ${teamB.name}</title>
            ${themeStyles}
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Match Scorecard</h1>
                    <p>${teamA.name} vs ${teamB.name}</p>
                </div>
                <div class="match-summary">
                    <h2>${resultMessage || status}</h2>
                    <p>Match Date: ${new Date(scheduledTime).toLocaleDateString()}</p>
                    <p>${teamA.name}: <strong>${teamA.score}/${teamA.wickets}</strong> (${teamA.overs}.${teamA.balls})</p>
                    <p>${teamB.name}: <strong>${teamB.score}/${teamB.wickets}</strong> (${teamB.overs}.${teamB.balls})</p>
                </div>
                <div class="content">
                    ${battingTable(teamA)}
                    ${bowlingTable(teamB)}
                    <br/>
                    ${battingTable(teamB)}
                    ${bowlingTable(teamA)}
                </div>
            </div>
        </body>
        </html>
    `;
};

export const openMatchStateInNewTab = (match: MatchState) => {
    const htmlContent = generateHtml(match);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};

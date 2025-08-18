// excel-analytics-backend/utils/aiHelpers.js

// Function to format the raw Excel data (array of objects) into a string for AI
const formatDataForAI = (jsonData) => {
    if (!jsonData || jsonData.length === 0) {
        return "No data provided.";
    }

    // Option 1: Convert to CSV string (simple, but might be too long for large files)
    // const headers = Object.keys(jsonData[0] || {});
    // const csvRows = [
    //     headers.join(','),
    //     ...jsonData.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    // ];
    // return csvRows.join('\n');

    // Option 2: Convert to a summarized JSON string or truncated string (better for large files)
    // For simplicity and to avoid hitting token limits, let's just take a sample
    // and represent it as a JSON string, ensuring it's not excessively long.

    const MAX_ROWS_FOR_AI = 50; // Limit the number of rows sent to AI
    const dataSample = jsonData.slice(0, MAX_ROWS_FOR_AI);

    // Convert array of objects to a human-readable string.
    // For simple data, JSON.stringify works. For complex objects,
    // you might want to pick specific keys or flatten it.
    let formattedString = '';
    if (dataSample.length > 0) {
        // Get headers from the first object
        const headers = Object.keys(dataSample[0]);
        formattedString += headers.join('\t') + '\n'; // Tab-separated headers

        // Add data rows, tab-separated
        dataSample.forEach(row => {
            formattedString += headers.map(header => (row[header] !== undefined && row[header] !== null ? row[header].toString() : '')).join('\t') + '\n';
        });

        if (jsonData.length > MAX_ROWS_FOR_AI) {
            formattedString += `\n... (and ${jsonData.length - MAX_ROWS_FOR_AI} more rows. Only first ${MAX_ROWS_FOR_AI} rows sent for summary)`;
        }
    } else {
        formattedString = "The provided data is empty or has no recognizable format.";
    }

    return formattedString;
};

module.exports = {
    formatDataForAI,
};
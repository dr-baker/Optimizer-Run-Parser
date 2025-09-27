# JSON Optimizer Run Parser

A locally hosted web application for fetching JSON data from URLs and displaying it in a readable format using predefined rules.

## Features

- **JSON Fetching**: Fetch JSON data from any URL with support for various authentication methods
- **Authentication Support**: Bearer tokens, Basic auth, and API key authentication
- **Predefined Rules**: Built-in formatting rules for different data types (including Hive optimizer runs)
- **Custom Rules**: Define your own formatting rules using JSON configuration
- **Multiple Display Formats**: Pretty-print JSON, table format, and custom layouts
- **Export Options**: Copy to clipboard or download as JSON file
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Option 1: Simple File Server
1. Open a terminal in the project directory
2. Run: `python3 -m http.server 8000` (or `python -m http.server 8000` on Windows)
3. Open your browser to `http://localhost:8000`

### Option 2: Node.js Server (if you have Node.js installed)
1. Run: `node server.js`
2. Open your browser to `http://localhost:3000`

### Option 3: Direct File Opening
Simply open `index.html` in your web browser (note: CORS restrictions may apply when fetching external URLs)

## Usage

### Basic Usage
1. Enter the JSON URL in the "JSON URL" field
2. Select appropriate authentication method if needed
3. Choose a display rule set
4. Click "Fetch & Parse JSON"

### Authentication Methods

- **None**: No authentication required
- **Bearer Token**: For APIs that use Bearer token authentication
- **Basic Auth**: For username/password authentication (format: `username:password`)
- **API Key**: For APIs that use API key headers

### Display Rules

#### Default (Pretty Print)
Standard JSON formatting with syntax highlighting.

#### Hive Optimizer Runs
Predefined rules for Hive optimizer run data:
- Extracts run data from common key paths
- Displays data in table format
- Formats timestamps, percentages, and status badges
- Shows key metrics like accuracy, loss, model type, etc.

#### Custom Rules
Define your own formatting rules using JSON:

```json
{
  "keyPaths": ["data.runs", "runs"],
  "format": "table",
  "tableColumns": [
    { "key": "id", "label": "Run ID" },
    { "key": "timestamp", "label": "Time", "format": "date" },
    { "key": "status", "label": "Status", "format": "badge" },
    { "key": "score", "label": "Score", "format": "number" }
  ]
}
```

### Custom Rule Options

- **keyPaths**: Array of JSON paths to search for data
- **format**: Display format (`"table"` or `"json"`)
- **tableColumns**: Column definitions for table format
  - **key**: JSON path to the data
  - **label**: Display label for the column
  - **format**: Value formatting (`"date"`, `"percentage"`, `"duration"`, `"number"`, `"badge"`)

## Example URLs

The application comes pre-configured with your Hive optimizer URL:
```
https://ui.hive.services/?version=12.3.83.1757937519479#/updatesTracking/rawData/68cc36b85c1ebb38b32c331e
```

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── server.js           # Optional Node.js server
└── README.md           # This file
```

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### CORS Issues
If you encounter CORS errors when fetching external URLs:
1. Use the Node.js server (`node server.js`) which includes CORS headers
2. Or use a browser extension to disable CORS for local development

### Authentication Issues
- Ensure your authentication credentials are correct
- Check that the API endpoint supports the authentication method you're using
- Some APIs may require additional headers or different authentication formats

### Data Not Displaying
- Verify the JSON URL is accessible
- Check that the data structure matches your selected rule set
- Try the "Toggle Raw JSON" button to see the unformatted data

## Development

To modify or extend the application:

1. **Add new rule sets**: Edit the `formatData()` method in `script.js`
2. **Add new formatting options**: Extend the `formatValue()` method
3. **Modify UI**: Edit `index.html` and `styles.css`
4. **Add new features**: Extend the `JSONParser` class in `script.js`

## License

This project is open source and available under the MIT License.

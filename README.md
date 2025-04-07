# Playlist Scrapper

This repository contains scripts to download video playlists from `.m3u8` files and save them as `.mp4` files. The main script, `fetch.js`, is used to fetch and process video playlists.

## Prerequisites

1. Ensure you have [Node.js](https://nodejs.org/) installed on your system.
2. Install the required dependencies by running:
   ```bash
   npm install
   ```
3. Make sure `ffmpeg` is installed on your system. You can install it using Homebrew on macOS:
   ```bash
   brew install ffmpeg
   ```

## Usage

### Fetching Playlists

The `fetch.js` script is used to fetch video playlists and prepare them for download.

1. Open a terminal and navigate to the project directory:
   ```bash
   cd playlist-scrapper
   ```

2. Run the `fetch.js` script with the following command:
   ```bash
   node fetch.js <playlist-url> <series-name>
   ```
   Replace `<playlist-url>` with the URL of the playlist (e.g., `https://www.ymvid.com/play/5036`) and `<series-name>` with the name of the series folder (e.g., `高智能方程式`).

   Example:
   ```bash
   node fetch.js https://www.ymvid.com/play/5036 高智能方程式
   ```

3. The script will fetch the `.m3u8` file of all episodes into the specified series folder `downloads/<series-name>` and prepare them for download.

### Downloading Videos

After fetching the playlists, use the `download.sh` script to download the videos:

1. Run the `download.sh` script with the series name:
   ```bash
   ./download.sh <series-name>
   ```
   Example:
   ```bash
   ./download.sh 高智能方程式
   ```

2. The videos will be downloaded to the `downloads/<series-name>-download` folder.

## Troubleshooting

- If you encounter issues with missing or corrupted video segments, ensure that the `.m3u8` files are accessible and the server hosting the segments is functioning correctly.
- Use the `-loglevel debug` option with `ffmpeg` for detailed logs.
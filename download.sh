#!/bin/bash

# Author: Calvin C. Chan <https://github.com/calvincchan>
#
# Function description: Download a list of videos from URLs to the current directory.
# Usage: ./download.sh <series>

# Requirements:
# - ffmpeg installed. You can install it using `brew install ffmpeg` on macOS or `sudo apt install ffmpeg` on Ubuntu.
# - List file with episode names and URLs

if [ -z "$1" ]; then
  echo "Usage: $0 <series>"
  exit 1
fi

series="$1"
names=()
urls=()

download_dir="${series}-download"
list_file="${series}/list.txt"
echo "📂 Downloading to directory: $download_dir"
echo "📜 List file: $list_file"

# Create the base directory if it doesn't exist
mkdir -p "$download_dir"

while IFS= read -r line; do
  # Extract the episode name and URL
  name=$(echo "$line" | sed -E 's/^(.*)\.m3u8.*/\1/')
  url="${series}/${line}"

  # Store the name and URL in arrays
  names+=("$name")
  urls+=("$url")
done < "$list_file"

# Execute each command using the arrays
for i in "${!names[@]}"; do
  name="${names[$i]}"
  url="${urls[$i]}"
  # validate the URL and name
  if [ -z "$url" ] || [ -z "$name" ]; then
    echo "❌ Invalid URL \"$url\" or name \"$name\""
    continue
  fi
  temp_file="${download_dir}/${name}.tmp.mp4"
  final_file="${download_dir}/${name}.mp4"
  if [ -f "$final_file" ]; then
    echo "⚠️  Skipping \"${name}.mp4\" as it already exists"
    continue
  fi
  echo "🚀 Downloading \"${name}.mp4\" from \"$url\""
  
  # Ensure URLs in the m3u8 file are absolute
  absolute_url=$(dirname "$url")
  
  # Update ffmpeg command to handle m3u8 files more robustly
  ffmpeg -loglevel error -protocol_whitelist "file,crypto,data,https,tcp,tls" -allowed_extensions ALL -i "$url" -c copy "$temp_file"
  
  if [ $? -eq 0 ]; then
    mv "$temp_file" "$final_file"
    echo "✨ Completed downloading \"${name}.mp4\""
  else
    rm -f "$temp_file"
    echo "❌ Failed to download \"${name}.mp4\""
  fi
done

echo "✅ Script ended"
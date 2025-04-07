#!/usr/bin/env node

require('dotenv').config();

console.log("Hello, this is the playlist-scrapper CLI!");

const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const path = require('path');

const QUERY_PATTERN = '/allocate/playlist/'; /* Refactor hardcoded pattern to a constant */
const COOKIES_PATH = path.resolve(__dirname, 'cookies.json');
const BROWSER_STATE_PATH = path.resolve(__dirname, 'browser_state.json');

async function saveCookies(page) {
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved to', COOKIES_PATH);
}

async function loadCookies(page) {
    if (fs.existsSync(COOKIES_PATH)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
        await page.setCookie(...cookies);
        console.log('Cookies loaded from', COOKIES_PATH);
    }
}

async function fetchPlaylist(browser, url) {
    const page = await browser.newPage();

    await loadCookies(page);

    let result = "";
    page.on('response', async response => {
        if (response.url().includes(QUERY_PATTERN)) {
            const responseBody = await response.text();
            console.log(`Response body for URL matching "${QUERY_PATTERN}":`);
            result = responseBody;
        }
    });

    console.log(`Opening URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    /* Wait for the page to fully load before handling the popup */
    await page.waitForSelector('body'); /* Ensure the page's body is fully loaded */

    /* Handle popup by clicking the close button if it exists */
    const popupCloseButtonSelector = '.pop-close-btn';
    if (await page.$(popupCloseButtonSelector)) {
        console.log('Popup detected. Clicking the close button.');
        await page.click(popupCloseButtonSelector);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('Popup closed.');
    }

    await saveCookies(page);
    await page.close();

    return result;
}

async function fetchAllPlaylistUrls(browser, url) {
    const page = await browser.newPage();

    await loadCookies(page);

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the playlist container to load
    await page.waitForSelector('ul.play-list');

    // Extract all <a> tags with hrefs and their text content inside the playlist container
    const hrefsMap = await page.$$eval('ul.play-list a', anchors => 
        anchors.reduce((map, anchor) => {
            map[anchor.href] = anchor.textContent.trim();
            return map;
        }, {})
    );

    await saveCookies(page);

    await page.close();

    return hrefsMap;
}

async function main() {
    const url = process.argv[2];
    const series_name = process.argv[3];

    /* Check if URL is provided */
    try {
        new URL(url);
    } catch (err) {
        console.log("Invalid URL provided. Please provide a valid URL.");
        process.exit(1);
    }

    /* Check if series name is provided */
    if (!series_name) {
        console.log("Series name not provided. Please provide a series name.");
        process.exit(1);
    }

    /* Prepare browser */
    const browser = await puppeteer.launch({ headless: true });

    /* Assuming this is the top page of a series, fetch all urls of the sub-level pages */
    const pages = await fetchAllPlaylistUrls(browser, url);
    console.log('Fetched playlist URLs:', pages);

    /* Create a directory for the series */
    const seriesDir = path.join(".", "downloads", series_name);
    if (!fs.existsSync(seriesDir)) {
        fs.mkdirSync(seriesDir, { recursive: true });
        console.log(`Directory created: ${seriesDir}`);
    } else {
        console.log(`Directory already exists: ${seriesDir}`);
    }

    /* Prepare the list of playlist URLs */
    let listFile = [];

    /* Fetch and save each playlist file */
    for (const [href, name] of Object.entries(pages)) {
        const playlist = await fetchPlaylist(browser, href);
        if (playlist) {
            console.log(`Playlist data fetched successfully for ${name}:`);

            /* Save to file */
            const filePath = path.join(seriesDir, `${name}.m3u8`);
            fs.writeFileSync(filePath, playlist);
            console.log(`Playlist saved to ${filePath}`);

            /* Append to list file */
            listFile.push(`${name.replace("-","_")}-${path.join(seriesDir, name+".m3u8")}`);
        } else {
            console.log(`No playlist data found for ${name}.`);
        }
    }

    /* Save the list file as list.txt */
    const listFilePath = path.join(seriesDir, 'list.txt');
    fs.writeFileSync(listFilePath, listFile.join('\n'));

    await browser.close();
    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
})
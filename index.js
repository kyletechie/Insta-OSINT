/*
  ========================================================
                  Instagram-OSINT (Node.js)  
  --------------------------------------------------------
  Author    : Kyle Tilano (Kairu)  
  GitHub    : https://github.com/Kairu-bit/Insta-OSINT 
  Contact   : kyletilano@gmail.com  
  Website   : https://kairudev.vercel.app  
  License   : MIT  
  Legal Note: Use this tool responsibly and only for ethical 
              hacking, research, and security assessments. 
              Unauthorized use may violate laws and platform 
              terms of service.  
  ========================================================
*/

import cheerio from "cheerio";
import fs from "fs";
import axios from "axios";
import { exit } from "process";
import path from "path";

const username = process.argv[2];

const logsDir = path.join(process.cwd(), "logs");

if (!username){
  console.log(`Usage: npm start <username>`);
  exit(0);
}

console.log(`Coded by: Kyle/Kairu (Sun Mar 23 18:45:24 PST 2025)`);
const html = await searchIG(username);

String.prototype.toTitle = function(){
  return this.slice(0x0, 0x1).toUpperCase() + this.slice(0x1);
}

/**
 * Fetches the HTML content of an Instagram profile page.
 * @param {string} username - The Instagram username to search for.
 * @returns {Promise<string|null>} Resolves with the HTML content of the profile page or `null` if an error occurs.
 */
async function searchIG(username) {
  try {
    const { data } = await axios.get(`https://www.instagram.com/${username}`);
    if (!fs.existsSync(logsDir)){
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(logsDir, `${username}.log`), data);
    return data;
  } catch (e) {
    console.log(`Failed to fetch profile for ${username}: ${e.message}`);
    exit(1);
  }
}

/**
 * Extracts the full name from an Instagram profile page's HTML.
 * @param {string} data - The HTML content of the Instagram profile page.
 * @returns {string|null} The extracted name or `null` if the name is not found.
 */
function getName(data) {
  try{
    const $ = cheerio.load(data);
    const name = $('meta[property="og:title"]').attr("content");

    if (!name) {
      return null; // Profile does not exist
    }

    const formattedName = name.includes("(") 
      ? name.split("(")[0].trim().toTitle() 
      : username.toTitle();

    return formattedName ? formattedName : username.toTitle();
  }
  catch(error){
    console.log("Error extracting name:", error.message);
    return null;
  }
}

/**
 * Get Followers, Following, and Posts.
 * @typedef {Object} FFP
 * @property {string} Followers
 * @property {string} Following
 * @property {string} Posts
 */

/**
 * Extracts followers, following, and post count from HTML.
 * @param {string} data - The HTML content as a string.
 * @returns {FFP} An object containing Followers, Following, and Posts count.
 */
function getFFP(data) {
  try{
    const $ = cheerio.load(data);
    const ffp = $('meta[property="og:description"]').attr("content");
    const formattedFFPArr = ffp.split("-")[0].split(" ").filter(Boolean);
    let ffpObject = {};
    for (let i = 0; i < formattedFFPArr.length; i += 2) {
      const valAfter = formattedFFPArr[i + 1];
      ffpObject[valAfter === "Posts" ? valAfter : valAfter.slice(0, -1)] = formattedFFPArr[i];
    }
    //console.log(ffpObject);
    return /** @type {FFP} */ (ffpObject);
  }
  catch(error){
    console.log("Error extracting ffp:", error.message);
    return { "Followers": "?", "Following": "?", "Posts": "?" };
  }
}

/**
 * Extracts the bio from the provided HTML data.
 * @param {string} data - The HTML content to parse.
 * @returns {string} The extracted bio or "None" if not found.
 */
function getBio(data) {
  try {
    const $ = cheerio.load(data);
    const bio = $('meta[name="description"]').attr("content");
    if (!bio) return "None";

    const formattedBio = bio.split('"')[1]?.trim();
    return formattedBio.split("\n").join(" ") || "None";
  } catch (error) {
    console.error("Error extracting bio:", error.message);
    return "None";
  }
}

/**
 * Extracts the ID from the provided data string.
 * @param {string} data - The string containing the ID.
 * @returns {string} The extracted ID or an error message.
 */
function getID(data) {
  try {
    const idMatch = data.match(/"props":{"id":"(.*?)"/);
    if (!idMatch || !idMatch[1]) throw new Error("ID not found");

    return idMatch[1];
  } catch (error) {
    console.error("Error extracting ID:", error.message);
    return "None";
  }
}

function main(){
  const name = getName(html);
  if (!name){
    console.log(`${username} does not exist.`);
    exit(0);
  }
  const { Followers, Following, Posts } = getFFP(html);
  const bio = getBio(html);
  const id = getID(html);
  console.log(`- Name > ${name} (@${username})`);
  console.log(`- Bio > ${bio}`);
  console.log(`- Followers > ${Followers}`);
  console.log(`- Following > ${Following}`);
  console.log(`- Posts > ${Posts}`);
  console.log(`- ID > ${id}`);
}

main();

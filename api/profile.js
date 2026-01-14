// api/profile.js
const fs = require("fs");
const path = require("path");

export default async function handler(req, res) {
  try {
    const { username } = req.query;

    // 1. Read the index.html from the build folder
    const filePath = path.join(process.cwd(), "public", "index.html");
    let html = fs.readFileSync(filePath, "utf8");

    // 2. Define the new Dynamic Data
    // TODO: Replace this with your actual Firebase Fetch logic later
    const dynamicImage = `https://portfolime-roan.vercel.app/api/og-image?username=${username}`; // Placeholder
    const dynamicTitle = `${username}'s Portfolio | PortfoliMe`;
    const dynamicDesc = `Check out ${username}'s projects and skills on PortfoliMe.`;

    // 3. Replace the DEFAULT tags with DYNAMIC tags
    // We target the specific strings we put in index.html
    html = html
      .replace(/PortfoliMe - Create Your Portfolio/g, dynamicTitle)
      .replace(
        /Showcase your projects and skills with a beautiful portfolio./g,
        dynamicDesc
      )
      .replace(
        /https:\/\/portfolime-roan.vercel.app\/logo512.png/g,
        dynamicImage
      );

    // 4. Send the updated HTML
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Error injecting profile metadata:", error);
    // Fallback: serve the normal file if anything breaks
    const filePath = path.join(process.cwd(), "public", "index.html");
    const html = fs.readFileSync(filePath, "utf8");
    return res.status(200).send(html);
  }
}

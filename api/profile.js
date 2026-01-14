// api/profile.js

export default async function handler(req, res) {
  try {
    const { username } = req.query;

    // 1. Fetch the BUILT index.html from the live site
    // We do this instead of fs.readFileSync because the built file has
    // %PUBLIC_URL% replaced and contains the React <script> tags.
    const builtFileUrl = "https://portfolime-roan.vercel.app/index.html";
    const response = await fetch(builtFileUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch source HTML: ${response.statusText}`);
    }

    let html = await response.text();

    // 2. Define the new Dynamic Data
    // TODO: Replace this with your actual Firebase Fetch logic later
    const dynamicImage = `https://portfolime-roan.vercel.app/api/og-image?username=${username}`; // Placeholder
    const dynamicTitle = `${username}'s Portfolio | PortfoliMe`;
    const dynamicDesc = `Check out ${username}'s projects and skills on PortfoliMe.`;

    // 3. Replace the DEFAULT tags with DYNAMIC tags
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

    // Fallback: If fetch fails, try to redirect to the normal hash route
    // or just return a simple error to avoid infinite loops.
    return res.status(500).send("Error loading profile preview.");
  }
}

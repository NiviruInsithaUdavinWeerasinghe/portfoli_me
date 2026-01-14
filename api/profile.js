// api/profile.js

export default async function handler(req, res) {
  try {
    const { username } = req.query;

    // ==========================================
    // STEP 1: Fetch Real User Data from Firestore
    // ==========================================
    // We use the REST API because it is faster and doesn't require complex SDK setup in Vercel functions.
    // NOTE: This assumes your Firestore Document ID is the same as the 'username'.
    // If your docs are stored by UID (e.g. users/UID), this fetch will fail and use the default image.
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/portfolime-d977a/databases/(default)/documents/users/${username}`;

    let userImage = "https://portfolime-roan.vercel.app/logo512.png"; // Default Fallback
    let userTitle = `${username}'s Portfolio | PortfoliMe`;
    let userDesc = `Check out ${username}'s projects and skills on PortfoliMe.`;

    try {
      const dbResponse = await fetch(firestoreUrl);
      if (dbResponse.ok) {
        const data = await dbResponse.json();
        // Firestore REST API returns fields in a specific format: { fields: { key: { stringValue: "..." } } }
        const fields = data.fields;

        if (fields) {
          // 1. Get Profile Picture
          if (fields.profilePicture && fields.profilePicture.stringValue) {
            userImage = fields.profilePicture.stringValue;
          }
          // 2. Get Bio (Optional - for description)
          if (fields.bio && fields.bio.stringValue) {
            userDesc = fields.bio.stringValue;
          }
          // 3. Get Full Name (Optional - for title)
          if (fields.displayName && fields.displayName.stringValue) {
            userTitle = `${fields.displayName.stringValue} | PortfoliMe`;
          }
        }
      }
    } catch (dbError) {
      console.warn("Failed to fetch user data, using defaults.", dbError);
    }

    // ==========================================
    // STEP 2: Fetch the Built HTML & Inject Tags
    // ==========================================
    const builtFileUrl = "https://portfolime-roan.vercel.app/index.html";
    const response = await fetch(builtFileUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch source HTML: ${response.statusText}`);
    }

    let html = await response.text();

    // Replace the specific Default Tags in your public/index.html
    html = html
      .replace(/PortfoliMe - Create Your Portfolio/g, userTitle)
      .replace(
        /Showcase your projects and skills with a beautiful portfolio./g,
        userDesc
      )
      .replace(/https:\/\/portfolime-roan.vercel.app\/logo512.png/g, userImage);

    // Send the modified HTML
    res.setHeader("Content-Type", "text/html");
    // Cache the result for 10 seconds to speed up repeated hits
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Error injecting profile metadata:", error);
    return res.status(500).send("Error loading profile preview.");
  }
}

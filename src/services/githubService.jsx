import axios from "axios";

// Helper to construct headers with the passed token
const getAuthHeaders = (token) => {
  return token ? { Authorization: `token ${token}` } : {};
};

// ACCEPT TOKEN AS ARGUMENT
export const fetchUserRepositories = async (username, token) => {
  if (!username) return [];

  try {
    const headers = getAuthHeaders(token);

    // --- 1. Start fetching Personal Repositories ---
    const userReposPromise = axios.get(
      `https://api.github.com/users/${username}/repos`,
      {
        headers,
        params: {
          type: "all",
          sort: "updated",
          per_page: 100,
        },
      }
    );

    // --- 2. Dynamically Fetch User's Organizations ---
    let orgReposPromises = [];
    try {
      // Get list of organizations the user is a member of
      const orgsResponse = await axios.get("https://api.github.com/user/orgs", {
        headers,
      });

      // For every organization found, create a request to fetch its repos
      orgReposPromises = orgsResponse.data.map((org) =>
        axios.get(`https://api.github.com/orgs/${org.login}/repos`, {
          headers,
          params: {
            sort: "updated",
            per_page: 100,
          },
        })
      );
    } catch (err) {
      console.warn(
        "Failed to fetch organizations list (check 'read:org' scope)",
        err
      );
    }

    // --- 3. Wait for ALL requests (Personal + All Orgs) ---
    // We combine the personal promise with the array of org promises
    const allPromises = [userReposPromise, ...orgReposPromises];

    const results = await Promise.allSettled(allPromises);

    // --- 4. Process and Merge Results ---
    const allRepos = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        // result.value.data contains the array of repositories from one source
        if (Array.isArray(result.value.data)) {
          allRepos.push(...result.value.data);
        }
      } else {
        console.warn("One of the repo fetch requests failed:", result.reason);
      }
    });

    // --- 5. Deduplicate (Map by ID) ---
    const repoMap = new Map();
    allRepos.forEach((repo) => {
      repoMap.set(repo.id, repo);
    });

    // --- 6. Return Clean Data ---
    return Array.from(repoMap.values()).map((repo) => ({
      id: repo.id,
      name: repo.full_name, // e.g., "facebook/react" or "username/my-repo"
      html_url: repo.html_url,
      description: repo.description,
      language: repo.language,
      languages_url: repo.languages_url,
      // Optional: Add owner info if you want to display org avatar
      owner_avatar: repo.owner?.avatar_url,
    }));
  } catch (error) {
    console.error("GitHub Fetch Error:", error);
    return [];
  }
};

// ACCEPT TOKEN AS ARGUMENT
export const fetchRepoLanguages = async (url, token) => {
  if (!url) return [];
  try {
    const response = await axios.get(url, {
      headers: getAuthHeaders(token),
    });
    return Object.keys(response.data);
  } catch (error) {
    console.error("Error fetching languages:", error);
    return [];
  }
};

// NEW: Validate Token & Username Match
export const validateGitHubToken = async (username, token) => {
  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${token}` },
    });

    const tokenOwner = response.data.login;

    if (tokenOwner.toLowerCase() !== username.toLowerCase()) {
      throw new Error(`Token belongs to "${tokenOwner}", not "${username}".`);
    }

    return true;
  } catch (error) {
    console.error("GitHub Validation Error:", error);
    throw error;
  }
};

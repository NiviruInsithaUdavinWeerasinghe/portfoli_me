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

    // 1. User Repos
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

    // 2. Org Repos
    const orgReposPromise = axios.get(
      `https://api.github.com/orgs/NIBM-HNDSE-Courseworks/repos`,
      {
        headers,
        params: {
          sort: "updated",
          per_page: 100,
        },
      }
    );

    const [userRes, orgRes] = await Promise.allSettled([
      userReposPromise,
      orgReposPromise,
    ]);

    const userRepos = userRes.status === "fulfilled" ? userRes.value.data : [];

    if (orgRes.status === "rejected") {
      console.warn("Org fetch failed (Check Token Scopes):", orgRes.reason);
    }
    const orgRepos = orgRes.status === "fulfilled" ? orgRes.value.data : [];

    // 3. Merge
    const repoMap = new Map();
    [...userRepos, ...orgRepos].forEach((repo) => {
      repoMap.set(repo.id, repo);
    });

    return Array.from(repoMap.values()).map((repo) => ({
      id: repo.id,
      name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      language: repo.language,
      languages_url: repo.languages_url,
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

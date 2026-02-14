// Server configuration

const config = {
    // Extension repository URL — points to a GitHub raw URL containing repo.json
    // Override with EXTENSION_REPO_URL environment variable
    extensionRepoUrl: process.env.EXTENSION_REPO_URL || 'https://raw.githubusercontent.com/user/radiant-space-extensions/main/repo.json',

    // Repo base URL for downloading extension files (directory containing the .js files)
    // Override with EXTENSION_REPO_BASE environment variable
    extensionRepoBase: process.env.EXTENSION_REPO_BASE || 'https://raw.githubusercontent.com/user/radiant-space-extensions/main/extensions/',
};

export default config;

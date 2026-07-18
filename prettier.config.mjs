/** @type {import("prettier").Config} */
const config = {
    printWidth: 100,
    singleQuote: false,
    tabWidth: 4,
    trailingComma: "all",
    overrides: [
        {
            files: "**/*.json",
            options: {
                tabWidth: 2,
            },
        },
    ],
    plugins: ["prettier-plugin-tailwindcss"],
};

export default config;

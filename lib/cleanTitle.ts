const cleanTitle = (title: string): string =>
    title
      .replace(/[-/\\[\]]/g, " ") // Replace slashes, backslashes, and square brackets with spaces
      .replace(/-/g, "")          // Remove dashes
      .replace(/\s+/g, " ")       // Replace multiple spaces with a single space
      .trim();                    // Trim leading and trailing spaces
  
  export default cleanTitle;
  
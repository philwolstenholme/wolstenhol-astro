import { airtableReadingList } from "./content/airtableReadingList";
import { bluesky } from "./content/bluesky";
import { devToPosts } from "./content/devToPosts";
import { devToReadingList } from "./content/devToReadingList";
import { githubStars } from "./content/githubStars";
import { instagram } from "./content/instagram";
import { places } from "./content/places";
import { portfolio } from "./content/portfolio";
import { speaking } from "./content/speaking";
import { spotify } from "./content/spotify";

export const collections = {
  "github-stars": githubStars,
  "dev-to-posts": devToPosts,
  "dev-to-reading-list": devToReadingList,
  "airtable-reading-list": airtableReadingList,
  bluesky,
  speaking,
  places,
  portfolio,
  spotify,
  instagram,
};

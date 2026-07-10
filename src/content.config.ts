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
  "airtable-reading-list": airtableReadingList,
  bluesky,
  "dev-to-posts": devToPosts,
  "dev-to-reading-list": devToReadingList,
  "github-stars": githubStars,
  instagram,
  places,
  portfolio,
  speaking,
  spotify,
};

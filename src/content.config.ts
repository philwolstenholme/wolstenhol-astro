import { airtableReadingList } from "./content/airtableReadingList";
import { devToPosts } from "./content/devToPosts";
import { devToReadingList } from "./content/devToReadingList";
import { githubStars } from "./content/githubStars";
import { places } from "./content/places";
import { speaking } from "./content/speaking";
import { spotify } from "./content/spotify";

export const collections = {
  "github-stars": githubStars,
  "dev-to-posts": devToPosts,
  "dev-to-reading-list": devToReadingList,
  "airtable-reading-list": airtableReadingList,
  speaking,
  places,
  spotify,
};

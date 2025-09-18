const pluralRules = new Intl.PluralRules("en-US");

export const pluralise = (count: number, singular: string, plural?: string) => {
  const rule = pluralRules.select(count);
  if (rule === "one") {
    return `${count} ${singular}`;
  }
  return `${count} ${plural ?? singular + "s"}`;
};

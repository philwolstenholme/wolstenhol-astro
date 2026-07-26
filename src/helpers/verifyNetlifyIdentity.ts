// Netlify Identity verification for API routes.
//
// The Eleventy version relied on Netlify injecting `context.clientContext.user`,
// but an Astro API route has to verify the bearer token itself. We ask the
// site's own GoTrue endpoint who the token belongs to, then check it is me.
export const OWNER_EMAIL = "philgw@gmail.com";

export const getVerifiedEmail = async (
  authHeader: string,
  origin: string,
): Promise<null | string> => {
  try {
    const response = await fetch(`${origin}/.netlify/identity/user`, {
      headers: { authorization: authHeader },
    });
    if (!response.ok) {
      return null;
    }
    const user = (await response.json()) as { email?: string };
    return user.email ?? null;
  } catch {
    return null;
  }
};

export const isOwner = async (authHeader: null | string, origin: string): Promise<boolean> => {
  if (!authHeader) {
    return false;
  }
  const email = await getVerifiedEmail(authHeader, origin);
  return email === OWNER_EMAIL;
};

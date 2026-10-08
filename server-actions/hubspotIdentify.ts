"use server";

const HS_API = "https://api.hubapi.com";

function hsHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function hubspotIdentify({ email }: { email: string }): Promise<{ ok: boolean }> {
  try {
    if (!email || typeof email !== "string") {
      return { ok: false };
    }

    const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    if (!token) {
      return { ok: false };
    }

    const headers = hsHeaders(token);
    const now = new Date().toISOString();

    // Step 1 — Upsert contact
    let contactId: string | undefined;

    const patchRes = await fetch(
      `${HS_API}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          properties: {
            inbound_source: "Demo - Fintech",
            inbound_note: `Signed into fintech-starter-app at ${now}`,
          },
        }),
      }
    );

    if (patchRes.status === 404) {
      const createRes = await fetch(`${HS_API}/crm/v3/objects/contacts`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          properties: {
            email,
            lifecyclestage: "lead",
            inbound_source: "Demo - Fintech",
            inbound_note: `Signed into fintech-starter-app at ${now}`,
          },
        }),
      });
      const created = await createRes.json();
      contactId = created?.id;
    } else {
      const patched = await patchRes.json();
      contactId = patched?.id;
    }

    if (!contactId) {
      return { ok: false };
    }

    // Step 2 — Check if contact already has an open Lead
    const assocRes = await fetch(
      `${HS_API}/crm/v4/objects/contacts/${contactId}/associations/leads`,
      { headers }
    );
    const assocData = await assocRes.json();
    const hasLead = Array.isArray(assocData?.results) && assocData.results.length > 0;

    if (!hasLead) {
      // Step 3a — Create a Lead object

      await fetch(`${HS_API}/crm/v3/objects/leads`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          properties: {
            hs_lead_name: email,
            hs_lead_type: "NEW BUSINESS",
            hs_lead_label: "WARM",
          },
          associations: [
            {
              to: { id: contactId },
              types: [
                {
                  associationCategory: "HUBSPOT_DEFINED",
                  associationTypeId: 578,
                },
              ],
            },
          ],
        }),
      });
    } else {
      // Step 3b — Create a Note engagement on the contact

      // 3b-i: Create note
      const noteRes = await fetch(`${HS_API}/crm/v3/objects/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          properties: {
            hs_note_body: `Demo visit: fintech-starter-app\nVisited at: ${now}\nEmail: ${email}`,
            hs_timestamp: Date.now(),
          },
        }),
      });
      const note = await noteRes.json();
      const noteId: string | undefined = note?.id;

      if (noteId) {
        // 3b-ii: Associate note to contact
        await fetch(`${HS_API}/crm/v3/associations/notes/contacts/batch/create`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            inputs: [
              {
                from: { id: noteId },
                to: { id: contactId },
                types: [
                  {
                    associationCategory: "HUBSPOT_DEFINED",
                    associationTypeId: 202,
                  },
                ],
              },
            ],
          }),
        });
      }
    }

    return { ok: true };
  } catch {
    // Never block sign-in — swallow all errors
    return { ok: false };
  }
}

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM =
  Deno.env.get("RESEND_FROM") ||
  "PickMyArtist <bookings@pickmyartist.com>";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing server configuration", { status: 500 });
  }

  const body = await req.json();
  const { enquiryId } = body ?? {};

  if (!enquiryId) {
    return new Response("Missing enquiryId", { status: 400 });
  }

  // Server-side lookup to avoid exposing secrets on the client.
  const enquiryResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/enquiries?id=eq.${enquiryId}&select=*,profiles:artist_id(display_name,email_public)`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!enquiryResponse.ok) {
    const errorText = await enquiryResponse.text();
    return new Response(errorText, { status: 500 });
  }

  const [enquiry] = await enquiryResponse.json();

  if (!enquiry) {
    return new Response("Enquiry not found", { status: 404 });
  }

  const artistEmail = enquiry.profiles?.email_public;
  const artistName = enquiry.profiles?.display_name || "your profile";

  if (!artistEmail) {
    return new Response("Artist email not available", { status: 400 });
  }

  const payload = {
    from: RESEND_FROM,
    to: [artistEmail],
    subject: `New enquiry for ${artistName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New enquiry from ${enquiry.name}</h2>
        <p><strong>Email:</strong> ${enquiry.email}</p>
        ${
          enquiry.event_date
            ? `<p><strong>Event date:</strong> ${enquiry.event_date}</p>`
            : ""
        }
        ${
          enquiry.event_location
            ? `<p><strong>Event location:</strong> ${enquiry.event_location}</p>`
            : ""
        }
        ${enquiry.budget ? `<p><strong>Budget:</strong> ${enquiry.budget}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${enquiry.message}</p>
        <hr />
        <p>Sent via PickMyArtist.</p>
      </div>
    `,
  };

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    return new Response(errorText, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
